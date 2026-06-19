use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;

use chrono::Utc;
use rusqlite::params;
use serde::Serialize;
use uuid::Uuid;

use crate::db::Database;
use crate::error::{AppError, AppResult};
use crate::tesla::grouping::{
    scan_import_paths as scan_import_paths_inner, DetectedEvent, ImportDedupIndex, ScanImportResult,
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported_count: usize,
    pub skipped_count: usize,
    pub errors: Vec<String>,
    pub event_ids: Vec<String>,
}

pub fn get_imported_paths(db: &Database) -> AppResult<Vec<String>> {
    db.with_conn(|conn| {
        let mut stmt = conn.prepare("SELECT source_path FROM import_log")?;
        let paths = stmt
            .query_map([], |row| row.get(0))?
            .collect::<Result<Vec<String>, _>>()?;
        Ok(paths)
    })
}

pub fn get_imported_event_times(db: &Database) -> AppResult<Vec<String>> {
    db.with_conn(|conn| {
        let mut stmt = conn.prepare("SELECT event_time FROM events")?;
        let times = stmt
            .query_map([], |row| row.get(0))?
            .collect::<Result<Vec<String>, _>>()?;
        Ok(times)
    })
}

pub fn scan_import_paths(db: &Database, paths: Vec<String>) -> AppResult<ScanImportResult> {
    let dedup = ImportDedupIndex::new(get_imported_paths(db)?, get_imported_event_times(db)?);
    Ok(scan_import_paths_inner(&paths, &dedup))
}

pub fn import_detected_events(
    db: &Database,
    events: Vec<DetectedEvent>,
) -> AppResult<ImportResult> {
    let mut result = ImportResult {
        imported_count: 0,
        skipped_count: 0,
        errors: Vec::new(),
        event_ids: Vec::new(),
    };

    let mut imported_paths: HashSet<String> = get_imported_paths(db)?.into_iter().collect();
    let mut imported_event_times: HashSet<String> =
        get_imported_event_times(db)?.into_iter().collect();

    for event in events {
        if event.already_imported
            || imported_paths.contains(&event.folder_path)
            || imported_event_times.contains(&event.event_time)
        {
            result.skipped_count += 1;
            continue;
        }

        match import_detected_event(db, &event) {
            Ok(event_id) => {
                result.imported_count += 1;
                result.event_ids.push(event_id);
                imported_paths.insert(event.folder_path.clone());
                imported_event_times.insert(event.event_time.clone());
            }
            Err(err) => {
                result.errors.push(format!("{}: {err}", event.folder_path));
            }
        }
    }

    Ok(result)
}

fn import_detected_event(db: &Database, detected: &DetectedEvent) -> AppResult<String> {
    if detected.clips.is_empty() {
        return Err(AppError::Message("No MP4 clips found".to_string()));
    }

    let event_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let library_event_dir = build_library_event_dir(db, &detected.event_time, &event_id)?;

    fs::create_dir_all(&library_event_dir)?;

    let mut clip_rows = Vec::new();
    for clip in &detected.clips {
        let src = PathBuf::from(&clip.file_path);
        if !src.is_file() {
            return Err(AppError::Message(format!(
                "Clip not found: {}",
                clip.file_path
            )));
        }

        let filename = src
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| AppError::Message("Invalid clip filename".to_string()))?;
        let dest = library_event_dir.join(filename);
        fs::copy(&src, &dest)?;

        clip_rows.push((
            Uuid::new_v4().to_string(),
            clip.camera.clone(),
            dest.to_string_lossy().to_string(),
            clip.file_size,
            now.clone(),
        ));
    }

    db.with_conn(|conn| {
        conn.execute(
            "INSERT INTO events (id, event_time, source, import_path, library_path, note, archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, '', 0, ?6, ?6)",
            params![
                event_id,
                detected.event_time,
                detected.source,
                detected.folder_path,
                library_event_dir.to_string_lossy().to_string(),
                now,
            ],
        )?;

        for (clip_id, camera, file_path, file_size, created_at) in clip_rows {
            conn.execute(
                "INSERT INTO clips (id, event_id, camera, file_path, file_size, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![clip_id, event_id, camera, file_path, file_size, created_at],
            )?;
        }

        conn.execute(
            "INSERT INTO import_log (id, source_path, event_id, imported_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![
                Uuid::new_v4().to_string(),
                detected.folder_path,
                event_id,
                now,
            ],
        )?;

        Ok(())
    })?;

    Ok(event_id)
}

fn build_library_event_dir(db: &Database, event_time: &str, event_id: &str) -> AppResult<PathBuf> {
    let folder_name = event_time
        .chars()
        .take(19)
        .collect::<String>()
        .replace(':', "-")
        .replace('T', "_");

    let dir = db.library_root().join(&folder_name).join(&event_id[..8]);

    Ok(dir)
}
