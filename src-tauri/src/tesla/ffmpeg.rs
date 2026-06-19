use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use tauri::AppHandle;
use tauri::Manager;

use crate::error::{AppError, AppResult};
use crate::paths;

#[derive(Debug, Clone, Copy)]
pub struct ExportRange {
    pub start_secs: f64,
    pub duration_secs: f64,
}

pub fn normalize_export_range(
    trim_start: Option<f64>,
    trim_duration: Option<f64>,
    full_duration_secs: f64,
) -> AppResult<ExportRange> {
    match (trim_start, trim_duration) {
        (Some(start), Some(duration)) => {
            if !start.is_finite() || !duration.is_finite() || duration <= 0.0 {
                return Err(AppError::Message(
                    "Export segment start and duration must be valid positive numbers.".into(),
                ));
            }

            let start_secs = start.max(0.0);
            let max_duration = (full_duration_secs - start_secs).max(0.0);
            if max_duration <= 0.0 {
                return Err(AppError::Message(
                    "Export segment starts after the footage ends.".into(),
                ));
            }

            Ok(ExportRange {
                start_secs,
                duration_secs: duration.min(max_duration),
            })
        }
        (None, None) => Ok(ExportRange {
            start_secs: 0.0,
            duration_secs: full_duration_secs,
        }),
        _ => Err(AppError::Message(
            "Export segment requires both start and duration, or neither for a full clip.".into(),
        )),
    }
}

fn push_sidecar_candidates(candidates: &mut Vec<PathBuf>, base_dir: &Path) {
    candidates.push(base_dir.join("ffmpeg.exe"));
    candidates.push(base_dir.join("ffmpeg"));
    candidates.push(base_dir.join("binaries/ffmpeg.exe"));
    candidates.push(base_dir.join("binaries/ffmpeg"));

    if let Some(triple) = option_env!("TAURI_ENV_TARGET_TRIPLE") {
        candidates.push(base_dir.join(format!("ffmpeg-{triple}.exe")));
        candidates.push(base_dir.join(format!("binaries/ffmpeg-{triple}.exe")));
        candidates.push(base_dir.join(format!("ffmpeg-{triple}")));
        candidates.push(base_dir.join(format!("binaries/ffmpeg-{triple}")));
    }
}

fn executable_base_dir(exe: &Path) -> PathBuf {
    let exe_dir = exe.parent().unwrap_or_else(|| Path::new("."));
    if exe_dir.ends_with("deps") {
        exe_dir.parent().unwrap_or(exe_dir).to_path_buf()
    } else {
        exe_dir.to_path_buf()
    }
}

fn bundled_ffmpeg_candidates(app: &AppHandle) -> Vec<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(resource_dir) = app.path().resource_dir() {
        push_sidecar_candidates(&mut candidates, &resource_dir);
    }

    if let Ok(exe) = tauri::utils::platform::current_exe() {
        let base_dir = executable_base_dir(&exe);
        push_sidecar_candidates(&mut candidates, &base_dir);

        if let Ok(entries) = fs::read_dir(&base_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file()
                    && path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .is_some_and(|name| name.starts_with("ffmpeg") && name.ends_with(".exe"))
                {
                    candidates.push(path);
                }
            }
        }
    }

    if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        let binaries_dir = PathBuf::from(manifest_dir).join("binaries");
        push_sidecar_candidates(&mut candidates, &binaries_dir);
    }

    candidates
}

fn find_bundled_ffmpeg(app: &AppHandle) -> Option<PathBuf> {
    bundled_ffmpeg_candidates(app)
        .into_iter()
        .find(|candidate| candidate.is_file())
}

fn should_refresh_cache(source: &Path, cache: &Path) -> bool {
    if !cache.is_file() {
        return true;
    }

    let Ok(source_meta) = fs::metadata(source) else {
        return false;
    };
    let Ok(cache_meta) = fs::metadata(cache) else {
        return true;
    };

    let Ok(source_modified) = source_meta.modified() else {
        return false;
    };
    let Ok(cache_modified) = cache_meta.modified() else {
        return true;
    };

    source_modified > cache_modified
}

fn copy_ffmpeg_to_cache(source: &Path, cache: &Path) -> AppResult<()> {
    if let Some(parent) = cache.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::copy(source, cache).map_err(|error| {
        AppError::Message(format!(
            "Failed to cache FFmpeg from {} to {}: {error}",
            source.display(),
            cache.display()
        ))
    })?;

    Ok(())
}

/// Copies the bundled FFmpeg sidecar into app data so shortcuts and lone exe copies still work.
pub fn ensure_ffmpeg_cached(app: &AppHandle) -> AppResult<()> {
    let cache = paths::ffmpeg_cache_path();
    let Some(bundled) = find_bundled_ffmpeg(app) else {
        return Ok(());
    };

    if should_refresh_cache(&bundled, &cache) {
        copy_ffmpeg_to_cache(&bundled, &cache)?;
    }

    Ok(())
}

pub fn resolve_ffmpeg(app: &AppHandle) -> AppResult<PathBuf> {
    let _ = ensure_ffmpeg_cached(app);

    let cache = paths::ffmpeg_cache_path();
    if cache.is_file() {
        return Ok(cache);
    }

    if let Some(bundled) = find_bundled_ffmpeg(app) {
        let _ = copy_ffmpeg_to_cache(&bundled, &cache);
        if cache.is_file() {
            return Ok(cache);
        }
        return Ok(bundled);
    }

    if let Ok(path_var) = std::env::var("PATH") {
        #[cfg(windows)]
        let separator = ';';
        #[cfg(not(windows))]
        let separator = ':';

        #[cfg(windows)]
        let name = "ffmpeg.exe";
        #[cfg(not(windows))]
        let name = "ffmpeg";

        for dir in path_var.split(separator) {
            let candidate = Path::new(dir).join(name);
            if candidate.is_file() {
                return Ok(candidate);
            }
        }
    }

    Err(AppError::Message(
        "FFmpeg not found. Launch Reelattice from its install folder once so the bundled FFmpeg sidecar can be cached, or run scripts/download-ffmpeg.ps1 and rebuild.".to_string(),
    ))
}

/// Spawn configuration for the bundled FFmpeg console binary.
///
/// Release builds use `#![windows_subsystem = "windows"]`, so child console
/// processes must use piped stdio and `CREATE_NO_WINDOW` or CreateProcess fails.
pub fn ffmpeg_command(ffmpeg: &Path) -> Command {
    let mut command = Command::new(ffmpeg);
    command.stdin(Stdio::null());
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command
}

pub fn probe_has_audio_stream(ffmpeg: &Path, path: &Path) -> bool {
    let Ok(output) = ffmpeg_command(ffmpeg)
        .arg("-hide_banner")
        .arg("-i")
        .arg(path)
        .output()
    else {
        return false;
    };

    String::from_utf8_lossy(&output.stderr)
        .lines()
        .any(|line| line.contains("Audio:"))
}

pub fn probe_video_duration_secs(ffmpeg: &Path, path: &Path) -> AppResult<f64> {
    let output = ffmpeg_command(ffmpeg)
        .arg("-hide_banner")
        .arg("-i")
        .arg(path)
        .output()?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    for line in stderr.lines() {
        let trimmed = line.trim();
        let Some(duration_part) = trimmed.strip_prefix("Duration:") else {
            continue;
        };
        let duration_token = duration_part.trim().split(',').next().unwrap_or("").trim();
        if !duration_token.is_empty() {
            return parse_ffmpeg_duration(duration_token);
        }
    }

    Err(AppError::Message(format!(
        "Could not read video duration for {}",
        path.display()
    )))
}

pub fn trim_clip_to_path(
    ffmpeg: &Path,
    src: &Path,
    dest: &Path,
    range: ExportRange,
) -> AppResult<()> {
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let has_audio = probe_has_audio_stream(ffmpeg, src);

    let mut command = ffmpeg_command(ffmpeg);
    command
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-y")
        .arg("-ss")
        .arg(format!("{:.3}", range.start_secs))
        .arg("-i")
        .arg(src)
        .arg("-t")
        .arg(format!("{:.3}", range.duration_secs))
        .arg("-c:v")
        .arg("libx264")
        .arg("-preset")
        .arg("ultrafast")
        .arg("-crf")
        .arg("26");

    if has_audio {
        command.arg("-c:a").arg("aac").arg("-b:a").arg("128k");
    } else {
        command.arg("-an");
    }

    let status = command
        .arg("-movflags")
        .arg("+faststart")
        .arg(dest)
        .status()?;

    if status.success() {
        Ok(())
    } else {
        Err(AppError::Message(format!(
            "FFmpeg failed to trim {}",
            src.display()
        )))
    }
}

pub fn extract_thumbnail_jpeg(
    ffmpeg: &Path,
    src: &Path,
    dest: &Path,
    seek_secs: f64,
) -> AppResult<()> {
    extract_scaled_thumbnail_jpeg(ffmpeg, src, dest, seek_secs, 320)
}

pub fn extract_scaled_thumbnail_jpeg(
    ffmpeg: &Path,
    src: &Path,
    dest: &Path,
    seek_secs: f64,
    max_width: u32,
) -> AppResult<()> {
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let output = ffmpeg_command(ffmpeg)
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-ss")
        .arg(format!("{seek_secs:.3}"))
        .arg("-i")
        .arg(src)
        .arg("-frames:v")
        .arg("1")
        .arg("-vf")
        .arg(format!("scale={max_width}:-1"))
        .arg("-q:v")
        .arg("5")
        .arg("-y")
        .arg(dest)
        .output()?;

    if output.status.success() && dest.is_file() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(AppError::Message(format!(
            "Thumbnail extraction failed for {}: {stderr}",
            src.display()
        )))
    }
}

pub fn parse_ffmpeg_duration(value: &str) -> AppResult<f64> {
    let mut segments = value.split(':');
    let hours: f64 = segments
        .next()
        .ok_or_else(|| AppError::Message("Missing hours in duration".into()))?
        .parse()
        .map_err(|_| AppError::Message(format!("Invalid duration hours: {value}")))?;
    let minutes: f64 = segments
        .next()
        .ok_or_else(|| AppError::Message("Missing minutes in duration".into()))?
        .parse()
        .map_err(|_| AppError::Message(format!("Invalid duration minutes: {value}")))?;
    let seconds: f64 = segments
        .next()
        .ok_or_else(|| AppError::Message("Missing seconds in duration".into()))?
        .parse()
        .map_err(|_| AppError::Message(format!("Invalid duration seconds: {value}")))?;

    Ok(hours * 3600.0 + minutes * 60.0 + seconds)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_export_range_clamps_to_footage_end() {
        let range = normalize_export_range(Some(50.0), Some(30.0), 61.0).unwrap();
        assert!((range.start_secs - 50.0).abs() < 0.001);
        assert!((range.duration_secs - 11.0).abs() < 0.001);
    }

    #[test]
    fn parse_ffmpeg_duration_token() {
        assert!((parse_ffmpeg_duration("00:01:01.28").unwrap() - 61.28).abs() < 0.001);
    }
}
