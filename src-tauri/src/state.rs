use std::process::Child;
use std::sync::{Arc, Mutex};

use crate::db::Database;

pub struct AppState {
    pub db: Arc<Database>,
    /// Only one grid video export at a time — FFmpeg is CPU-heavy and locks output files.
    pub grid_export_lock: Arc<Mutex<()>>,
    /// Running FFmpeg child, killed automatically when the app exits.
    pub active_ffmpeg: Arc<Mutex<Option<Child>>>,
}

impl AppState {
    pub fn new() -> Result<Self, crate::error::AppError> {
        Ok(Self {
            db: Arc::new(Database::open()?),
            grid_export_lock: Arc::new(Mutex::new(())),
            active_ffmpeg: Arc::new(Mutex::new(None)),
        })
    }

    pub fn stop_active_ffmpeg(&self) {
        let Ok(mut guard) = self.active_ffmpeg.lock() else {
            return;
        };

        if let Some(child) = guard.as_mut() {
            let _ = child.kill();
            let _ = child.wait();
        }

        *guard = None;
    }
}
