use rusqlite::params;
use serde::Serialize;

use crate::db::Database;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkTagResult {
    pub updated: u32,
    pub failed: Vec<String>,
}

/// If every event has the tag, remove it from all; otherwise add to any missing.
pub fn bulk_toggle_tag(
    db: &Database,
    event_ids: &[String],
    tag_name: &str,
) -> AppResult<BulkTagResult> {
    if event_ids.is_empty() {
        return Ok(BulkTagResult {
            updated: 0,
            failed: Vec::new(),
        });
    }

    let all_have = db.with_conn(|conn| {
        let tag_id: String = conn.query_row(
            "SELECT id FROM tags WHERE name = ?1",
            params![tag_name],
            |row| row.get(0),
        )?;

        let mut count = 0u32;
        for event_id in event_ids {
            let has: i64 = conn.query_row(
                "SELECT COUNT(*) FROM event_tags WHERE event_id = ?1 AND tag_id = ?2",
                params![event_id, tag_id],
                |row| row.get(0),
            )?;
            if has > 0 {
                count += 1;
            }
        }

        Ok(count as usize == event_ids.len())
    })?;

    bulk_apply_tag(db, event_ids, tag_name, !all_have)
}

fn bulk_apply_tag(
    db: &Database,
    event_ids: &[String],
    tag_name: &str,
    add: bool,
) -> AppResult<BulkTagResult> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut updated = 0u32;
    let mut failed = Vec::new();

    db.with_conn(|conn| {
        let tag_id: String = conn.query_row(
            "SELECT id FROM tags WHERE name = ?1",
            params![tag_name],
            |row| row.get(0),
        )?;

        for event_id in event_ids {
            let result = if add {
                conn.execute(
                    "INSERT OR IGNORE INTO event_tags (event_id, tag_id) VALUES (?1, ?2)",
                    params![event_id, tag_id],
                )
                .and_then(|_| {
                    conn.execute(
                        "UPDATE events SET updated_at = ?1 WHERE id = ?2",
                        params![now, event_id],
                    )
                })
            } else {
                conn.execute(
                    "DELETE FROM event_tags WHERE event_id = ?1 AND tag_id = ?2",
                    params![event_id, tag_id],
                )
                .and_then(|_| {
                    conn.execute(
                        "UPDATE events SET updated_at = ?1 WHERE id = ?2",
                        params![now, event_id],
                    )
                })
            };

            match result {
                Ok(_) => updated += 1,
                Err(_) => failed.push(event_id.clone()),
            }
        }

        Ok(())
    })?;

    Ok(BulkTagResult { updated, failed })
}
