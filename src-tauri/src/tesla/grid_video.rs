use std::collections::{HashMap, HashSet};
use std::io::Read;
use std::path::Path;
use std::process::{Child, Stdio};
use std::sync::{Arc, Mutex};

use crate::commands::events::Clip;
use crate::error::{AppError, AppResult};
use crate::tesla::ffmpeg::{self, ExportRange};

const GRID_COLS: u32 = 3;
const GRID_ROWS: u32 = 2;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GridExportQuality {
    Full,
    Standard,
    Hd,
    Web,
}

impl GridExportQuality {
    pub fn parse(value: Option<&str>) -> Self {
        match value.map(str::to_ascii_lowercase).as_deref() {
            Some("full") => Self::Full,
            Some("hd") => Self::Hd,
            Some("web") => Self::Web,
            _ => Self::Standard,
        }
    }

    pub fn output_size(self) -> (u32, u32) {
        match self {
            Self::Full | Self::Standard => (1920, 960),
            Self::Hd => (1280, 640),
            Self::Web => (960, 480),
        }
    }

    pub fn crf(self) -> &'static str {
        match self {
            Self::Full => "18",
            Self::Standard => "26",
            Self::Hd => "24",
            Self::Web => "28",
        }
    }

    pub fn preset(self) -> &'static str {
        match self {
            Self::Full => "fast",
            Self::Standard => "ultrafast",
            Self::Hd => "ultrafast",
            Self::Web => "fast",
        }
    }
}

struct GridExportConfig {
    width: u32,
    height: u32,
    crf: &'static str,
    preset: &'static str,
}

impl GridExportConfig {
    fn from_quality(quality: GridExportQuality) -> Self {
        let (width, height) = quality.output_size();
        Self {
            width,
            height,
            crf: quality.crf(),
            preset: quality.preset(),
        }
    }

    fn cell_size(&self) -> (u32, u32) {
        (self.width / GRID_COLS, self.height / GRID_ROWS)
    }
}

#[derive(Debug, Clone, Copy)]
struct GridSlot {
    col: u32,
    row: u32,
    col_span: u32,
    row_span: u32,
}

/// Mirrors `src/lib/camera-layout.ts` — 3×2 review grid with optional pillar columns.
fn grid_slots(cameras: &HashSet<&str>) -> HashMap<&'static str, GridSlot> {
    let has_left_pillar = cameras.contains("left_pillar");
    let has_right_pillar = cameras.contains("right_pillar");

    let mut slots = HashMap::new();

    if has_left_pillar && has_right_pillar {
        slots.insert(
            "left_pillar",
            GridSlot {
                col: 0,
                row: 0,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "front",
            GridSlot {
                col: 1,
                row: 0,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "right_pillar",
            GridSlot {
                col: 2,
                row: 0,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "left_repeater",
            GridSlot {
                col: 0,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "back",
            GridSlot {
                col: 1,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "right_repeater",
            GridSlot {
                col: 2,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        return slots;
    }

    if has_left_pillar {
        slots.insert(
            "left_pillar",
            GridSlot {
                col: 0,
                row: 0,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "front",
            GridSlot {
                col: 1,
                row: 0,
                col_span: 2,
                row_span: 1,
            },
        );
        slots.insert(
            "left_repeater",
            GridSlot {
                col: 0,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "back",
            GridSlot {
                col: 1,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "right_repeater",
            GridSlot {
                col: 2,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        return slots;
    }

    if has_right_pillar {
        slots.insert(
            "front",
            GridSlot {
                col: 0,
                row: 0,
                col_span: 2,
                row_span: 1,
            },
        );
        slots.insert(
            "right_pillar",
            GridSlot {
                col: 2,
                row: 0,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "left_repeater",
            GridSlot {
                col: 0,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "back",
            GridSlot {
                col: 1,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        slots.insert(
            "right_repeater",
            GridSlot {
                col: 2,
                row: 1,
                col_span: 1,
                row_span: 1,
            },
        );
        return slots;
    }

    slots.insert(
        "front",
        GridSlot {
            col: 0,
            row: 0,
            col_span: 3,
            row_span: 1,
        },
    );
    slots.insert(
        "left_repeater",
        GridSlot {
            col: 0,
            row: 1,
            col_span: 1,
            row_span: 1,
        },
    );
    slots.insert(
        "back",
        GridSlot {
            col: 1,
            row: 1,
            col_span: 1,
            row_span: 1,
        },
    );
    slots.insert(
        "right_repeater",
        GridSlot {
            col: 2,
            row: 1,
            col_span: 1,
            row_span: 1,
        },
    );
    slots
}

const CAMERA_ORDER: &[&str] = &[
    "front",
    "back",
    "left_repeater",
    "right_repeater",
    "left_pillar",
    "right_pillar",
];

fn sort_clips<'a>(clips: &'a [Clip]) -> Vec<&'a Clip> {
    let mut sorted: Vec<&Clip> = clips.iter().collect();
    sorted.sort_by_key(|clip| {
        CAMERA_ORDER
            .iter()
            .position(|camera| *camera == clip.camera)
            .unwrap_or(999)
    });
    sorted
}

fn cell_size(config: &GridExportConfig) -> (u32, u32) {
    config.cell_size()
}

fn slot_pixels(slot: GridSlot, config: &GridExportConfig) -> (u32, u32, u32, u32) {
    let (cell_w, cell_h) = cell_size(config);
    let width = slot.col_span * cell_w;
    let height = slot.row_span * cell_h;
    let x = slot.col * cell_w;
    let y = slot.row * cell_h;
    (x, y, width, height)
}

fn build_filter_complex(
    clips: &[&Clip],
    range: ExportRange,
    audio_input: Option<usize>,
    config: &GridExportConfig,
) -> String {
    let cameras: HashSet<&str> = clips.iter().map(|clip| clip.camera.as_str()).collect();
    let slots = grid_slots(&cameras);
    let (cell_w, cell_h) = cell_size(config);

    let mut parts = vec![format!(
        "color=c=black:s={}x{}:r=30:d={:.3}[base]",
        config.width, config.height, range.duration_secs
    )];
    let mut current_label = "base".to_string();

    for (overlay_index, clip) in clips.iter().enumerate() {
        let input_index = overlay_index;

        let slot = slots
            .get(clip.camera.as_str())
            .copied()
            .unwrap_or(GridSlot {
                col: 0,
                row: 0,
                col_span: 1,
                row_span: 1,
            });
        let (x, y, width, height) = slot_pixels(slot, config);
        let scaled = format!("scaled{overlay_index}");
        let next_label = if overlay_index == clips.len() - 1 {
            "outv".to_string()
        } else {
            format!("tmp{overlay_index}")
        };

        parts.push(format!(
            "[{input_index}:v]trim=start={:.3}:duration={:.3},setpts=PTS-STARTPTS,scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,format=yuv420p[{scaled}]",
            range.start_secs, range.duration_secs
        ));
        parts.push(format!(
            "[{current_label}][{scaled}]overlay={x}:{y}:shortest=1[{next_label}]"
        ));
        current_label = next_label;

        let _ = (cell_w, cell_h);
    }

    if let Some(audio_input) = audio_input {
        parts.push(format!(
            "[{audio_input}:a]atrim=start={:.3}:duration={:.3},asetpts=PTS-STARTPTS[aout]",
            range.start_secs, range.duration_secs
        ));
    }

    parts.join(";")
}

fn find_audio_input_index(ffmpeg: &Path, clips: &[&Clip]) -> Option<usize> {
    if let Some((index, _)) = clips
        .iter()
        .enumerate()
        .find(|(_, clip)| clip.camera == "front")
    {
        let path = Path::new(&clips[index].file_path);
        if ffmpeg::probe_has_audio_stream(ffmpeg, path) {
            return Some(index);
        }
    }

    clips.iter().enumerate().find_map(|(index, clip)| {
        let path = Path::new(&clip.file_path);
        ffmpeg::probe_has_audio_stream(ffmpeg, path).then_some(index)
    })
}

fn shortest_clip_duration_secs(ffmpeg: &Path, clips: &[&Clip]) -> AppResult<f64> {
    let mut shortest = f64::INFINITY;

    for clip in clips {
        let duration = ffmpeg::probe_video_duration_secs(ffmpeg, Path::new(&clip.file_path))?;
        shortest = shortest.min(duration);
    }

    if shortest.is_finite() && shortest > 0.0 {
        Ok(shortest)
    } else {
        Err(AppError::Message(
            "Could not determine clip duration for grid export.".into(),
        ))
    }
}

pub fn export_grid_video(
    app: &tauri::AppHandle,
    clips: &[Clip],
    dest_path: &Path,
    active_ffmpeg: &Arc<Mutex<Option<Child>>>,
    trim_start_secs: Option<f64>,
    trim_duration_secs: Option<f64>,
    quality: Option<&str>,
) -> AppResult<String> {
    if clips.len() < 2 {
        return Err(AppError::Message(
            "Grid video export requires at least two camera angles.".to_string(),
        ));
    }

    if dest_path.extension().and_then(|ext| ext.to_str()) != Some("mp4") {
        return Err(AppError::Message(
            "Grid video export path must end with .mp4".to_string(),
        ));
    }

    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let temp_path = dest_path.with_extension("mp4.part");
    if temp_path.exists() {
        std::fs::remove_file(&temp_path)?;
    }

    for clip in clips {
        let src = Path::new(&clip.file_path);
        if !src.is_file() {
            return Err(AppError::Message(format!(
                "Clip file not found: {}",
                clip.file_path
            )));
        }
    }

    let sorted = sort_clips(clips);
    let export_config = GridExportConfig::from_quality(GridExportQuality::parse(quality));
    let ffmpeg = ffmpeg::resolve_ffmpeg(app)?;
    let full_duration_secs = shortest_clip_duration_secs(&ffmpeg, &sorted)?;
    let range =
        ffmpeg::normalize_export_range(trim_start_secs, trim_duration_secs, full_duration_secs)?;
    let audio_input = find_audio_input_index(&ffmpeg, &sorted);
    let filter_complex = build_filter_complex(&sorted, range, audio_input, &export_config);

    let mut command = ffmpeg::ffmpeg_command(&ffmpeg);
    command
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-y");

    for clip in &sorted {
        command
            .arg("-fflags")
            .arg("+genpts")
            .arg("-i")
            .arg(&clip.file_path);
    }

    command
        .arg("-filter_complex")
        .arg(&filter_complex)
        .arg("-map")
        .arg("[outv]");

    if audio_input.is_some() {
        command
            .arg("-map")
            .arg("[aout]")
            .arg("-c:a")
            .arg("aac")
            .arg("-b:a")
            .arg("128k");
    }

    command
        .arg("-c:v")
        .arg("libx264")
        .arg("-preset")
        .arg(export_config.preset)
        .arg("-crf")
        .arg(export_config.crf)
        .arg("-t")
        .arg(format!("{:.3}", range.duration_secs))
        .arg("-shortest")
        .arg("-f")
        .arg("mp4")
        .arg(&temp_path);

    let mut child = command.stderr(Stdio::piped()).spawn()?;
    let mut stderr_pipe = child.stderr.take();

    {
        let mut slot = active_ffmpeg
            .lock()
            .map_err(|_| AppError::Message("Could not track FFmpeg process.".to_string()))?;
        *slot = Some(child);
    }

    let status = {
        let mut slot = active_ffmpeg
            .lock()
            .map_err(|_| AppError::Message("Could not wait on FFmpeg process.".to_string()))?;
        let child = slot
            .as_mut()
            .ok_or_else(|| AppError::Message("FFmpeg process handle missing.".to_string()))?;
        child.wait()?
    };

    {
        let mut slot = active_ffmpeg.lock().map_err(|_| {
            AppError::Message("Could not release FFmpeg process handle.".to_string())
        })?;
        *slot = None;
    }

    if !status.success() {
        let _ = std::fs::remove_file(&temp_path);
        let mut stderr = String::new();
        if let Some(mut pipe) = stderr_pipe.take() {
            let _ = pipe.read_to_string(&mut stderr);
        }
        return Err(AppError::Message(format!(
            "FFmpeg failed to create grid video: {stderr}"
        )));
    }

    if dest_path.exists() {
        std::fs::remove_file(dest_path)?;
    }
    std::fs::rename(&temp_path, dest_path)?;

    Ok(dest_path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn full_pillar_grid_has_six_slots() {
        let cameras: HashSet<&str> = HashSet::from([
            "left_pillar",
            "front",
            "right_pillar",
            "left_repeater",
            "back",
            "right_repeater",
        ]);
        let slots = grid_slots(&cameras);
        assert_eq!(slots.len(), 6);
        assert_eq!(slots["front"].col, 1);
        assert_eq!(slots["front"].col_span, 1);
    }

    #[test]
    fn no_pillar_front_spans_top_row() {
        let cameras: HashSet<&str> = HashSet::from(["front", "back", "left_repeater"]);
        let slots = grid_slots(&cameras);
        assert_eq!(slots["front"].col_span, 3);
        assert_eq!(slots["front"].row_span, 1);
    }

    #[test]
    fn build_filter_complex_maps_front_audio_when_present() {
        let clips = vec![
            Clip {
                id: "1".into(),
                event_id: "e".into(),
                camera: "front".into(),
                file_path: "front.mp4".into(),
                duration_ms: None,
                thumbnail_path: None,
                file_size: None,
            },
            Clip {
                id: "2".into(),
                event_id: "e".into(),
                camera: "back".into(),
                file_path: "back.mp4".into(),
                duration_ms: None,
                thumbnail_path: None,
                file_size: None,
            },
        ];
        let sorted: Vec<&Clip> = clips.iter().collect();
        let filter = build_filter_complex(
            &sorted,
            ExportRange {
                start_secs: 0.0,
                duration_secs: 61.0,
            },
            Some(0),
            &GridExportConfig::from_quality(GridExportQuality::Standard),
        );
        assert!(filter.contains("overlay="));
        assert!(filter.contains(":shortest=1"));
        assert!(filter.contains("s=1920x960"));
        assert!(filter.contains("trim=start=0.000:duration=61.000"));
        assert!(filter.contains("atrim=start=0.000:duration=61.000"));
        assert!(filter.contains("[outv]"));
    }

    #[test]
    fn build_filter_complex_omits_audio_when_no_stream() {
        let clips = vec![Clip {
            id: "1".into(),
            event_id: "e".into(),
            camera: "front".into(),
            file_path: "front.mp4".into(),
            duration_ms: None,
            thumbnail_path: None,
            file_size: None,
        }];
        let sorted: Vec<&Clip> = clips.iter().collect();
        let filter = build_filter_complex(
            &sorted,
            ExportRange {
                start_secs: 0.0,
                duration_secs: 61.0,
            },
            None,
            &GridExportConfig::from_quality(GridExportQuality::Standard),
        );
        assert!(!filter.contains("atrim="));
        assert!(filter.contains("[outv]"));
    }

    #[test]
    fn build_filter_complex_includes_segment_trim() {
        let clips = vec![Clip {
            id: "1".into(),
            event_id: "e".into(),
            camera: "front".into(),
            file_path: "front.mp4".into(),
            duration_ms: None,
            thumbnail_path: None,
            file_size: None,
        }];
        let sorted: Vec<&Clip> = clips.iter().collect();
        let filter = build_filter_complex(
            &sorted,
            ExportRange {
                start_secs: 12.5,
                duration_secs: 30.0,
            },
            Some(0),
            &GridExportConfig::from_quality(GridExportQuality::Standard),
        );
        assert!(filter.contains("trim=start=12.500:duration=30.000"));
        assert!(filter.contains("atrim=start=12.500:duration=30.000"));
    }

    #[test]
    fn output_cells_are_four_by_three() {
        let config = GridExportConfig::from_quality(GridExportQuality::Standard);
        let (cell_w, cell_h) = cell_size(&config);
        assert_eq!((cell_w, cell_h), (640, 480));
        assert_eq!(config.width, 1920);
        assert_eq!(config.height, 960);
    }

    #[test]
    fn quality_presets_use_expected_dimensions() {
        assert_eq!(GridExportQuality::Hd.output_size(), (1280, 640));
        assert_eq!(GridExportQuality::Web.output_size(), (960, 480));
    }

    #[test]
    fn parse_quality_defaults_to_standard() {
        assert_eq!(GridExportQuality::parse(None), GridExportQuality::Standard);
        assert_eq!(GridExportQuality::parse(Some("unknown")), GridExportQuality::Standard);
        assert_eq!(GridExportQuality::parse(Some("web")), GridExportQuality::Web);
    }
}
