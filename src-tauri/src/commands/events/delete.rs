use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use rusqlite::params;
use serde::Serialize;

use crate::db::Database;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkDeleteResult {
    pub deleted: u32,
    pub failed: Vec<String>,
}

pub fn bulk_delete_events(db: &Database, event_ids: &[String]) -> AppResult<BulkDeleteResult> {
    let mut deleted = 0u32;
    let mut failed = Vec::new();

    for event_id in event_ids {
        match delete_event(db, event_id) {
            Ok(()) => deleted += 1,
            Err(_) => failed.push(event_id.clone()),
        }
    }

    Ok(BulkDeleteResult { deleted, failed })
}

pub fn delete_event(db: &Database, event_id: &str) -> AppResult<()> {
    let library_path: String = db.with_conn(|conn| {
        let path = conn.query_row(
            "SELECT library_path FROM events WHERE id = ?1",
            params![event_id],
            |row| row.get(0),
        )?;
        Ok(path)
    })?;

    db.with_conn(|conn| {
        conn.execute(
            "DELETE FROM import_log WHERE event_id = ?1",
            params![event_id],
        )?;
        conn.execute("DELETE FROM events WHERE id = ?1", params![event_id])?;
        Ok(())
    })?;

    let path = Path::new(&library_path);
    if path.exists() {
        fs::remove_dir_all(path)?;
    }

    remove_empty_parents(path.parent(), db.library_root())?;

    Ok(())
}

/// Removes empty ancestor folders up to (but not including) `library_root`.
fn remove_empty_parents(dir: Option<&Path>, library_root: &Path) -> AppResult<()> {
    let library_root = canonicalize_or_original(library_root);
    let mut current = dir.map(canonicalize_or_original);

    while let Some(dir_path) = current {
        if dir_path == library_root || !dir_path.starts_with(&library_root) {
            break;
        }

        match fs::remove_dir(&dir_path) {
            Ok(()) => current = dir_path.parent().map(canonicalize_or_original),
            Err(err)
                if matches!(
                    err.kind(),
                    ErrorKind::NotFound | ErrorKind::DirectoryNotEmpty
                ) =>
            {
                break;
            }
            Err(err) => return Err(err.into()),
        }
    }

    Ok(())
}

fn canonicalize_or_original(path: &Path) -> PathBuf {
    path.canonicalize().unwrap_or_else(|_| path.to_path_buf())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_library_root() -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        std::env::temp_dir().join(format!("reelattice-delete-test-{nanos}"))
    }

    #[test]
    fn removes_empty_timestamp_folder_after_event_delete() {
        let library_root = temp_library_root();
        let event_dir = library_root.join("2024-01-15_14-30-22").join("abcd1234");
        fs::create_dir_all(&event_dir).unwrap();
        fs::write(event_dir.join("front.mp4"), b"x").unwrap();

        fs::remove_dir_all(&event_dir).unwrap();
        remove_empty_parents(event_dir.parent(), &library_root).unwrap();

        assert!(!library_root.join("2024-01-15_14-30-22").exists());
        let _ = fs::remove_dir_all(&library_root);
    }

    #[test]
    fn keeps_timestamp_folder_when_sibling_events_remain() {
        let library_root = temp_library_root();
        let timestamp_dir = library_root.join("2024-01-15_14-30-22");
        let event_a = timestamp_dir.join("aaaa1111");
        let event_b = timestamp_dir.join("bbbb2222");
        fs::create_dir_all(&event_a).unwrap();
        fs::create_dir_all(&event_b).unwrap();

        fs::remove_dir_all(&event_a).unwrap();
        remove_empty_parents(event_a.parent(), &library_root).unwrap();

        assert!(timestamp_dir.exists());
        assert!(!event_a.exists());
        assert!(event_b.exists());
        let _ = fs::remove_dir_all(&library_root);
    }
}
