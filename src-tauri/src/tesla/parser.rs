use std::path::{Path, PathBuf};

use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventSource {
    Recent,
    Sentry,
    Saved,
}

impl EventSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            EventSource::Recent => "recent",
            EventSource::Sentry => "sentry",
            EventSource::Saved => "saved",
        }
    }

    pub fn from_folder_name(name: &str) -> Option<Self> {
        match name {
            "RecentClips" => Some(EventSource::Recent),
            "SentryClips" => Some(EventSource::Sentry),
            "SavedClips" => Some(EventSource::Saved),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CameraAngle {
    Front,
    Back,
    LeftRepeater,
    RightRepeater,
    LeftPillar,
    RightPillar,
}

impl CameraAngle {
    pub fn as_str(&self) -> &'static str {
        match self {
            CameraAngle::Front => "front",
            CameraAngle::Back => "back",
            CameraAngle::LeftRepeater => "left_repeater",
            CameraAngle::RightRepeater => "right_repeater",
            CameraAngle::LeftPillar => "left_pillar",
            CameraAngle::RightPillar => "right_pillar",
        }
    }

    pub fn from_suffix(suffix: &str) -> Option<Self> {
        match suffix {
            "front" => Some(CameraAngle::Front),
            "back" => Some(CameraAngle::Back),
            "left_repeater" => Some(CameraAngle::LeftRepeater),
            "right_repeater" => Some(CameraAngle::RightRepeater),
            "left_pillar" => Some(CameraAngle::LeftPillar),
            "right_pillar" => Some(CameraAngle::RightPillar),
            _ => None,
        }
    }
}

pub fn is_timestamp_folder(name: &str) -> bool {
    NaiveDateTime::parse_from_str(name, "%Y-%m-%d_%H-%M-%S").is_ok()
}
pub fn parse_timestamp_folder(name: &str) -> Option<String> {
    if !is_timestamp_folder(name) {
        return None;
    }
    parse_folder_name_to_iso(name)
}

/// Tesla folder and clip names use local wall-clock time, not UTC.
pub fn parse_folder_name_to_iso(name: &str) -> Option<String> {
    let dt = NaiveDateTime::parse_from_str(name, "%Y-%m-%d_%H-%M-%S").ok()?;
    Some(dt.format("%Y-%m-%dT%H:%M:%S").to_string())
}

const CAMERA_SUFFIXES: &[&str] = &[
    "left_repeater",
    "right_repeater",
    "left_pillar",
    "right_pillar",
    "front",
    "back",
];

/// Parses `2026-06-16_02-19-10-front.mp4` → timestamp key + camera.
pub fn parse_tesla_clip_stem(stem: &str) -> Option<(String, CameraAngle)> {
    let without_ext = stem.trim_end_matches(".mp4").trim_end_matches(".MP4");

    for suffix in CAMERA_SUFFIXES {
        let needle = format!("-{suffix}");
        if !without_ext.ends_with(&needle) {
            continue;
        }

        let timestamp = &without_ext[..without_ext.len() - needle.len()];
        if parse_folder_name_to_iso(timestamp).is_some() {
            return Some((timestamp.to_string(), CameraAngle::from_suffix(suffix)?));
        }
    }

    None
}

pub fn parse_camera_from_filename(filename: &str) -> Option<CameraAngle> {
    let stem = Path::new(filename).file_name().and_then(|n| n.to_str())?;

    parse_tesla_clip_stem(stem).map(|(_, camera)| camera)
}

pub fn is_tesla_cam_root(path: &Path) -> bool {
    path.join("RecentClips").is_dir()
        || path.join("SentryClips").is_dir()
        || path.join("SavedClips").is_dir()
}

pub fn resolve_tesla_cam_root(path: &Path) -> PathBuf {
    if path.file_name().and_then(|n| n.to_str()) == Some("TeslaCam") {
        return path.to_path_buf();
    }
    if is_tesla_cam_root(path) {
        return path.to_path_buf();
    }
    let nested = path.join("TeslaCam");
    if nested.is_dir() {
        return nested;
    }
    path.to_path_buf()
}

pub fn source_clip_dirs(root: &Path) -> Vec<(EventSource, PathBuf)> {
    let mut dirs = Vec::new();
    for (name, source) in [
        ("RecentClips", EventSource::Recent),
        ("SentryClips", EventSource::Sentry),
        ("SavedClips", EventSource::Saved),
    ] {
        let dir = root.join(name);
        if dir.is_dir() {
            dirs.push((source, dir));
        }
    }
    dirs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_timestamp_folder_as_wall_clock() {
        let iso = parse_timestamp_folder("2024-01-15_14-30-22").unwrap();
        assert_eq!(iso, "2024-01-15T14:30:22");
    }

    #[test]
    fn rejects_invalid_folder() {
        assert!(parse_timestamp_folder("not-a-date").is_none());
        assert!(parse_timestamp_folder("2024-01-15").is_none());
    }

    #[test]
    fn parses_camera_from_filename() {
        assert_eq!(
            parse_camera_from_filename("2024-01-15_14-30-22-front.mp4"),
            Some(CameraAngle::Front)
        );
        assert_eq!(
            parse_camera_from_filename("2024-01-15_14-30-22-left_repeater.mp4"),
            Some(CameraAngle::LeftRepeater)
        );
        assert_eq!(
            parse_camera_from_filename("2026-06-16_02-19-10-right_pillar.mp4"),
            Some(CameraAngle::RightPillar)
        );
        assert_eq!(parse_camera_from_filename("readme.txt"), None);
    }

    #[test]
    fn parses_loose_clip_stem() {
        let (ts, cam) = parse_tesla_clip_stem("2026-06-16_02-19-10-left_repeater.mp4").unwrap();
        assert_eq!(ts, "2026-06-16_02-19-10");
        assert_eq!(cam, CameraAngle::LeftRepeater);
    }
}
