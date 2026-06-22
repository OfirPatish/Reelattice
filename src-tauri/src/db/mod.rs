pub mod migrations;
pub mod schema;

use std::path::{Path, PathBuf};
use std::sync::{Mutex, RwLock};

use rusqlite::Connection;

use crate::error::{AppError, AppResult};
use crate::paths;

pub const LIBRARY_ROOT_SETTING_KEY: &str = "library_root";
pub const NOTIFY_TESLACAM_DRIVE_KEY: &str = "notify_teslacam_drive";

pub struct Database {
    conn: Mutex<Connection>,
    library_root: RwLock<PathBuf>,
}

impl Database {
    pub fn open() -> AppResult<Self> {
        let data_dir = paths::default_data_dir();
        std::fs::create_dir_all(&data_dir)?;

        let db_path = paths::default_db_path();
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(&db_path)?;
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        migrations::run_migrations(&conn)?;

        let library_root = read_library_root_setting(&conn)?.unwrap_or_else(paths::default_library_root);
        std::fs::create_dir_all(&library_root)?;

        Ok(Self {
            conn: Mutex::new(conn),
            library_root: RwLock::new(library_root),
        })
    }

    pub fn library_root(&self) -> PathBuf {
        self.library_root
            .read()
            .map(|guard| guard.clone())
            .unwrap_or_else(|_| paths::default_library_root())
    }

    pub fn set_library_root(&self, path: PathBuf) -> AppResult<()> {
        if !path.is_absolute() {
            return Err(AppError::Message(
                "Library location must be an absolute folder path.".into(),
            ));
        }

        std::fs::create_dir_all(&path)?;

        self.with_conn(|conn| write_library_root_setting(conn, &path))?;

        if let Ok(mut guard) = self.library_root.write() {
            *guard = path;
        }

        Ok(())
    }

    pub fn with_conn<F, T>(&self, f: F) -> AppResult<T>
    where
        F: FnOnce(&Connection) -> AppResult<T>,
    {
        let conn = self.conn.lock().map_err(|_| "Database lock poisoned")?;
        f(&conn)
    }
}

pub fn read_library_root_setting(conn: &Connection) -> AppResult<Option<PathBuf>> {
    let value: Result<String, rusqlite::Error> = conn.query_row(
        "SELECT value FROM app_settings WHERE key = ?1",
        [LIBRARY_ROOT_SETTING_KEY],
        |row| row.get(0),
    );

    match value {
        Ok(path) if !path.trim().is_empty() => Ok(Some(PathBuf::from(path))),
        Ok(_) => Ok(None),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(error.into()),
    }
}

fn write_library_root_setting(conn: &Connection, path: &Path) -> AppResult<()> {
    write_string_setting(conn, LIBRARY_ROOT_SETTING_KEY, &path.to_string_lossy())?;
    Ok(())
}

pub fn read_bool_setting(conn: &Connection, key: &str, default: bool) -> AppResult<bool> {
    let value: Result<String, rusqlite::Error> = conn.query_row(
        "SELECT value FROM app_settings WHERE key = ?1",
        [key],
        |row| row.get(0),
    );

    match value {
        Ok(raw) => Ok(matches!(raw.trim(), "1" | "true" | "yes" | "on")),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(default),
        Err(error) => Err(error.into()),
    }
}

pub fn write_bool_setting(conn: &Connection, key: &str, enabled: bool) -> AppResult<()> {
    write_string_setting(conn, key, if enabled { "true" } else { "false" })
}

fn write_string_setting(conn: &Connection, key: &str, value: &str) -> AppResult<()> {
    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )?;
    Ok(())
}
