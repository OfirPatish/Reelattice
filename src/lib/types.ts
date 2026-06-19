export type EventSource = "recent" | "sentry" | "saved";

export type CameraAngle =
  | "front"
  | "back"
  | "left_repeater"
  | "right_repeater"
  | "left_pillar"
  | "right_pillar";

export type Clip = {
  id: string;
  eventId: string;
  camera: CameraAngle | string;
  filePath: string;
  durationMs?: number;
  thumbnailPath?: string;
  fileSize?: number;
};

export type DashEvent = {
  id: string;
  eventTime: string;
  source: EventSource;
  note: string;
  archived: boolean;
  tags: string[];
  clips: Clip[];
  createdAt: string;
  updatedAt: string;
};

export type DetectedClip = {
  camera: string;
  filePath: string;
  fileSize: number;
};

export type DetectedEvent = {
  folderPath: string;
  eventTime: string;
  source: EventSource;
  sourceInferred: boolean;
  clips: DetectedClip[];
  alreadyImported: boolean;
};

export type ScanImportResult = {
  events: DetectedEvent[];
  encryptedClipsFound: number;
  encryptedFolderDetected: boolean;
};

export type ImportResult = {
  importedCount: number;
  skippedCount: number;
  errors: string[];
  eventIds: string[];
};

export type EventFilters = {
  query?: string;
  tag?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  archived?: "active" | "archived";
};

export type TagInfo = {
  id: string;
  name: string;
  isBuiltin: boolean;
};

export type LibraryStats = {
  eventCount: number;
  archivedCount: number;
  clipCount: number;
  tagCount: number;
  libraryBytes: number;
  dbBytes: number;
  sentryCount: number;
  recentCount: number;
  savedCount: number;
};

export type AppSettings = {
  libraryPath: string;
  dbPath: string;
  version: string;
  stats: LibraryStats;
};

export type AppView = "library" | "import" | "settings" | "help";
