use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::db::{
    read_bool_setting, write_bool_setting, Database, NOTIFY_TESLACAM_DRIVE_KEY,
};
use crate::error::AppResult;
use crate::tesla::drive_watch::{scan_teslacam_drives, TeslaCamDriveDetectedPayload};

const POLL_INTERVAL: Duration = Duration::from_secs(2);
const EVENT_NAME: &str = "tesla-cam-drive-detected";

pub struct DriveDetectState {
    dismissed: Mutex<HashSet<String>>,
    emitted_while_mounted: Mutex<HashSet<String>>,
    stop: AtomicBool,
}

impl DriveDetectState {
    pub fn new() -> Self {
        Self {
            dismissed: Mutex::new(HashSet::new()),
            emitted_while_mounted: Mutex::new(HashSet::new()),
            stop: AtomicBool::new(false),
        }
    }

    pub fn stop_watch(&self) {
        self.stop.store(true, Ordering::Relaxed);
    }

    pub fn dismiss_volume(&self, volume_id: &str) {
        if let Ok(mut dismissed) = self.dismissed.lock() {
            dismissed.insert(volume_id.to_string());
        }
    }

    pub fn start_watch(self: &Arc<Self>, app: AppHandle, db: Arc<Database>) {
        #[cfg(windows)]
        {
            let state = Arc::clone(self);
            thread::spawn(move || {
                while !state.stop.load(Ordering::Relaxed) {
                    if read_notify_teslacam_drive(&db).unwrap_or(true) {
                        poll_and_emit(&app, &state);
                    }
                    thread::sleep(POLL_INTERVAL);
                }
            });
        }

        let _ = db;
        let _ = app;
    }
}

fn poll_and_emit(app: &AppHandle, state: &DriveDetectState) {
    let drives = scan_teslacam_drives();
    let mounted_ids: HashSet<String> = drives.iter().map(|drive| drive.volume_id.clone()).collect();

    if let Ok(mut emitted) = state.emitted_while_mounted.lock() {
        emitted.retain(|volume_id| mounted_ids.contains(volume_id));
    }

    let dismissed = state
        .dismissed
        .lock()
        .map(|set| set.clone())
        .unwrap_or_default();

    let mut pending = Vec::new();

    for drive in drives {
        if dismissed.contains(&drive.volume_id) {
            continue;
        }

        let already_emitted = state
            .emitted_while_mounted
            .lock()
            .map(|set| set.contains(&drive.volume_id))
            .unwrap_or(false);

        if already_emitted {
            continue;
        }

        pending.push(drive);
    }

    if pending.is_empty() {
        return;
    }

    let Some(drive) = pending.into_iter().next() else {
        return;
    };

    if let Ok(mut emitted) = state.emitted_while_mounted.lock() {
        emitted.insert(drive.volume_id.clone());
    }

    let _ = app.emit(
        EVENT_NAME,
        TeslaCamDriveDetectedPayload {
            drives: vec![drive],
        },
    );
}

pub fn read_notify_teslacam_drive(db: &Database) -> AppResult<bool> {
    db.with_conn(|conn| read_bool_setting(conn, NOTIFY_TESLACAM_DRIVE_KEY, true))
}

pub fn write_notify_teslacam_drive(db: &Database, enabled: bool) -> AppResult<()> {
    db.with_conn(|conn| write_bool_setting(conn, NOTIFY_TESLACAM_DRIVE_KEY, enabled))
}

pub fn dismiss_teslacam_drive(state: &DriveDetectState, volume_id: String) {
    state.dismiss_volume(&volume_id);
}
