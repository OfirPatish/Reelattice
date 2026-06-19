use std::fs::{self, File};
use std::io::{copy, Write};
use std::path::Path;

use serde::Serialize;
use tauri::AppHandle;

use crate::db::Database;
use crate::error::{AppError, AppResult};
use crate::tesla::ffmpeg::{self, ExportRange};

use super::{load_event_by_id, DashEvent};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkExportResult {
    pub exported: u32,
    pub failed: Vec<String>,
}

pub fn export_event_zip(db: &Database, event_id: &str, dest_path: &Path) -> AppResult<String> {
    let event = load_event_by_id(db, event_id)?;
    write_event_zip(&event, dest_path, None)
}

pub fn export_event_zip_segment(
    app: &AppHandle,
    event: &DashEvent,
    dest_path: &Path,
    start_secs: f64,
    duration_secs: f64,
) -> AppResult<String> {
    let ffmpeg = ffmpeg::resolve_ffmpeg(app)?;
    let full_duration_secs = shortest_event_duration_secs(&ffmpeg, event)?;
    let range =
        ffmpeg::normalize_export_range(Some(start_secs), Some(duration_secs), full_duration_secs)?;

    let temp_dir = std::env::temp_dir().join(format!(
        "reelattice-export-{}",
        uuid::Uuid::new_v4().simple()
    ));
    fs::create_dir_all(&temp_dir)?;

    let result = write_event_zip(event, dest_path, Some((&ffmpeg, &temp_dir, range)));

    let _ = fs::remove_dir_all(&temp_dir);
    result
}

fn shortest_event_duration_secs(ffmpeg: &std::path::Path, event: &DashEvent) -> AppResult<f64> {
    let mut shortest = f64::INFINITY;

    for clip in &event.clips {
        let duration = ffmpeg::probe_video_duration_secs(ffmpeg, Path::new(&clip.file_path))?;
        shortest = shortest.min(duration);
    }

    if shortest.is_finite() && shortest > 0.0 {
        Ok(shortest)
    } else {
        Err(AppError::Message(
            "Could not determine clip duration for segment export.".into(),
        ))
    }
}

pub fn bulk_export_events_zip(
    db: &Database,
    event_ids: &[String],
    dest_path: &Path,
) -> AppResult<BulkExportResult> {
    if event_ids.is_empty() {
        return Ok(BulkExportResult {
            exported: 0,
            failed: Vec::new(),
        });
    }

    if dest_path.extension().and_then(|ext| ext.to_str()) != Some("zip") {
        return Err(AppError::Message(
            "Export path must end with .zip".to_string(),
        ));
    }

    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let file = File::create(dest_path)?;
    let mut zip = zip::ZipWriter::new(file);
    let options =
        zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);

    let mut exported = 0u32;
    let mut failed = Vec::new();
    let mut manifest_lines = vec![
        "Reelattice Bulk Export".to_string(),
        "=====================".to_string(),
        String::new(),
    ];

    for event_id in event_ids {
        match load_event_by_id(db, event_id) {
            Ok(event) => {
                let folder = event_folder_name(&event.event_time);
                match append_event_to_zip(&mut zip, &event, &folder, options, None) {
                    Ok(_) => {
                        exported += 1;
                        manifest_lines.push(format!(
                            "- {} ({}, {} cameras)",
                            event.event_time,
                            event.source,
                            event.clips.len()
                        ));
                    }
                    Err(_) => failed.push(event_id.clone()),
                }
            }
            Err(_) => failed.push(event_id.clone()),
        }
    }

    manifest_lines.push(String::new());
    manifest_lines.push(format!("Exported: {exported}"));
    if !failed.is_empty() {
        manifest_lines.push(format!("Failed: {}", failed.len()));
    }

    zip.start_file("manifest.txt", options)
        .map_err(|err| AppError::Message(err.to_string()))?;
    zip.write_all(manifest_lines.join("\n").as_bytes())
        .map_err(|err| AppError::Message(err.to_string()))?;

    zip.finish()
        .map_err(|err| AppError::Message(err.to_string()))?;

    Ok(BulkExportResult { exported, failed })
}

fn write_event_zip(
    event: &DashEvent,
    dest_path: &Path,
    trim: Option<(&std::path::Path, &Path, ExportRange)>,
) -> AppResult<String> {
    if dest_path.extension().and_then(|ext| ext.to_str()) != Some("zip") {
        return Err(AppError::Message(
            "Export path must end with .zip".to_string(),
        ));
    }

    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let file = File::create(dest_path)?;
    let mut zip = zip::ZipWriter::new(file);
    let options =
        zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);

    append_event_to_zip(&mut zip, event, "", options, trim)?;

    zip.finish()
        .map_err(|err| AppError::Message(err.to_string()))?;

    Ok(dest_path.to_string_lossy().to_string())
}

fn append_event_to_zip(
    zip: &mut zip::ZipWriter<File>,
    event: &DashEvent,
    folder_prefix: &str,
    options: zip::write::SimpleFileOptions,
    trim: Option<(&std::path::Path, &Path, ExportRange)>,
) -> AppResult<()> {
    let summary_path = if folder_prefix.is_empty() {
        "summary.txt".to_string()
    } else {
        format!("{folder_prefix}/summary.txt")
    };

    let summary = build_export_summary(event, trim.map(|(_, _, range)| range));
    zip.start_file(&summary_path, options)
        .map_err(|err| AppError::Message(err.to_string()))?;
    zip.write_all(summary.as_bytes())
        .map_err(|err| AppError::Message(err.to_string()))?;

    for clip in &event.clips {
        let src = Path::new(&clip.file_path);
        if !src.is_file() {
            return Err(AppError::Message(format!(
                "Clip file not found: {}",
                clip.file_path
            )));
        }

        let original_name = src
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("clip.mp4");
        let file_name = if trim.is_some() {
            format!("{}-segment.mp4", clip.camera)
        } else {
            format!("{}-{}", clip.camera, original_name)
        };
        let zip_name = if folder_prefix.is_empty() {
            file_name.clone()
        } else {
            format!("{folder_prefix}/{file_name}")
        };

        zip.start_file(&zip_name, options)
            .map_err(|err| AppError::Message(err.to_string()))?;

        if let Some((ffmpeg, temp_dir, range)) = trim {
            let trimmed_path = temp_dir.join(format!("{}-segment.mp4", clip.camera));
            ffmpeg::trim_clip_to_path(ffmpeg, src, &trimmed_path, range)?;
            let mut reader = File::open(&trimmed_path)?;
            copy(&mut reader, zip).map_err(|err| AppError::Message(err.to_string()))?;
        } else {
            let mut reader = File::open(src)?;
            copy(&mut reader, zip).map_err(|err| AppError::Message(err.to_string()))?;
        }
    }

    Ok(())
}

fn event_folder_name(event_time: &str) -> String {
    event_time
        .replace([':', ' '], "-")
        .chars()
        .filter(|ch| !matches!(ch, '\\' | '/' | '<' | '>' | '|' | '?' | '*'))
        .collect()
}

fn build_export_summary(event: &DashEvent, range: Option<ExportRange>) -> String {
    let mut lines = vec![
        "Reelattice Event Export".to_string(),
        "======================".to_string(),
        String::new(),
        format!("Time: {}", event.event_time),
        format!("Source: {}", event.source),
    ];

    if let Some(range) = range {
        lines.push(format!(
            "Segment: {:.1}s starting at {:.1}s",
            range.duration_secs, range.start_secs
        ));
    }

    lines.extend([
        format!(
            "Tags: {}",
            if event.tags.is_empty() {
                "(none)".to_string()
            } else {
                event.tags.join(", ")
            }
        ),
        format!(
            "Note: {}",
            if event.note.trim().is_empty() {
                "(none)".to_string()
            } else {
                event.note.clone()
            }
        ),
        format!("Cameras: {}", event.clips.len()),
        String::new(),
        "Files:".to_string(),
    ]);

    for clip in &event.clips {
        let normalized = clip.file_path.replace('\\', "/");
        let filename = normalized.split('/').next_back().unwrap_or(&clip.file_path);
        lines.push(format!("- {}: {}", clip.camera, filename));
    }

    lines.join("\n")
}
