import { invoke } from "@tauri-apps/api/core";
import type {
  AppSettings,
  CaseDetail,
  CaseSummary,
  DashEvent,
  DetectedEvent,
  EventFilters,
  EventSource,
  ImportJobStatus,
  ImportResult,
  ScanImportResult,
  TagInfo,
} from "./types";

export const scanImportPaths = (paths: string[]) =>
  invoke<ScanImportResult>("scan_import_paths", { paths });

export const startImportTeslaEvents = (events: DetectedEvent[]) =>
  invoke<void>("start_import_tesla_events", { events });

export const cancelImport = () => invoke<void>("cancel_import");

export const getImportStatus = () => invoke<ImportJobStatus>("get_import_status");

export const waitForImportCompletion = async (
  onProgress?: (status: ImportJobStatus) => void,
): Promise<ImportResult> => {
  const poll = async (): Promise<ImportResult> => {
    const status = await getImportStatus();
    onProgress?.(status);

    if (status.running) {
      await new Promise((resolve) => window.setTimeout(resolve, 200));
      return poll();
    }

    return {
      importedCount: status.importedCount,
      skippedCount: status.skippedCount,
      errors: status.errors,
      eventIds: status.eventIds,
      cancelled: status.cancelled,
    };
  };

  return poll();
};

export const setLibraryLocation = (path: string) =>
  invoke<string>("set_library_location", { path });

export const getCases = () => invoke<CaseSummary[]>("get_cases");

export const getCaseDetail = (caseId: string) =>
  invoke<CaseDetail>("get_case_detail", { caseId });

export const createIncidentCase = (title: string, description = "") =>
  invoke<CaseSummary>("create_incident_case", { title, description });

export const updateIncidentCase = (caseId: string, title: string, description: string) =>
  invoke<void>("update_incident_case", { caseId, title, description });

export const deleteIncidentCase = (caseId: string) =>
  invoke<void>("delete_incident_case", { caseId });

export const addEventsToIncidentCase = (caseId: string, eventIds: string[]) =>
  invoke<number>("add_events_to_incident_case", { caseId, eventIds });

export const removeEventFromIncidentCase = (caseId: string, eventId: string) =>
  invoke<void>("remove_event_from_incident_case", { caseId, eventId });

export const getEvents = (filters: EventFilters = {}) =>
  invoke<DashEvent[]>("get_events", { filters });

export const updateEvent = (params: {
  eventId: string;
  note?: string;
  tags?: string[];
  source?: EventSource;
}) => invoke<void>("update_event", params);

export const deleteEvent = (eventId: string) =>
  invoke<void>("delete_event", { eventId });

export const bulkDeleteEvents = (eventIds: string[]) =>
  invoke<{ deleted: number; failed: string[] }>("bulk_delete_events", { eventIds });

export const setEventArchive = (eventId: string, archived: boolean) =>
  invoke<void>("set_event_archive", { eventId, archived });

export const bulkArchiveEvents = (eventIds: string[], archived: boolean) =>
  invoke<{ updated: number; failed: string[] }>("bulk_archive_events", {
    eventIds,
    archived,
  });

export const bulkToggleTags = (eventIds: string[], tagName: string) =>
  invoke<{ updated: number; failed: string[] }>("bulk_toggle_tags", {
    eventIds,
    tagName,
  });

export type ExportSegmentOptions = {
  startSecs: number;
  durationSecs: number;
};

export const exportEvent = (
  eventId: string,
  destPath: string,
  segment?: ExportSegmentOptions,
) =>
  invoke<string>("export_event", {
    eventId,
    destPath,
    startSecs: segment?.startSecs ?? null,
    durationSecs: segment?.durationSecs ?? null,
  });

export type GridExportOptions = ExportSegmentOptions;

export const exportEventGridVideo = (
  eventId: string,
  destPath: string,
  options?: GridExportOptions,
) =>
  invoke<string>("export_event_grid_video", {
    eventId,
    destPath,
    startSecs: options?.startSecs ?? null,
    durationSecs: options?.durationSecs ?? null,
  });

export const bulkExportEvents = (eventIds: string[], destPath: string) =>
  invoke<{ exported: number; failed: string[] }>("bulk_export_events", {
    eventIds,
    destPath,
  });

export const getPathByteSize = (path: string) =>
  invoke<number>("get_path_byte_size", { path });

export const openEventFolder = (eventId: string) =>
  invoke<void>("open_event_folder", { eventId });

export const openLibraryFolder = () => invoke<void>("open_library_folder");

export const openDataFolder = () => invoke<void>("open_data_folder");

export const getAllTags = () => invoke<TagInfo[]>("get_all_tags");

export const getAppSettings = () => invoke<AppSettings>("get_app_settings");
