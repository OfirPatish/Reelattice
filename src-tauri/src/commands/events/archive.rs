use rusqlite::params;
use serde::Serialize;

use crate::db::Database;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkArchiveResult {
    pub updated: u32,
    pub failed: Vec<String>,
}

pub fn set_event_archived(db: &Database, event_id: &str, archived: bool) -> AppResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    let archived_flag = i64::from(archived);

    db.with_conn(|conn| {
        let changed = conn.execute(
            "UPDATE events SET archived = ?1, updated_at = ?2 WHERE id = ?3",
            params![archived_flag, now, event_id],
        )?;

        if changed == 0 {
            return Err(AppError::Message(format!("Event not found: {event_id}")));
        }

        Ok(())
    })
}

pub fn bulk_set_events_archived(
    db: &Database,
    event_ids: &[String],
    archived: bool,
) -> AppResult<BulkArchiveResult> {
    let mut updated = 0u32;
    let mut failed = Vec::new();

    for event_id in event_ids {
        match set_event_archived(db, event_id, archived) {
            Ok(()) => updated += 1,
            Err(_) => failed.push(event_id.clone()),
        }
    }

    Ok(BulkArchiveResult { updated, failed })
}
