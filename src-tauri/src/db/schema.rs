pub const MIGRATION_001: &str = r#"
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id            TEXT PRIMARY KEY,
  event_time    TEXT NOT NULL,
  source        TEXT NOT NULL,
  import_path   TEXT,
  library_path  TEXT NOT NULL,
  note          TEXT DEFAULT '',
  archived      INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clips (
  id            TEXT PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  camera        TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  duration_ms   INTEGER,
  thumbnail_path TEXT,
  file_size     INTEGER,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  is_builtin    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS event_tags (
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id        TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

CREATE TABLE IF NOT EXISTS cases (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS case_events (
  case_id       TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sort_order    INTEGER DEFAULT 0,
  PRIMARY KEY (case_id, event_id)
);

CREATE TABLE IF NOT EXISTS import_log (
  id            TEXT PRIMARY KEY,
  source_path   TEXT NOT NULL UNIQUE,
  event_id      TEXT NOT NULL REFERENCES events(id),
  imported_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_event_time ON events(event_time);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_clips_event_id ON clips(event_id);
"#;

pub const BUILTIN_TAGS: &[&str] = &[
    "Accident",
    "Near Miss",
    "Parking Incident",
    "Vandalism",
    "Hit and Run",
    "Other",
];

pub const MIGRATION_002: &str = r#"
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
"#;
