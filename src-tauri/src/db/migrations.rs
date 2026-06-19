use rusqlite::Connection;
use uuid::Uuid;

use crate::db::schema::{BUILTIN_TAGS, MIGRATION_001};
use crate::error::AppResult;

const CURRENT_VERSION: i32 = 1;

pub fn run_migrations(conn: &Connection) -> AppResult<()> {
    conn.execute_batch(MIGRATION_001)?;

    let version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if version >= CURRENT_VERSION {
        seed_builtin_tags(conn)?;
        return Ok(());
    }

    conn.execute(
        "INSERT INTO schema_version (version) VALUES (?1)",
        [CURRENT_VERSION],
    )?;

    seed_builtin_tags(conn)?;
    Ok(())
}

fn seed_builtin_tags(conn: &Connection) -> AppResult<()> {
    for name in BUILTIN_TAGS {
        let exists: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM tags WHERE name = ?1",
            [*name],
            |row| row.get(0),
        )?;

        if exists {
            continue;
        }

        conn.execute(
            "INSERT INTO tags (id, name, is_builtin) VALUES (?1, ?2, 1)",
            (Uuid::new_v4().to_string(), *name),
        )?;
    }

    Ok(())
}
