mod archive;
mod delete;
mod export;
mod open;
mod tags;

pub use archive::{bulk_set_events_archived, set_event_archived, BulkArchiveResult};
pub use delete::{bulk_delete_events, delete_event, BulkDeleteResult};
pub use export::{
    bulk_export_events_zip, export_event_zip, export_event_zip_segment, BulkExportResult,
};
pub use open::{open_data_folder, open_event_folder, open_library_folder};
pub use tags::{bulk_toggle_tag, BulkTagResult};

use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::Database;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Clip {
    pub id: String,
    pub event_id: String,
    pub camera: String,
    pub file_path: String,
    pub duration_ms: Option<i64>,
    pub thumbnail_path: Option<String>,
    pub file_size: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashEvent {
    pub id: String,
    pub event_time: String,
    pub source: String,
    pub note: String,
    pub archived: bool,
    pub tags: Vec<String>,
    pub clips: Vec<Clip>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EventFilters {
    pub query: Option<String>,
    pub tag: Option<String>,
    pub source: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    /// `"active"` (default) or `"archived"`
    pub archived: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagInfo {
    pub id: String,
    pub name: String,
    pub is_builtin: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryStats {
    pub event_count: u32,
    pub archived_count: u32,
    pub clip_count: u32,
    pub tag_count: u32,
    pub library_bytes: u64,
    pub db_bytes: u64,
    pub sentry_count: u32,
    pub recent_count: u32,
    pub saved_count: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub library_path: String,
    pub db_path: String,
    pub version: String,
    pub stats: LibraryStats,
}

pub fn list_events(db: &Database, filters: EventFilters) -> AppResult<Vec<DashEvent>> {
    db.with_conn(|conn| {
        let show_archived = filters.archived.as_deref() == Some("archived");
        let sql = if show_archived {
            "SELECT id, event_time, source, note, archived, created_at, updated_at
             FROM events WHERE archived = 1 ORDER BY event_time DESC"
        } else {
            "SELECT id, event_time, source, note, archived, created_at, updated_at
             FROM events WHERE archived = 0 ORDER BY event_time DESC"
        };

        let mut stmt = conn.prepare(sql)?;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
            ))
        })?;

        let mut events = Vec::new();
        for row in rows {
            let (id, event_time, source, note, archived, created_at, updated_at) = row?;
            let tags = load_event_tags(conn, &id)?;
            let clips = load_event_clips(conn, &id)?;

            events.push(DashEvent {
                id,
                event_time,
                source,
                note,
                archived: archived != 0,
                tags,
                clips,
                created_at,
                updated_at,
            });
        }

        Ok(apply_filters(events, filters))
    })
}

fn apply_filters(mut events: Vec<DashEvent>, filters: EventFilters) -> Vec<DashEvent> {
    if let Some(source) = filters.source.filter(|s| !s.is_empty()) {
        events.retain(|e| e.source == source);
    }

    if let Some(tag) = filters.tag.filter(|t| !t.is_empty()) {
        events.retain(|e| e.tags.iter().any(|t| t == &tag));
    }

    if let Some(from) = filters.date_from.filter(|d| !d.is_empty()) {
        events.retain(|e| e.event_time >= from);
    }

    if let Some(to) = filters.date_to.filter(|d| !d.is_empty()) {
        events.retain(|e| e.event_time <= to);
    }

    if let Some(query) = filters.query.filter(|q| !q.is_empty()) {
        let lower = query.to_lowercase();
        events.retain(|e| {
            e.note.to_lowercase().contains(&lower)
                || e.tags.iter().any(|t| t.to_lowercase().contains(&lower))
                || e.source.to_lowercase().contains(&lower)
        });
    }

    events
}

pub fn set_event_source(db: &Database, event_id: &str, source: &str) -> AppResult<()> {
    if !matches!(source, "recent" | "sentry" | "saved") {
        return Err(crate::error::AppError::Message(format!(
            "Invalid source: {source}"
        )));
    }

    let now = chrono::Utc::now().to_rfc3339();
    db.with_conn(|conn| {
        let updated = conn.execute(
            "UPDATE events SET source = ?1, updated_at = ?2 WHERE id = ?3",
            params![source, now, event_id],
        )?;
        if updated == 0 {
            return Err(crate::error::AppError::Message(format!(
                "Event not found: {event_id}"
            )));
        }
        Ok(())
    })
}

pub fn update_event_note(db: &Database, event_id: &str, note: &str) -> AppResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    db.with_conn(|conn| {
        conn.execute(
            "UPDATE events SET note = ?1, updated_at = ?2 WHERE id = ?3",
            params![note, now, event_id],
        )?;
        Ok(())
    })
}

pub fn set_event_tags(db: &Database, event_id: &str, tag_names: Vec<String>) -> AppResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    db.with_conn(|conn| {
        conn.execute(
            "DELETE FROM event_tags WHERE event_id = ?1",
            params![event_id],
        )?;

        for name in tag_names {
            let tag_id: String = conn.query_row(
                "SELECT id FROM tags WHERE name = ?1",
                params![name],
                |row| row.get(0),
            )?;
            conn.execute(
                "INSERT INTO event_tags (event_id, tag_id) VALUES (?1, ?2)",
                params![event_id, tag_id],
            )?;
        }

        conn.execute(
            "UPDATE events SET updated_at = ?1 WHERE id = ?2",
            params![now, event_id],
        )?;
        Ok(())
    })
}

pub fn list_tags(db: &Database) -> AppResult<Vec<TagInfo>> {
    db.with_conn(|conn| {
        let mut stmt = conn
            .prepare("SELECT id, name, is_builtin FROM tags ORDER BY is_builtin DESC, name ASC")?;
        let tags = stmt
            .query_map([], |row| {
                Ok(TagInfo {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    is_builtin: row.get::<_, i64>(2)? != 0,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(tags)
    })
}

pub fn get_settings(db: &Database) -> AppResult<AppSettings> {
    let library_path = db.library_root();
    let db_path = crate::paths::default_db_path();

    let stats = db.with_conn(|conn| {
        let event_count: u32 = conn.query_row(
            "SELECT COUNT(*) FROM events WHERE archived = 0",
            [],
            |row| row.get(0),
        )?;
        let archived_count: u32 = conn.query_row(
            "SELECT COUNT(*) FROM events WHERE archived = 1",
            [],
            |row| row.get(0),
        )?;
        let clip_count: u32 = conn.query_row("SELECT COUNT(*) FROM clips", [], |row| row.get(0))?;
        let tag_count: u32 = conn.query_row("SELECT COUNT(*) FROM tags", [], |row| row.get(0))?;
        let sentry_count: u32 = conn.query_row(
            "SELECT COUNT(*) FROM events WHERE archived = 0 AND source = 'sentry'",
            [],
            |row| row.get(0),
        )?;
        let recent_count: u32 = conn.query_row(
            "SELECT COUNT(*) FROM events WHERE archived = 0 AND source = 'recent'",
            [],
            |row| row.get(0),
        )?;
        let saved_count: u32 = conn.query_row(
            "SELECT COUNT(*) FROM events WHERE archived = 0 AND source = 'saved'",
            [],
            |row| row.get(0),
        )?;
        let library_bytes: u64 = conn.query_row(
            "SELECT COALESCE(SUM(file_size), 0) FROM clips",
            [],
            |row| row.get(0),
        )?;

        Ok(LibraryStats {
            event_count,
            archived_count,
            clip_count,
            tag_count,
            library_bytes,
            db_bytes: file_size(&db_path),
            sentry_count,
            recent_count,
            saved_count,
        })
    })?;

    Ok(AppSettings {
        library_path: library_path.to_string_lossy().to_string(),
        db_path: db_path.to_string_lossy().to_string(),
        version: format_display_version(env!("CARGO_PKG_VERSION")),
        stats,
    })
}

fn format_display_version(version: &str) -> String {
    let mut parts = version.split('.');
    let major = parts.next().unwrap_or("0");
    let minor = parts.next().unwrap_or("0");
    let patch = parts.next();

    if patch == Some("0") {
        format!("{major}.{minor}")
    } else if let Some(patch) = patch {
        format!("{major}.{minor}.{patch}")
    } else {
        version.to_string()
    }
}

pub(crate) fn load_event_by_id(db: &Database, event_id: &str) -> AppResult<DashEvent> {
    db.with_conn(|conn| {
        let row = conn.query_row(
            "SELECT id, event_time, source, note, archived, created_at, updated_at
             FROM events WHERE id = ?1",
            params![event_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, i64>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                ))
            },
        );

        let (id, event_time, source, note, archived, created_at, updated_at) = row
            .map_err(|_| crate::error::AppError::Message(format!("Event not found: {event_id}")))?;

        let tags = load_event_tags(conn, &id)?;
        let clips = load_event_clips(conn, &id)?;

        Ok(DashEvent {
            id,
            event_time,
            source,
            note,
            archived: archived != 0,
            tags,
            clips,
            created_at,
            updated_at,
        })
    })
}

fn load_event_tags(conn: &rusqlite::Connection, event_id: &str) -> AppResult<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT t.name FROM tags t
         JOIN event_tags et ON et.tag_id = t.id
         WHERE et.event_id = ?1
         ORDER BY t.name",
    )?;
    let tags = stmt
        .query_map(params![event_id], |row| row.get(0))?
        .collect::<Result<Vec<String>, _>>()?;
    Ok(tags)
}

fn load_event_clips(conn: &rusqlite::Connection, event_id: &str) -> AppResult<Vec<Clip>> {
    let mut stmt = conn.prepare(
        "SELECT id, event_id, camera, file_path, duration_ms, thumbnail_path, file_size
         FROM clips WHERE event_id = ?1 ORDER BY camera",
    )?;
    let clips = stmt
        .query_map(params![event_id], |row| {
            Ok(Clip {
                id: row.get(0)?,
                event_id: row.get(1)?,
                camera: row.get(2)?,
                file_path: row.get(3)?,
                duration_ms: row.get(4)?,
                thumbnail_path: row.get(5)?,
                file_size: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(clips)
}

fn file_size(path: &Path) -> u64 {
    fs::metadata(path)
        .map(|metadata| metadata.len())
        .unwrap_or(0)
}

pub fn ensure_clip_thumbnail(
    app: &tauri::AppHandle,
    db: &Database,
    clip_id: &str,
) -> AppResult<String> {
    let clip = load_clip_by_id(db, clip_id)?;
    let clip_path = Path::new(&clip.file_path);

    if !clip_path.is_file() {
        return Err(crate::error::AppError::Message(format!(
            "Clip file not found: {}",
            clip.file_path
        )));
    }

    let dest = thumbnail_dest_path(db, clip_id);

    if let Some(existing) = &clip.thumbnail_path {
        let existing_path = Path::new(existing);
        if existing_path.is_file() && existing_path == dest {
            return Ok(existing.clone());
        }
    }

    if dest.is_file() {
        let dest_str = dest.to_string_lossy().to_string();
        update_clip_thumbnail_path(db, clip_id, &dest_str)?;
        return Ok(dest_str);
    }

    migrate_legacy_thumbnail(clip_id, &dest)?;

    if dest.is_file() {
        let dest_str = dest.to_string_lossy().to_string();
        update_clip_thumbnail_path(db, clip_id, &dest_str)?;
        return Ok(dest_str);
    }

    let ffmpeg = crate::tesla::ffmpeg::resolve_ffmpeg(app)?;
    crate::tesla::ffmpeg::extract_thumbnail_jpeg(&ffmpeg, clip_path, &dest, 0.4)?;

    let dest_str = dest.to_string_lossy().to_string();
    update_clip_thumbnail_path(db, clip_id, &dest_str)?;
    Ok(dest_str)
}

pub fn get_clip_thumbnail_data(
    app: &tauri::AppHandle,
    db: &Database,
    clip_id: &str,
) -> AppResult<String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};

    let path = ensure_clip_thumbnail(app, db, clip_id)?;
    let bytes = fs::read(&path)?;
    Ok(STANDARD.encode(bytes))
}

fn thumbnail_dest_path(db: &Database, clip_id: &str) -> PathBuf {
    db.library_root()
        .join(".thumbnails")
        .join(format!("{clip_id}.jpg"))
}

fn migrate_legacy_thumbnail(clip_id: &str, dest: &Path) -> AppResult<()> {
    if dest.is_file() {
        return Ok(());
    }

    let legacy = crate::paths::default_thumbnails_dir().join(format!("{clip_id}.jpg"));
    if !legacy.is_file() {
        return Ok(());
    }

    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::copy(&legacy, dest)?;
    Ok(())
}

fn load_clip_by_id(db: &Database, clip_id: &str) -> AppResult<Clip> {
    db.with_conn(|conn| {
        conn.query_row(
            "SELECT id, event_id, camera, file_path, duration_ms, thumbnail_path, file_size
             FROM clips WHERE id = ?1",
            params![clip_id],
            |row| {
                Ok(Clip {
                    id: row.get(0)?,
                    event_id: row.get(1)?,
                    camera: row.get(2)?,
                    file_path: row.get(3)?,
                    duration_ms: row.get(4)?,
                    thumbnail_path: row.get(5)?,
                    file_size: row.get(6)?,
                })
            },
        )
        .map_err(|_| crate::error::AppError::Message(format!("Clip not found: {clip_id}")))
    })
}

fn update_clip_thumbnail_path(db: &Database, clip_id: &str, thumbnail_path: &str) -> AppResult<()> {
    db.with_conn(|conn| {
        conn.execute(
            "UPDATE clips SET thumbnail_path = ?1 WHERE id = ?2",
            params![thumbnail_path, clip_id],
        )?;
        Ok(())
    })
}
