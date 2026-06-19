use std::path::Path;

use rusqlite::params;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::db::Database;
use crate::error::{AppError, AppResult};

pub fn open_event_folder(db: &Database, app: &AppHandle, event_id: &str) -> AppResult<()> {
    let library_path: String = db.with_conn(|conn| {
        let path = conn.query_row(
            "SELECT library_path FROM events WHERE id = ?1",
            params![event_id],
            |row| row.get(0),
        )?;
        Ok(path)
    })?;

    open_path(app, &library_path)
}

pub fn open_library_folder(app: &AppHandle) -> AppResult<()> {
    let path = crate::paths::default_library_root();
    open_path(app, &path.to_string_lossy())
}

pub fn open_data_folder(app: &AppHandle) -> AppResult<()> {
    let db_path = crate::paths::default_db_path();
    let folder = db_path
        .parent()
        .ok_or_else(|| AppError::Message("Database path has no parent folder".to_string()))?;
    open_path(app, &folder.to_string_lossy())
}

fn open_path(app: &AppHandle, path: &str) -> AppResult<()> {
    let target = Path::new(path);
    if !target.exists() {
        return Err(AppError::Message(format!("Path not found: {path}")));
    }

    app.opener()
        .open_path(path, None::<&str>)
        .map_err(|err| AppError::Message(err.to_string()))
}
