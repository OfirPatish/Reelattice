use std::process::Child;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use serde::Serialize;

use crate::commands::drive_detect::DriveDetectState;
use crate::commands::import::ImportResult;
use crate::db::Database;
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ImportJobStatus {
    pub running: bool,
    pub total_events: u32,
    pub completed_events: u32,
    pub current_label: String,
    pub imported_count: u32,
    pub skipped_count: u32,
    pub cancelled: bool,
    pub errors: Vec<String>,
    pub event_ids: Vec<String>,
}

pub struct ImportJob {
    cancel: AtomicBool,
    status: Mutex<ImportJobStatus>,
}

impl ImportJob {
    pub fn new() -> Self {
        Self {
            cancel: AtomicBool::new(false),
            status: Mutex::new(ImportJobStatus::default()),
        }
    }

    pub fn is_running(&self) -> bool {
        self.status
            .lock()
            .map(|status| status.running)
            .unwrap_or(false)
    }

    pub fn begin(&self, total_events: usize) -> AppResult<()> {
        if self.is_running() {
            return Err(AppError::Message(
                "An import is already in progress.".into(),
            ));
        }

        self.cancel.store(false, Ordering::SeqCst);
        let mut status = self
            .status
            .lock()
            .map_err(|_| AppError::Message("Import status lock poisoned.".into()))?;
        *status = ImportJobStatus {
            running: true,
            total_events: total_events as u32,
            ..ImportJobStatus::default()
        };
        Ok(())
    }

    pub fn request_cancel(&self) {
        self.cancel.store(true, Ordering::SeqCst);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancel.load(Ordering::SeqCst)
    }

    pub fn set_current_label(&self, label: &str) {
        if let Ok(mut status) = self.status.lock() {
            status.current_label = label.to_string();
        }
    }

    pub fn increment_completed(&self) {
        if let Ok(mut status) = self.status.lock() {
            status.completed_events += 1;
        }
    }

    pub fn finish(&self, result: ImportResult) {
        if let Ok(mut status) = self.status.lock() {
            status.running = false;
            status.imported_count = result.imported_count as u32;
            status.skipped_count = result.skipped_count as u32;
            status.cancelled = result.cancelled;
            status.errors = result.errors;
            status.event_ids = result.event_ids;
            status.current_label.clear();
            if status.total_events == 0 {
                status.total_events = status.completed_events;
            }
        }
        self.cancel.store(false, Ordering::SeqCst);
    }

    pub fn snapshot(&self) -> ImportJobStatus {
        self.status
            .lock()
            .map(|status| status.clone())
            .unwrap_or_default()
    }
}

pub struct AppState {
    pub db: Arc<Database>,
    pub grid_export_lock: Arc<Mutex<()>>,
    pub active_ffmpeg: Arc<Mutex<Option<Child>>>,
    pub import_job: Arc<ImportJob>,
    pub drive_detect: Arc<DriveDetectState>,
}

impl AppState {
    pub fn new() -> Result<Self, crate::error::AppError> {
        Ok(Self {
            db: Arc::new(Database::open()?),
            grid_export_lock: Arc::new(Mutex::new(())),
            active_ffmpeg: Arc::new(Mutex::new(None)),
            import_job: Arc::new(ImportJob::new()),
            drive_detect: Arc::new(DriveDetectState::new()),
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
