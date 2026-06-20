use chrono::Utc;
use rusqlite::params;
use serde::Serialize;
use uuid::Uuid;

use crate::db::Database;
use crate::error::{AppError, AppResult};

use super::events::{load_event_by_id, DashEvent};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaseSummary {
    pub id: String,
    pub title: String,
    pub description: String,
    pub event_count: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaseDetail {
    pub id: String,
    pub title: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
    pub events: Vec<DashEvent>,
}

pub fn list_cases(db: &Database) -> AppResult<Vec<CaseSummary>> {
    db.with_conn(|conn| {
        let mut stmt = conn.prepare(
            "SELECT c.id, c.title, c.description, c.created_at, c.updated_at,
                    COUNT(ce.event_id) AS event_count
             FROM cases c
             LEFT JOIN case_events ce ON ce.case_id = c.id
             GROUP BY c.id
             ORDER BY c.updated_at DESC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(CaseSummary {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                event_count: row.get(5)?,
            })
        })?;

        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
    })
}

pub fn get_case(db: &Database, case_id: &str) -> AppResult<CaseDetail> {
    let (id, title, description, created_at, updated_at, event_ids) = db.with_conn(|conn| {
        let row = conn.query_row(
            "SELECT id, title, description, created_at, updated_at FROM cases WHERE id = ?1",
            params![case_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                ))
            },
        );

        let (id, title, description, created_at, updated_at) = match row {
            Ok(values) => values,
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                return Err(AppError::Message(format!("Case not found: {case_id}")));
            }
            Err(error) => return Err(error.into()),
        };

        let mut stmt = conn.prepare(
            "SELECT event_id FROM case_events WHERE case_id = ?1 ORDER BY sort_order ASC, rowid ASC",
        )?;
        let event_ids = stmt
            .query_map(params![case_id], |row| row.get::<_, String>(0))?
            .collect::<Result<Vec<_>, _>>()?;

        Ok((id, title, description, created_at, updated_at, event_ids))
    })?;

    let mut events = Vec::new();
    for event_id in event_ids {
        events.push(load_event_by_id(db, &event_id)?);
    }

    Ok(CaseDetail {
        id,
        title,
        description,
        created_at,
        updated_at,
        events,
    })
}

pub fn create_case(db: &Database, title: &str, description: &str) -> AppResult<CaseSummary> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::Message("Case title is required.".into()));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.with_conn(|conn| {
        conn.execute(
            "INSERT INTO cases (id, title, description, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?4)",
            params![id, title, description.trim(), now],
        )?;
        Ok(())
    })?;

    Ok(CaseSummary {
        id,
        title: title.to_string(),
        description: description.trim().to_string(),
        event_count: 0,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_case(
    db: &Database,
    case_id: &str,
    title: &str,
    description: &str,
) -> AppResult<()> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::Message("Case title is required.".into()));
    }

    let now = Utc::now().to_rfc3339();
    db.with_conn(|conn| {
        let updated = conn.execute(
            "UPDATE cases SET title = ?1, description = ?2, updated_at = ?3 WHERE id = ?4",
            params![title, description.trim(), now, case_id],
        )?;
        if updated == 0 {
            return Err(AppError::Message(format!("Case not found: {case_id}")));
        }
        Ok(())
    })
}

pub fn delete_case(db: &Database, case_id: &str) -> AppResult<()> {
    db.with_conn(|conn| {
        let updated = conn.execute("DELETE FROM cases WHERE id = ?1", params![case_id])?;
        if updated == 0 {
            return Err(AppError::Message(format!("Case not found: {case_id}")));
        }
        Ok(())
    })
}

pub fn add_events_to_case(db: &Database, case_id: &str, event_ids: &[String]) -> AppResult<u32> {
    if event_ids.is_empty() {
        return Ok(0);
    }

    let now = Utc::now().to_rfc3339();
    let mut added = 0u32;

    db.with_conn(|conn| {
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM cases WHERE id = ?1",
            params![case_id],
            |row| row.get(0),
        )?;
        if !exists {
            return Err(AppError::Message(format!("Case not found: {case_id}")));
        }

        let max_sort: i64 = conn.query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM case_events WHERE case_id = ?1",
            params![case_id],
            |row| row.get(0),
        )?;

        let mut next_sort = max_sort + 1;

        for event_id in event_ids {
            let event_exists: bool = conn.query_row(
                "SELECT COUNT(*) > 0 FROM events WHERE id = ?1",
                params![event_id],
                |row| row.get(0),
            )?;
            if !event_exists {
                continue;
            }

            let inserted = conn.execute(
                "INSERT OR IGNORE INTO case_events (case_id, event_id, sort_order)
                 VALUES (?1, ?2, ?3)",
                params![case_id, event_id, next_sort],
            )?;

            if inserted > 0 {
                added += 1;
                next_sort += 1;
            }
        }

        conn.execute(
            "UPDATE cases SET updated_at = ?1 WHERE id = ?2",
            params![now, case_id],
        )?;

        Ok(added)
    })
}

pub fn remove_event_from_case(db: &Database, case_id: &str, event_id: &str) -> AppResult<()> {
    let now = Utc::now().to_rfc3339();
    db.with_conn(|conn| {
        conn.execute(
            "DELETE FROM case_events WHERE case_id = ?1 AND event_id = ?2",
            params![case_id, event_id],
        )?;
        conn.execute(
            "UPDATE cases SET updated_at = ?1 WHERE id = ?2",
            params![now, case_id],
        )?;
        Ok(())
    })
}