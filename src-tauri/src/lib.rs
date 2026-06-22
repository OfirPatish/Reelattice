mod commands;
mod db;
mod error;
mod paths;
mod state;
mod tesla;

use std::sync::Arc;

use commands::cases::{
    add_events_to_case, create_case, delete_case, get_case, list_cases, remove_event_from_case,
    update_case, CaseDetail, CaseSummary,
};
use commands::drive_detect::{dismiss_teslacam_drive, write_notify_teslacam_drive};
use commands::events::{
    bulk_delete_events as bulk_delete_event_records, bulk_export_events_zip,
    bulk_set_events_archived as bulk_set_event_archive, bulk_toggle_tag as bulk_toggle_event_tag,
    delete_event as delete_event_record, ensure_clip_thumbnail as ensure_clip_thumbnail_path,
    export_event_zip, export_event_zip_segment,
    get_clip_thumbnail_data as get_clip_thumbnail_data_inner, get_settings, list_events, list_tags,
    load_event_by_id, open_data_folder as open_data_folder_path,
    open_event_folder as open_event_folder_path, open_library_folder as open_library_folder_path,
    set_event_archived, set_event_source, set_event_tags, update_event_note, AppSettings,
    BulkArchiveResult, BulkDeleteResult, BulkExportResult, BulkTagResult, DashEvent, EventFilters,
    TagInfo,
};
use commands::import::{
    import_detected_events, scan_import_paths as scan_import_paths_cmd,
    set_library_location as set_library_location_cmd, ImportResult,
};
use state::{AppState, ImportJobStatus};
use tauri::Manager;
use tesla::grid_video;
use tesla::{DetectedEvent, ScanImportResult};

#[tauri::command]
async fn scan_import_paths(
    state: tauri::State<'_, AppState>,
    paths: Vec<String>,
) -> Result<ScanImportResult, error::AppError> {
    let db = Arc::clone(&state.db);

    tauri::async_runtime::spawn_blocking(move || scan_import_paths_cmd(&db, paths))
        .await
        .map_err(|error| error::AppError::Message(format!("Import scan failed: {error}")))?
}

#[tauri::command]
async fn start_import_tesla_events(
    state: tauri::State<'_, AppState>,
    events: Vec<DetectedEvent>,
) -> Result<(), error::AppError> {
    let db = Arc::clone(&state.db);
    let job = Arc::clone(&state.import_job);
    job.begin(events.len())?;

    tauri::async_runtime::spawn(async move {
        let finished = tauri::async_runtime::spawn_blocking({
            let job = Arc::clone(&job);
            move || import_detected_events(&db, events, Some(job.as_ref()))
        })
        .await;

        match finished {
            Ok(Ok(result)) => job.finish(result),
            Ok(Err(error)) => job.finish(ImportResult {
                imported_count: 0,
                skipped_count: 0,
                errors: vec![error.to_string()],
                event_ids: vec![],
                cancelled: false,
            }),
            Err(join_error) => job.finish(ImportResult {
                imported_count: 0,
                skipped_count: 0,
                errors: vec![format!("Import failed: {join_error}")],
                event_ids: vec![],
                cancelled: false,
            }),
        }
    });

    Ok(())
}

#[tauri::command]
fn cancel_import(state: tauri::State<'_, AppState>) -> Result<(), error::AppError> {
    if !state.import_job.is_running() {
        return Err(error::AppError::Message(
            "No import is currently running.".into(),
        ));
    }
    state.import_job.request_cancel();
    Ok(())
}

#[tauri::command]
fn get_import_status(state: tauri::State<'_, AppState>) -> Result<ImportJobStatus, error::AppError> {
    Ok(state.import_job.snapshot())
}

#[tauri::command]
fn set_library_location(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<String, error::AppError> {
    let resolved = set_library_location_cmd(&state.db, path, state.import_job.is_running())?;
    let path_buf = std::path::PathBuf::from(&resolved);
    app.asset_protocol_scope()
        .allow_directory(&path_buf, true)
        .map_err(|err| error::AppError::Message(err.to_string()))?;
    Ok(resolved)
}

#[tauri::command]
fn get_cases(state: tauri::State<'_, AppState>) -> Result<Vec<CaseSummary>, error::AppError> {
    list_cases(&state.db)
}

#[tauri::command]
fn get_case_detail(
    state: tauri::State<'_, AppState>,
    case_id: String,
) -> Result<CaseDetail, error::AppError> {
    get_case(&state.db, &case_id)
}

#[tauri::command]
fn create_incident_case(
    state: tauri::State<'_, AppState>,
    title: String,
    description: String,
) -> Result<CaseSummary, error::AppError> {
    create_case(&state.db, &title, &description)
}

#[tauri::command]
fn update_incident_case(
    state: tauri::State<'_, AppState>,
    case_id: String,
    title: String,
    description: String,
) -> Result<(), error::AppError> {
    update_case(&state.db, &case_id, &title, &description)
}

#[tauri::command]
fn delete_incident_case(
    state: tauri::State<'_, AppState>,
    case_id: String,
) -> Result<(), error::AppError> {
    delete_case(&state.db, &case_id)
}

#[tauri::command]
fn add_events_to_incident_case(
    state: tauri::State<'_, AppState>,
    case_id: String,
    event_ids: Vec<String>,
) -> Result<u32, error::AppError> {
    add_events_to_case(&state.db, &case_id, &event_ids)
}

#[tauri::command]
fn remove_event_from_incident_case(
    state: tauri::State<'_, AppState>,
    case_id: String,
    event_id: String,
) -> Result<(), error::AppError> {
    remove_event_from_case(&state.db, &case_id, &event_id)
}

#[tauri::command]
async fn ensure_clip_thumbnail(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    clip_id: String,
) -> Result<String, error::AppError> {
    let db = Arc::clone(&state.db);

    tauri::async_runtime::spawn_blocking(move || ensure_clip_thumbnail_path(&app, &db, &clip_id))
        .await
        .map_err(|error| {
            error::AppError::Message(format!("Thumbnail generation failed: {error}"))
        })?
}

#[tauri::command]
async fn get_clip_thumbnail_data(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    clip_id: String,
) -> Result<String, error::AppError> {
    let db = Arc::clone(&state.db);

    tauri::async_runtime::spawn_blocking(move || get_clip_thumbnail_data_inner(&app, &db, &clip_id))
        .await
        .map_err(|error| error::AppError::Message(format!("Thumbnail read failed: {error}")))?
}

#[tauri::command]
fn get_events(
    state: tauri::State<'_, AppState>,
    filters: EventFilters,
) -> Result<Vec<DashEvent>, error::AppError> {
    list_events(&state.db, filters)
}

#[tauri::command]
fn update_event(
    state: tauri::State<'_, AppState>,
    event_id: String,
    note: Option<String>,
    tags: Option<Vec<String>>,
    source: Option<String>,
) -> Result<(), error::AppError> {
    if let Some(note) = note {
        update_event_note(&state.db, &event_id, &note)?;
    }
    if let Some(tags) = tags {
        set_event_tags(&state.db, &event_id, tags)?;
    }
    if let Some(source) = source {
        set_event_source(&state.db, &event_id, &source)?;
    }
    Ok(())
}

#[tauri::command]
fn delete_event(
    state: tauri::State<'_, AppState>,
    event_id: String,
) -> Result<(), error::AppError> {
    delete_event_record(&state.db, &event_id)
}

#[tauri::command]
fn bulk_delete_events(
    state: tauri::State<'_, AppState>,
    event_ids: Vec<String>,
) -> Result<BulkDeleteResult, error::AppError> {
    bulk_delete_event_records(&state.db, &event_ids)
}

#[tauri::command]
fn set_event_archive(
    state: tauri::State<'_, AppState>,
    event_id: String,
    archived: bool,
) -> Result<(), error::AppError> {
    set_event_archived(&state.db, &event_id, archived)
}

#[tauri::command]
fn bulk_archive_events(
    state: tauri::State<'_, AppState>,
    event_ids: Vec<String>,
    archived: bool,
) -> Result<BulkArchiveResult, error::AppError> {
    bulk_set_event_archive(&state.db, &event_ids, archived)
}

#[tauri::command]
fn bulk_toggle_tags(
    state: tauri::State<'_, AppState>,
    event_ids: Vec<String>,
    tag_name: String,
) -> Result<BulkTagResult, error::AppError> {
    bulk_toggle_event_tag(&state.db, &event_ids, &tag_name)
}

#[tauri::command]
fn get_path_byte_size(path: String) -> Result<u64, error::AppError> {
    let path = std::path::Path::new(&path);
    if !path.is_file() {
        return Ok(0);
    }

    Ok(std::fs::metadata(path).map(|meta| meta.len()).unwrap_or(0))
}

#[tauri::command]
async fn export_event_grid_video(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    event_id: String,
    dest_path: String,
    start_secs: Option<f64>,
    duration_secs: Option<f64>,
    quality: Option<String>,
) -> Result<String, error::AppError> {
    let event = load_event_by_id(&state.db, &event_id)?;
    let clips = event.clips;
    let app = app.clone();
    let export_lock = Arc::clone(&state.grid_export_lock);
    let active_ffmpeg = Arc::clone(&state.active_ffmpeg);

    tauri::async_runtime::spawn_blocking(move || {
        let _export_guard = export_lock.lock().map_err(|_| {
            error::AppError::Message(
                "Grid export lock was poisoned. Restart the app and try again.".to_string(),
            )
        })?;

        grid_video::export_grid_video(
            &app,
            &clips,
            std::path::Path::new(&dest_path),
            &active_ffmpeg,
            start_secs,
            duration_secs,
            quality.as_deref(),
        )
    })
    .await
    .map_err(|error| error::AppError::Message(format!("Grid export failed: {error}")))?
}

#[tauri::command]
async fn export_event(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    event_id: String,
    dest_path: String,
    start_secs: Option<f64>,
    duration_secs: Option<f64>,
) -> Result<String, error::AppError> {
    match (start_secs, duration_secs) {
        (None, None) => export_event_zip(&state.db, &event_id, std::path::Path::new(&dest_path)),
        (Some(start), Some(duration)) => {
            let event = load_event_by_id(&state.db, &event_id)?;
            let dest = dest_path;
            let app = app.clone();

            tauri::async_runtime::spawn_blocking(move || {
                export_event_zip_segment(&app, &event, std::path::Path::new(&dest), start, duration)
            })
            .await
            .map_err(|error| error::AppError::Message(format!("ZIP export failed: {error}")))?
        }
        _ => Err(error::AppError::Message(
            "ZIP export segment requires both start and duration.".to_string(),
        )),
    }
}

#[tauri::command]
fn bulk_export_events(
    state: tauri::State<'_, AppState>,
    event_ids: Vec<String>,
    dest_path: String,
) -> Result<BulkExportResult, error::AppError> {
    bulk_export_events_zip(&state.db, &event_ids, std::path::Path::new(&dest_path))
}

#[tauri::command]
fn open_event_folder(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
    event_id: String,
) -> Result<(), error::AppError> {
    open_event_folder_path(&state.db, &app, &event_id)
}

#[tauri::command]
fn open_library_folder(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), error::AppError> {
    open_library_folder_path(&state.db, &app)
}

#[tauri::command]
fn open_data_folder(app: tauri::AppHandle) -> Result<(), error::AppError> {
    open_data_folder_path(&app)
}

#[tauri::command]
fn get_all_tags(state: tauri::State<'_, AppState>) -> Result<Vec<TagInfo>, error::AppError> {
    list_tags(&state.db)
}

#[tauri::command]
fn get_app_settings(state: tauri::State<'_, AppState>) -> Result<AppSettings, error::AppError> {
    get_settings(&state.db)
}

#[tauri::command]
fn set_notify_teslacam_drive_setting(
    state: tauri::State<'_, AppState>,
    enabled: bool,
) -> Result<(), error::AppError> {
    write_notify_teslacam_drive(&state.db, enabled)
}

#[tauri::command]
fn dismiss_teslacam_drive_session(
    state: tauri::State<'_, AppState>,
    volume_id: String,
) -> Result<(), error::AppError> {
    dismiss_teslacam_drive(&state.drive_detect, volume_id);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .setup(|app| {
            let _ = crate::tesla::ffmpeg::ensure_ffmpeg_cached(app.handle());

            if let Some(state) = app.try_state::<AppState>() {
                let library_root = state.db.library_root();
                let _ = app
                    .asset_protocol_scope()
                    .allow_directory(&library_root, true);
            }

            if let Some(window) = app.get_webview_window("main") {
                if let Some(icon) = app.default_window_icon() {
                    let _ = window.set_icon(icon.clone());
                }
                let _ = window.center();
                let _ = window.show();
                let _ = window.set_focus();
            }

            if let Some(state) = app.try_state::<AppState>() {
                state
                    .drive_detect
                    .start_watch(app.handle().clone(), Arc::clone(&state.db));
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_import_paths,
            start_import_tesla_events,
            cancel_import,
            get_import_status,
            set_library_location,
            get_cases,
            get_case_detail,
            create_incident_case,
            update_incident_case,
            delete_incident_case,
            add_events_to_incident_case,
            remove_event_from_incident_case,
            get_events,
            ensure_clip_thumbnail,
            get_clip_thumbnail_data,
            update_event,
            delete_event,
            bulk_delete_events,
            set_event_archive,
            bulk_archive_events,
            bulk_toggle_tags,
            export_event,
            export_event_grid_video,
            bulk_export_events,
            open_event_folder,
            open_library_folder,
            open_data_folder,
            get_path_byte_size,
            get_all_tags,
            get_app_settings,
            set_notify_teslacam_drive_setting,
            dismiss_teslacam_drive_session,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                if let Some(state) = app_handle.try_state::<AppState>() {
                    state.stop_active_ffmpeg();
                    state.drive_detect.stop_watch();
                }
            }
            _ => {}
        });
}
