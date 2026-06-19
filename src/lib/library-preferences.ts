export type LibrarySort = "newest" | "oldest" | "most-cameras" | "recently-updated";

export type LibraryDateRange = "all" | "today" | "7d" | "30d" | "month";

export type LibraryListWidth = "compact" | "default" | "wide";

export type LibraryMinCameras = "any" | "2" | "4" | "6";

export type PlaybackLayout = "single" | "grid";

export type SeekStepSecs = 5 | 10 | 30;

export type ExportSegmentSecs = 15 | 30 | 60 | 90;

export const SEEK_STEP_OPTIONS: SeekStepSecs[] = [5, 10, 30];

export const EXPORT_SEGMENT_OPTIONS: ExportSegmentSecs[] = [15, 30, 60, 90];

export type LibraryPreferences = {
  sort: LibrarySort;
  dateRange: LibraryDateRange;
  minCameras: LibraryMinCameras;
  showNotesInList: boolean;
  listWidth: LibraryListWidth;
  playbackLayout: PlaybackLayout;
  detailInspectorOpen: boolean;
  libraryListOpen: boolean;
  seekStepSecs: SeekStepSecs;
  exportSegmentSecs: ExportSegmentSecs;
};

const STORAGE_KEY = "Reelattice-library-preferences";

type LibraryPreferencesListener = () => void;
const preferenceListeners = new Set<LibraryPreferencesListener>();

export const subscribeLibraryPreferences = (listener: LibraryPreferencesListener) => {
  preferenceListeners.add(listener);
  return () => {
    preferenceListeners.delete(listener);
  };
};

const notifyLibraryPreferencesChanged = () => {
  preferenceListeners.forEach((listener) => listener());
};

export const DEFAULT_LIBRARY_PREFERENCES: LibraryPreferences = {
  sort: "newest",
  dateRange: "all",
  minCameras: "any",
  showNotesInList: false,
  listWidth: "default",
  playbackLayout: "single",
  detailInspectorOpen: false,
  libraryListOpen: true,
  seekStepSecs: 5,
  exportSegmentSecs: 30,
};

const isSeekStepSecs = (value: unknown): value is SeekStepSecs =>
  value === 5 || value === 10 || value === 30;

const isExportSegmentSecs = (value: unknown): value is ExportSegmentSecs =>
  value === 15 || value === 30 || value === 60 || value === 90;

export const loadLibraryPreferences = (): LibraryPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LIBRARY_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<LibraryPreferences>;
    return {
      ...DEFAULT_LIBRARY_PREFERENCES,
      ...parsed,
      seekStepSecs: isSeekStepSecs(parsed.seekStepSecs)
        ? parsed.seekStepSecs
        : DEFAULT_LIBRARY_PREFERENCES.seekStepSecs,
      exportSegmentSecs: isExportSegmentSecs(parsed.exportSegmentSecs)
        ? parsed.exportSegmentSecs
        : DEFAULT_LIBRARY_PREFERENCES.exportSegmentSecs,
    };
  } catch {
    return DEFAULT_LIBRARY_PREFERENCES;
  }
};

export const saveLibraryPreferences = (preferences: LibraryPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  notifyLibraryPreferencesChanged();
};

export const resetLibraryPreferences = () => {
  localStorage.removeItem(STORAGE_KEY);
  notifyLibraryPreferencesChanged();
};

export const LIST_PANEL_WIDTH_CLASSES: Record<LibraryListWidth, string> = {
  compact: "w-full lg:w-72",
  default: "w-full lg:w-[340px]",
  wide: "w-full lg:w-[420px]",
};

/** Fixed width for list content so rows do not reflow when the panel is clipped shut. */
export const LIST_PANEL_INNER_WIDTH_CLASSES: Record<LibraryListWidth, string> = {
  compact: "w-72 max-lg:w-screen",
  default: "w-[340px] max-lg:w-screen",
  wide: "w-[420px] max-lg:w-screen",
};

const SORT_LABELS: Record<LibrarySort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "most-cameras": "Most cameras",
  "recently-updated": "Recently updated",
};

const DATE_RANGE_LABELS: Record<LibraryDateRange, string> = {
  all: "All time",
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
};

const MIN_CAMERAS_LABELS: Record<LibraryMinCameras, string> = {
  any: "Any",
  "2": "2+ cameras",
  "4": "4+ cameras",
  "6": "6 cameras",
};

const LIST_WIDTH_LABELS: Record<LibraryListWidth, string> = {
  compact: "Compact",
  default: "Default",
  wide: "Wide",
};

const PLAYBACK_LAYOUT_LABELS: Record<PlaybackLayout, string> = {
  single: "Single camera",
  grid: "Grid (all cameras)",
};

const SEEK_STEP_LABELS: Record<SeekStepSecs, string> = {
  5: "5 seconds",
  10: "10 seconds",
  30: "30 seconds",
};

const EXPORT_SEGMENT_LABELS: Record<ExportSegmentSecs, string> = {
  15: "15 seconds",
  30: "30 seconds",
  60: "60 seconds",
  90: "90 seconds",
};

export type LibraryPreferenceRow = {
  label: string;
  value: string;
};

export const describeLibraryPreferences = (
  preferences: LibraryPreferences,
): LibraryPreferenceRow[] => [
  { label: "Sort", value: SORT_LABELS[preferences.sort] },
  { label: "Date range", value: DATE_RANGE_LABELS[preferences.dateRange] },
  { label: "Min cameras", value: MIN_CAMERAS_LABELS[preferences.minCameras] },
  { label: "List width", value: LIST_WIDTH_LABELS[preferences.listWidth] },
  { label: "Playback", value: PLAYBACK_LAYOUT_LABELS[preferences.playbackLayout] },
  { label: "Seek step", value: SEEK_STEP_LABELS[preferences.seekStepSecs] },
  {
    label: "Export segment",
    value: EXPORT_SEGMENT_LABELS[preferences.exportSegmentSecs],
  },
  {
    label: "Notes in list",
    value: preferences.showNotesInList ? "Shown" : "Hidden",
  },
  {
    label: "Library panel",
    value: preferences.libraryListOpen ? "Expanded" : "Collapsed",
  },
  {
    label: "Details panel",
    value: preferences.detailInspectorOpen ? "Expanded" : "Collapsed",
  },
];
