pub mod migrations;
pub mod schema;

use std::path::Path;
use std::sync::Mutex;

use rusqlite::Connection;

use crate::error::AppResult;
use crate::paths;

pub struct Database {
    conn: Mutex<Connection>,
    library_root: std::path::PathBuf,
}

impl Database {
    pub fn open() -> AppResult<Self> {
        let data_dir = paths::default_data_dir();
        std::fs::create_dir_all(&data_dir)?;

        let library_root = paths::default_library_root();
        std::fs::create_dir_all(&library_root)?;

        let db_path = paths::default_db_path();
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(&db_path)?;
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        migrations::run_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
            library_root,
        })
    }

    pub fn library_root(&self) -> &Path {
        &self.library_root
    }

    pub fn with_conn<F, T>(&self, f: F) -> AppResult<T>
    where
        F: FnOnce(&Connection) -> AppResult<T>,
    {
        let conn = self.conn.lock().map_err(|_| "Database lock poisoned")?;
        f(&conn)
    }
}
