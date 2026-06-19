import type { DetectedEvent, EventSource } from "@/lib/types";

export const IMPORT_SOURCE_OPTIONS: EventSource[] = ["recent", "sentry", "saved"];

export const DEFAULT_LOOSE_IMPORT_SOURCE: EventSource = "recent";

export const hasUnrecognizedImportSource = (events: DetectedEvent[]) =>
  events.some((event) => !event.sourceInferred);

export const applyImportSources = (
  events: DetectedEvent[],
  overrides: Partial<Record<string, EventSource>>,
  fallbackSource: EventSource = DEFAULT_LOOSE_IMPORT_SOURCE,
): DetectedEvent[] =>
  events.map((event) =>
    event.sourceInferred
      ? event
      : {
          ...event,
          source: overrides[event.folderPath] ?? fallbackSource,
        },
  );

export const syncUnrecognizedSourceOverrides = (
  events: DetectedEvent[],
  prev: Record<string, EventSource>,
): Record<string, EventSource> => {
  const next: Record<string, EventSource> = {};

  for (const event of events) {
    if (!event.sourceInferred) {
      next[event.folderPath] = prev[event.folderPath] ?? DEFAULT_LOOSE_IMPORT_SOURCE;
    }
  }

  return next;
};

export const applyBulkUnrecognizedSource = (
  events: DetectedEvent[],
  prev: Record<string, EventSource>,
  source: EventSource,
): Record<string, EventSource> => {
  const next = { ...prev };

  for (const event of events) {
    if (!event.sourceInferred) {
      next[event.folderPath] = source;
    }
  }

  return next;
};

/** When every unrecognized event shares one source, returns it; otherwise undefined. */
export const getSharedUnrecognizedSource = (
  events: DetectedEvent[],
  overrides: Record<string, EventSource>,
): EventSource | undefined => {
  const unrecognized = events.filter((event) => !event.sourceInferred);
  if (unrecognized.length === 0) return undefined;

  const first =
    overrides[unrecognized[0].folderPath] ?? DEFAULT_LOOSE_IMPORT_SOURCE;
  const allSame = unrecognized.every(
    (event) => (overrides[event.folderPath] ?? DEFAULT_LOOSE_IMPORT_SOURCE) === first,
  );

  return allSame ? first : undefined;
};

export const getUnrecognizedSource = (
  event: DetectedEvent,
  overrides: Record<string, EventSource>,
): EventSource => overrides[event.folderPath] ?? DEFAULT_LOOSE_IMPORT_SOURCE;
