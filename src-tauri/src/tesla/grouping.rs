use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

use crate::tesla::encrypted::{
    is_encrypted_clips_dir, is_likely_encrypted_clip, scan_paths_for_encrypted_folder,
};
use crate::tesla::parser::{
    is_tesla_cam_root, is_timestamp_folder, parse_camera_from_filename, parse_folder_name_to_iso,
    parse_tesla_clip_stem, parse_timestamp_folder, resolve_tesla_cam_root, source_clip_dirs,
    CameraAngle, EventSource,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanImportResult {
    pub events: Vec<DetectedEvent>,
    pub encrypted_clips_found: usize,
    pub encrypted_folder_detected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedClip {
    pub camera: String,
    pub file_path: String,
    pub file_size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedEvent {
    pub folder_path: String,
    pub event_time: String,
    pub source: String,
    pub source_inferred: bool,
    pub clips: Vec<DetectedClip>,
    pub already_imported: bool,
}

pub fn loose_event_key(timestamp: &str) -> String {
    format!("loose:{timestamp}")
}

#[derive(Debug, Default)]
pub struct ImportDedupIndex {
    paths: HashSet<String>,
    event_times: HashSet<String>,
}

impl ImportDedupIndex {
    pub fn new(
        paths: impl IntoIterator<Item = String>,
        event_times: impl IntoIterator<Item = String>,
    ) -> Self {
        Self {
            paths: paths.into_iter().collect(),
            event_times: event_times.into_iter().collect(),
        }
    }

    pub fn is_imported(&self, folder_path: &str, event_time: &str) -> bool {
        self.paths.contains(folder_path) || self.event_times.contains(event_time)
    }
}

fn clip_source_from_dir(path: &Path) -> Option<EventSource> {
    path.file_name()
        .and_then(|name| name.to_str())
        .and_then(EventSource::from_folder_name)
}

/// Auto-detect source only when the selected folder itself is a TeslaCam clip
/// folder (`RecentClips`, `SentryClips`, `SavedClips`). Timestamp subfolders
/// never carry source in their name and always need manual selection.
fn infer_source_from_clip_context(folder: &Path) -> (EventSource, bool) {
    if let Some(source) = clip_source_from_dir(folder) {
        return (source, true);
    }

    (EventSource::Recent, false)
}

fn count_clips_in_timestamp_layout(clip_dir: &Path) -> usize {
    let entries = match fs::read_dir(clip_dir) {
        Ok(entries) => entries,
        Err(_) => return 0,
    };

    let mut count = 0usize;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let folder_name = match path.file_name().and_then(|name| name.to_str()) {
            Some(name) if is_timestamp_folder(name) => name,
            _ => continue,
        };

        let _ = folder_name;
        count += count_mp4_clips_in_folder(&path);
    }

    count
}

fn count_mp4_clips_in_folder(folder: &Path) -> usize {
    let entries = match fs::read_dir(folder) {
        Ok(entries) => entries,
        Err(_) => return 0,
    };

    entries
        .flatten()
        .filter(|entry| entry.path().is_file())
        .filter(|entry| {
            entry
                .path()
                .file_name()
                .and_then(|name| name.to_str())
                .map(|name| name.ends_with(".mp4"))
                .unwrap_or(false)
        })
        .filter(|entry| {
            entry
                .path()
                .file_name()
                .and_then(|name| name.to_str())
                .and_then(parse_camera_from_filename)
                .is_some()
        })
        .count()
}

pub fn scan_tesla_cam(path: &Path, dedup: &ImportDedupIndex) -> Vec<DetectedEvent> {
    let root = resolve_tesla_cam_root(path);
    let mut events = Vec::new();

    if is_timestamp_folder(root.file_name().and_then(|n| n.to_str()).unwrap_or("")) {
        if has_timestamp_subfolders(&root) {
            let (source, _) = default_source_for_dir(&root);
            return scan_source_dir(&root, source, dedup);
        }
        return scan_flat_mp4_folder(&root, dedup);
    }

    for (source, clip_dir) in source_clip_dirs(&root) {
        events.extend(scan_clip_source_dir(&clip_dir, source, dedup));
    }

    events.sort_by(|a, b| b.event_time.cmp(&a.event_time));
    events
}

fn has_timestamp_subfolders(dir: &Path) -> bool {
    let Ok(entries) = fs::read_dir(dir) else {
        return false;
    };

    entries.flatten().any(|entry| {
        entry.path().is_dir()
            && entry
                .file_name()
                .to_str()
                .map(is_timestamp_folder)
                .unwrap_or(false)
    })
}

fn collect_shallow_mp4_paths(folder: &Path) -> Vec<String> {
    let Ok(entries) = fs::read_dir(folder) else {
        return Vec::new();
    };

    entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if is_existing_mp4_file(&path) {
                Some(path.to_string_lossy().to_string())
            } else {
                None
            }
        })
        .collect()
}

fn scan_flat_mp4_folder(folder: &Path, dedup: &ImportDedupIndex) -> Vec<DetectedEvent> {
    let paths = collect_shallow_mp4_paths(folder);
    let mut events = group_loose_clip_files(&paths, dedup);

    if events.len() == 1 {
        let folder_name = folder.file_name().and_then(|name| name.to_str());
        if folder_name.is_some_and(is_timestamp_folder) {
            if let Some(event) = events.first_mut() {
                let (source, source_inferred) = infer_source_from_clip_context(folder);
                event.folder_path = folder.to_string_lossy().to_string();
                event.source = source.as_str().to_string();
                event.source_inferred = source_inferred;
            }
        }
    }

    events
}

fn default_source_for_dir(dir: &Path) -> (EventSource, bool) {
    infer_source_from_clip_context(dir)
}

fn scan_clip_source_dir(
    clip_dir: &Path,
    default_source: EventSource,
    dedup: &ImportDedupIndex,
) -> Vec<DetectedEvent> {
    let mut events = Vec::new();
    let parent_source_inferred = clip_source_from_dir(clip_dir).is_some();

    if has_timestamp_subfolders(clip_dir) {
        events.extend(scan_source_dir(clip_dir, default_source, dedup));
    }

    let flat_paths = collect_shallow_mp4_paths(clip_dir);
    if !flat_paths.is_empty() {
        let mut flat_events = group_loose_clip_files(&flat_paths, dedup);
        for event in &mut flat_events {
            if !event.source_inferred && parent_source_inferred {
                event.source = default_source.as_str().to_string();
                event.source_inferred = true;
            }
        }
        events.extend(flat_events);
    }

    if events.is_empty() {
        events.extend(scan_source_dir(clip_dir, default_source, dedup));
    }

    events
}

fn scan_source_dir(
    clip_dir: &Path,
    default_source: EventSource,
    dedup: &ImportDedupIndex,
) -> Vec<DetectedEvent> {
    let mut events = Vec::new();

    let entries = match fs::read_dir(clip_dir) {
        Ok(entries) => entries,
        Err(_) => return events,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let folder_name = match path.file_name().and_then(|n| n.to_str()) {
            Some(name) if is_timestamp_folder(name) => name,
            _ => continue,
        };

        let source_inferred = clip_source_from_dir(clip_dir).is_some();
        let source = if source_inferred {
            default_source
        } else {
            EventSource::Recent
        };
        if let Some(event) =
            build_detected_event(&path, folder_name, source, source_inferred, dedup)
        {
            events.push(event);
        }
    }

    events
}

fn build_detected_event(
    folder: &Path,
    folder_name: &str,
    source: EventSource,
    source_inferred: bool,
    dedup: &ImportDedupIndex,
) -> Option<DetectedEvent> {
    let event_time = parse_timestamp_folder(folder_name)?;
    let folder_path = folder.to_string_lossy().to_string();
    let clips = collect_clips_in_folder(folder);

    if clips.is_empty() {
        return None;
    }

    let already_imported = dedup.is_imported(&folder_path, &event_time);

    Some(DetectedEvent {
        folder_path: folder_path.clone(),
        event_time,
        source: source.as_str().to_string(),
        source_inferred,
        clips,
        already_imported,
    })
}

fn collect_clips_in_folder(folder: &Path) -> Vec<DetectedClip> {
    let mut clips_by_camera: HashMap<String, DetectedClip> = HashMap::new();

    let entries = match fs::read_dir(folder) {
        Ok(entries) => entries,
        Err(_) => return Vec::new(),
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let filename = match path.file_name().and_then(|n| n.to_str()) {
            Some(name) if name.ends_with(".mp4") => name,
            _ => continue,
        };

        if is_likely_encrypted_clip(&path) {
            continue;
        }

        let camera = match parse_camera_from_filename(filename) {
            Some(angle) => angle,
            None => continue,
        };

        let file_size = fs::metadata(&path).map(|m| m.len() as i64).unwrap_or(0);
        let camera_name = camera.as_str().to_string();
        let clip = DetectedClip {
            camera: camera_name.clone(),
            file_path: path.to_string_lossy().to_string(),
            file_size,
        };

        clips_by_camera
            .entry(camera_name)
            .and_modify(|existing| {
                if clip.file_size >= existing.file_size {
                    *existing = clip.clone();
                }
            })
            .or_insert(clip);
    }

    let mut clips: Vec<DetectedClip> = clips_by_camera.into_values().collect();
    clips.sort_by(|a, b| a.camera.cmp(&b.camera));
    clips
}

/// Recursively collects MP4 files whose names match the Tesla clip pattern
/// (e.g. `2026-06-16_02-11-07-right_repeater.mp4`), regardless of folder layout.
pub fn collect_recognized_clip_paths(folder: &Path) -> (Vec<String>, usize) {
    let mut paths = Vec::new();
    let mut encrypted_found = 0usize;

    for entry in WalkDir::new(folder).follow_links(false) {
        let entry = match entry {
            Ok(entry) => entry,
            Err(_) => continue,
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let filename = match path.file_name().and_then(|name| name.to_str()) {
            Some(name) if name.to_lowercase().ends_with(".mp4") => name,
            _ => continue,
        };

        if parse_tesla_clip_stem(filename).is_none() {
            continue;
        }

        if is_likely_encrypted_clip(path) {
            encrypted_found += 1;
            continue;
        }

        paths.push(path.to_string_lossy().to_string());
    }

    (paths, encrypted_found)
}

fn is_existing_mp4_file(path: &Path) -> bool {
    let ext_ok = path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("mp4"))
        .unwrap_or(false);

    if !ext_ok {
        return false;
    }

    fs::metadata(path)
        .map(|meta| meta.is_file())
        .unwrap_or(false)
}

fn merge_detected_events(into: &mut DetectedEvent, from: &DetectedEvent) {
    let mut clips_by_camera: HashMap<String, DetectedClip> = into
        .clips
        .iter()
        .map(|clip| (clip.camera.clone(), clip.clone()))
        .collect();

    for clip in &from.clips {
        clips_by_camera
            .entry(clip.camera.clone())
            .and_modify(|existing| {
                if clip.file_size >= existing.file_size {
                    *existing = clip.clone();
                }
            })
            .or_insert_with(|| clip.clone());
    }

    into.clips = clips_by_camera.into_values().collect();
    into.clips.sort_by(|a, b| a.camera.cmp(&b.camera));

    if from.source_inferred && !into.source_inferred {
        into.source = from.source.clone();
        into.source_inferred = true;
    }

    if into.folder_path.starts_with("loose:") && !from.folder_path.starts_with("loose:") {
        into.folder_path = from.folder_path.clone();
    }

    into.already_imported = into.already_imported || from.already_imported;
}

fn consolidate_events_by_time(events: Vec<DetectedEvent>) -> Vec<DetectedEvent> {
    let mut by_time: HashMap<String, DetectedEvent> = HashMap::new();

    for event in events {
        by_time
            .entry(event.event_time.clone())
            .and_modify(|existing| merge_detected_events(existing, &event))
            .or_insert(event);
    }

    let mut consolidated: Vec<DetectedEvent> = by_time.into_values().collect();
    consolidated.sort_by(|a, b| b.event_time.cmp(&a.event_time));
    consolidated
}

/// Scans a mix of files and folders. TeslaCam/USB roots use structured scanning;
/// other folders are walked recursively and clips are grouped by filename timestamp.
pub fn scan_import_paths(paths: &[String], dedup: &ImportDedupIndex) -> ScanImportResult {
    let mut tesla_roots: Vec<String> = Vec::new();
    let mut loose_files: Vec<String> = Vec::new();
    let mut encrypted_clips_found = 0usize;
    let mut events_by_key: HashMap<String, DetectedEvent> = HashMap::new();

    for path_str in paths {
        let path = Path::new(path_str);

        if is_existing_mp4_file(path) {
            if is_likely_encrypted_clip(path) {
                encrypted_clips_found += 1;
            } else {
                loose_files.push(path_str.clone());
            }
            continue;
        }

        if !path.is_dir() {
            continue;
        }

        let root = resolve_tesla_cam_root(path);
        if is_tesla_cam_root(&root) {
            if !tesla_roots.iter().any(|existing| existing == path_str) {
                tesla_roots.push(path_str.clone());
            }
        } else if is_encrypted_clips_dir(path) {
            encrypted_clips_found += count_clips_in_timestamp_layout(path);
        } else if has_timestamp_subfolders(path) {
            let (source, _) = default_source_for_dir(path);
            for event in scan_source_dir(path, source, dedup) {
                events_by_key.insert(event.folder_path.clone(), event);
            }
        } else if let Some(source) = clip_source_from_dir(path) {
            for event in scan_clip_source_dir(path, source, dedup) {
                events_by_key
                    .entry(event.folder_path.clone())
                    .and_modify(|existing| merge_detected_events(existing, &event))
                    .or_insert(event);
            }
        } else if is_timestamp_folder(
            path.file_name()
                .and_then(|name| name.to_str())
                .unwrap_or(""),
        ) {
            for event in scan_flat_mp4_folder(path, dedup) {
                events_by_key
                    .entry(event.folder_path.clone())
                    .and_modify(|existing| merge_detected_events(existing, &event))
                    .or_insert(event);
            }
        } else if !collect_shallow_mp4_paths(path).is_empty() {
            for event in scan_flat_mp4_folder(path, dedup) {
                events_by_key
                    .entry(event.folder_path.clone())
                    .and_modify(|existing| merge_detected_events(existing, &event))
                    .or_insert(event);
            }
        } else {
            let (recognized, encrypted) = collect_recognized_clip_paths(path);
            encrypted_clips_found += encrypted;
            loose_files.extend(recognized);
        }
    }

    let encrypted_folder_detected = scan_paths_for_encrypted_folder(paths);

    for root_path in tesla_roots {
        for event in scan_tesla_cam(Path::new(&root_path), dedup) {
            events_by_key.insert(event.folder_path.clone(), event);
        }
    }

    for event in group_loose_clip_files(&loose_files, dedup) {
        events_by_key
            .entry(event.folder_path.clone())
            .and_modify(|existing| merge_detected_events(existing, &event))
            .or_insert(event);
    }

    ScanImportResult {
        events: consolidate_events_by_time(events_by_key.into_values().collect()),
        encrypted_clips_found,
        encrypted_folder_detected: encrypted_folder_detected || encrypted_clips_found > 0,
    }
}

pub fn group_loose_clip_files(
    file_paths: &[String],
    dedup: &ImportDedupIndex,
) -> Vec<DetectedEvent> {
    let mut groups: HashMap<String, Vec<(PathBuf, CameraAngle)>> = HashMap::new();

    for path_str in file_paths {
        let path = Path::new(path_str);
        if !is_existing_mp4_file(path) {
            continue;
        }

        if is_likely_encrypted_clip(path) {
            continue;
        }

        let filename = match path.file_name().and_then(|n| n.to_str()) {
            Some(name) if name.to_lowercase().ends_with(".mp4") => name,
            _ => continue,
        };

        let (timestamp, camera) = match parse_tesla_clip_stem(filename) {
            Some(parsed) => parsed,
            None => continue,
        };

        groups
            .entry(timestamp)
            .or_default()
            .push((path.to_path_buf(), camera));
    }

    let mut events = Vec::new();

    for (timestamp, files) in groups {
        let event_time = match parse_folder_name_to_iso(&timestamp) {
            Some(iso) => iso,
            None => continue,
        };

        let import_key = loose_event_key(&timestamp);
        // Loose files (browse/drag-drop) always need manual source selection.
        let source = EventSource::Recent;
        let source_inferred = false;

        let mut clips_by_camera: HashMap<String, DetectedClip> = HashMap::new();

        for (path, camera) in files {
            let file_size = fs::metadata(&path).map(|m| m.len() as i64).unwrap_or(0);
            let camera_name = camera.as_str().to_string();
            let clip = DetectedClip {
                camera: camera_name.clone(),
                file_path: path.to_string_lossy().to_string(),
                file_size,
            };

            clips_by_camera
                .entry(camera_name)
                .and_modify(|existing| {
                    if clip.file_size >= existing.file_size {
                        *existing = clip.clone();
                    }
                })
                .or_insert(clip);
        }

        let mut clips: Vec<DetectedClip> = clips_by_camera.into_values().collect();
        if clips.is_empty() {
            continue;
        }
        clips.sort_by(|a, b| a.camera.cmp(&b.camera));

        let already_imported = dedup.is_imported(&import_key, &event_time);

        events.push(DetectedEvent {
            folder_path: import_key.clone(),
            event_time,
            source: source.as_str().to_string(),
            source_inferred,
            clips,
            already_imported,
        });
    }

    events.sort_by(|a, b| b.event_time.cmp(&a.event_time));
    events
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn fixture_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("tests")
            .join("fixtures")
            .join("tesla-cam")
    }

    fn empty_dedup() -> ImportDedupIndex {
        ImportDedupIndex::new([], [])
    }

    #[test]
    fn scans_sentry_clip_folder() {
        let root = fixture_root();
        let events = scan_tesla_cam(&root, &empty_dedup());
        assert!(!events.is_empty(), "expected at least one detected event");

        let sentry = events
            .iter()
            .find(|e| e.source == "sentry")
            .expect("expected a sentry event");

        assert!(sentry.source_inferred);

        assert_eq!(sentry.clips.len(), 4);
        assert!(sentry.clips.iter().any(|c| c.camera == "front"));
    }

    #[test]
    fn marks_already_imported() {
        let root = fixture_root();
        let sentry_path = root
            .join("SentryClips")
            .join("2024-01-15_14-30-22")
            .to_string_lossy()
            .to_string();

        let dedup = ImportDedupIndex::new([sentry_path.clone()], []);
        let events = scan_tesla_cam(&root, &dedup);
        let sentry = events
            .iter()
            .find(|e| e.folder_path == sentry_path)
            .unwrap();
        assert!(sentry.already_imported);
    }

    #[test]
    fn marks_already_imported_by_event_time() {
        let root = fixture_root();
        let dedup = ImportDedupIndex::new([], ["2024-01-15T14:30:22".to_string()]);
        let events = scan_tesla_cam(&root, &dedup);
        let sentry = events
            .iter()
            .find(|e| e.source == "sentry")
            .expect("expected a sentry event");
        assert!(sentry.already_imported);
    }

    #[test]
    fn scan_import_paths_accepts_individual_files() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let paths: Vec<String> = ["front", "back"]
            .iter()
            .map(|cam| {
                base.join(format!("2024-01-15_14-30-22-{cam}.mp4"))
                    .to_string_lossy()
                    .to_string()
            })
            .collect();

        let result = scan_import_paths(&paths, &empty_dedup());
        assert_eq!(result.events.len(), 1);
        assert_eq!(result.events[0].clips.len(), 2);
        assert!(!result.events[0].source_inferred);
    }

    #[test]
    fn scan_import_paths_rescans_folder_and_files_together() {
        let folder = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let back_only = folder.join("2024-01-15_14-30-22-back.mp4");
        let folder_path = folder.to_string_lossy().to_string();
        let file_path = back_only.to_string_lossy().to_string();

        let folder_only = scan_import_paths(&[folder_path.clone()], &empty_dedup());
        let combined = scan_import_paths(&[folder_path, file_path], &empty_dedup());

        assert_eq!(folder_only.events.len(), 1);
        assert_eq!(combined.events.len(), 1);
        assert_eq!(
            combined.events[0].clips.len(),
            folder_only.events[0].clips.len()
        );
    }

    #[test]
    fn groups_loose_clip_files_by_timestamp() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let paths: Vec<String> = ["front", "back", "left_repeater", "right_repeater"]
            .iter()
            .map(|cam| {
                base.join(format!("2024-01-15_14-30-22-{cam}.mp4"))
                    .to_string_lossy()
                    .to_string()
            })
            .collect();

        let events = group_loose_clip_files(&paths, &empty_dedup());
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].clips.len(), 4);
        assert!(!events[0].source_inferred);
        assert!(events[0].folder_path.starts_with("loose:"));
    }

    #[test]
    fn collects_clips_from_loose_folder_tree() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let loose_root = fixture_root().join("loose-import");
        let nested = loose_root.join("batch-a");

        let _ = fs::remove_dir_all(&loose_root);
        fs::create_dir_all(&nested).unwrap();

        for cam in ["front", "back"] {
            let src = base.join(format!("2024-01-15_14-30-22-{cam}.mp4"));
            let dest = nested.join(format!("2024-01-15_14-30-22-{cam}.mp4"));
            fs::copy(&src, &dest).unwrap();
        }

        let (collected, _) = collect_recognized_clip_paths(&loose_root);
        assert_eq!(collected.len(), 2);

        let result = scan_import_paths(&[loose_root.to_string_lossy().to_string()], &empty_dedup());
        assert_eq!(result.events.len(), 1);
        assert_eq!(result.events[0].clips.len(), 2);

        let _ = fs::remove_dir_all(&loose_root);
    }

    #[test]
    fn merges_same_timestamp_from_multiple_loose_folders() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let root_a = fixture_root().join("loose-a");
        let root_b = fixture_root().join("loose-b");

        let _ = fs::remove_dir_all(&root_a);
        let _ = fs::remove_dir_all(&root_b);
        fs::create_dir_all(&root_a).unwrap();
        fs::create_dir_all(&root_b).unwrap();

        fs::copy(
            base.join("2024-01-15_14-30-22-front.mp4"),
            root_a.join("2024-01-15_14-30-22-front.mp4"),
        )
        .unwrap();
        fs::copy(
            base.join("2024-01-15_14-30-22-back.mp4"),
            root_b.join("2024-01-15_14-30-22-back.mp4"),
        )
        .unwrap();

        let result = scan_import_paths(
            &[
                root_a.to_string_lossy().to_string(),
                root_b.to_string_lossy().to_string(),
            ],
            &empty_dedup(),
        );

        assert_eq!(result.events.len(), 1);
        assert_eq!(result.events[0].clips.len(), 2);

        let _ = fs::remove_dir_all(&root_a);
        let _ = fs::remove_dir_all(&root_b);
    }

    #[test]
    fn scan_import_paths_splits_flat_mp4s_in_named_timestamp_folder() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let mixed_root = fixture_root().join("2024-01-15_14-30-22");
        let _ = fs::remove_dir_all(&mixed_root);
        fs::create_dir_all(&mixed_root).unwrap();

        fs::copy(
            base.join("2024-01-15_14-30-22-front.mp4"),
            mixed_root.join("2024-01-15_14-30-22-front.mp4"),
        )
        .unwrap();
        fs::copy(
            base.join("2024-01-15_14-30-22-back.mp4"),
            mixed_root.join("2024-01-15_15-45-10-back.mp4"),
        )
        .unwrap();

        let result = scan_import_paths(&[mixed_root.to_string_lossy().to_string()], &empty_dedup());
        assert_eq!(result.events.len(), 2);

        let _ = fs::remove_dir_all(&mixed_root);
    }

    #[test]
    fn scan_import_paths_splits_flat_mp4s_in_timestamp_folder() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let mixed_root = fixture_root().join("mixed-timestamp-folder");
        let _ = fs::remove_dir_all(&mixed_root);
        fs::create_dir_all(&mixed_root).unwrap();

        fs::copy(
            base.join("2024-01-15_14-30-22-front.mp4"),
            mixed_root.join("2024-01-15_14-30-22-front.mp4"),
        )
        .unwrap();
        fs::copy(
            base.join("2024-01-15_14-30-22-back.mp4"),
            mixed_root.join("2024-01-15_15-45-10-back.mp4"),
        )
        .unwrap();

        let result = scan_import_paths(&[mixed_root.to_string_lossy().to_string()], &empty_dedup());
        assert_eq!(result.events.len(), 2);
        assert!(
            result.events.iter().all(|event| event.clips.len() <= 6),
            "each event should contain at most six camera angles"
        );

        let _ = fs::remove_dir_all(&mixed_root);
    }

    #[test]
    fn timestamp_folder_import_needs_manual_source() {
        let folder = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let result = scan_import_paths(&[folder.to_string_lossy().to_string()], &empty_dedup());

        assert_eq!(result.events.len(), 1);
        assert!(!result.events[0].source_inferred);
        assert_eq!(result.events[0].source, "recent");
    }

    #[test]
    fn scan_import_paths_reads_flat_recent_clips_folder() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let batch_root = fixture_root().join("recent-import-test");
        let recent_root = batch_root.join("RecentClips");
        let _ = fs::remove_dir_all(&batch_root);
        fs::create_dir_all(&recent_root).unwrap();

        for cam in ["front", "back"] {
            fs::copy(
                base.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
                recent_root.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
            )
            .unwrap();
        }

        let result =
            scan_import_paths(&[recent_root.to_string_lossy().to_string()], &empty_dedup());
        assert_eq!(result.events.len(), 1);
        assert_eq!(result.events[0].clips.len(), 2);
        assert_eq!(result.events[0].source, "recent");
        assert!(result.events[0].source_inferred);

        let _ = fs::remove_dir_all(&batch_root);
    }

    #[test]
    fn scan_tesla_cam_reads_flat_recent_clips() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let tesla_root = fixture_root().join("TeslaCam-mixed-layout");
        let recent_root = tesla_root.join("RecentClips");
        let sentry_root = tesla_root.join("SentryClips").join("2024-01-15_14-30-22");

        let _ = fs::remove_dir_all(&tesla_root);
        fs::create_dir_all(&recent_root).unwrap();
        fs::create_dir_all(&sentry_root).unwrap();

        for cam in ["front", "back"] {
            fs::copy(
                base.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
                recent_root.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
            )
            .unwrap();
            fs::copy(
                base.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
                sentry_root.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
            )
            .unwrap();
        }

        let events = scan_tesla_cam(&tesla_root, &empty_dedup());
        assert_eq!(events.len(), 2);

        let recent = events
            .iter()
            .find(|event| event.source == "recent")
            .expect("expected a recent event from flat RecentClips");
        assert!(recent.source_inferred);
        assert_eq!(recent.clips.len(), 2);

        let sentry = events
            .iter()
            .find(|event| event.source == "sentry")
            .expect("expected a sentry event from timestamp subfolder");
        assert!(sentry.source_inferred);
        assert_eq!(sentry.clips.len(), 2);

        let _ = fs::remove_dir_all(&tesla_root);
    }

    #[test]
    fn scan_import_paths_treats_timestamp_subfolders_as_separate_events() {
        let base = fixture_root()
            .join("SentryClips")
            .join("2024-01-15_14-30-22");
        let batch_root = fixture_root().join("batch-events");
        let event_a = batch_root.join("2024-01-15_14-30-22");
        let event_b = batch_root.join("2024-01-15_15-45-10");

        let _ = fs::remove_dir_all(&batch_root);
        fs::create_dir_all(&event_a).unwrap();
        fs::create_dir_all(&event_b).unwrap();

        for cam in ["front", "back"] {
            fs::copy(
                base.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
                event_a.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
            )
            .unwrap();
            fs::copy(
                base.join(format!("2024-01-15_14-30-22-{cam}.mp4")),
                event_b.join(format!("2024-01-15_15-45-10-{cam}.mp4")),
            )
            .unwrap();
        }

        let result = scan_import_paths(&[batch_root.to_string_lossy().to_string()], &empty_dedup());
        assert_eq!(result.events.len(), 2);
        assert_eq!(
            result
                .events
                .iter()
                .map(|event| event.clips.len())
                .sum::<usize>(),
            4
        );

        let _ = fs::remove_dir_all(&batch_root);
    }
}
