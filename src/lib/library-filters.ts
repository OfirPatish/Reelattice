import {
  endOfDay,
  isAfter,
  isBefore,
  isToday,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { formatEventTime, parseEventWallTime } from "@/lib/format";
import type {
  LibraryDateRange,
  LibraryMinCameras,
  LibraryPreferences,
  LibrarySort,
} from "@/lib/library-preferences";
import type { DashEvent } from "@/lib/types";

export type LibraryView = "active" | "archived";

export const LIBRARY_VIEW_OPTIONS: { value: LibraryView; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "sentry", label: "Sentry" },
  { value: "saved", label: "Saved" },
  { value: "recent", label: "Recent" },
] as const;

export const SOURCE_PILL_OPTIONS = [
  { value: undefined as string | undefined, label: "All" },
  { value: "sentry", label: "Sentry" },
  { value: "saved", label: "Saved" },
  { value: "recent", label: "Recent" },
] as const;

export const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "most-cameras", label: "Most cameras" },
  { value: "recently-updated", label: "Recently updated" },
];

export const DATE_RANGE_OPTIONS: { value: LibraryDateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
];

export const MIN_CAMERAS_OPTIONS: { value: LibraryMinCameras; label: string }[] = [
  { value: "any", label: "Any cameras" },
  { value: "2", label: "2+ cameras" },
  { value: "4", label: "4+ cameras" },
  { value: "6", label: "6 cameras" },
];

export const LIST_WIDTH_OPTIONS: { value: LibraryPreferences["listWidth"]; label: string }[] = [
  { value: "compact", label: "Compact list" },
  { value: "default", label: "Default list" },
  { value: "wide", label: "Wide list" },
];

const matchesDateRange = (eventTime: string, range: LibraryDateRange) => {
  if (range === "all") return true;

  const eventDate = parseEventWallTime(eventTime);
  const now = new Date();

  switch (range) {
    case "today":
      return isToday(eventDate);
    case "7d":
      return isAfter(eventDate, startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
    case "30d":
      return isAfter(eventDate, startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)));
    case "month":
      return (
        !isBefore(eventDate, startOfMonth(now)) && !isAfter(eventDate, endOfDay(now))
      );
    default:
      return true;
  }
};

const matchesMinCameras = (clipCount: number, minCameras: LibraryMinCameras) => {
  if (minCameras === "any") return true;
  return clipCount >= Number(minCameras);
};

const sortEvents = (events: DashEvent[], sort: LibrarySort) => {
  const sorted = [...events];

  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
    case "most-cameras":
      return sorted.sort(
        (a, b) =>
          b.clips.length - a.clips.length || b.eventTime.localeCompare(a.eventTime),
      );
    case "recently-updated":
      return sorted.sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.eventTime.localeCompare(a.eventTime),
      );
    default:
      return sorted.sort((a, b) => b.eventTime.localeCompare(a.eventTime));
  }
};

export const hasExtendedFilters = (preferences: LibraryPreferences, tag?: string) =>
  Boolean(tag) ||
  preferences.dateRange !== "all" ||
  preferences.minCameras !== "any" ||
  preferences.showNotesInList ||
  preferences.listWidth !== "default" ||
  preferences.sort !== "newest";

export const filterAndSortEvents = (
  events: DashEvent[],
  search: string,
  source?: string,
  tag?: string,
  dateRange: LibraryDateRange = "all",
  minCameras: LibraryMinCameras = "any",
  sort: LibrarySort = "newest",
) => {
  let result = events;

  if (source) {
    result = result.filter((event) => event.source === source);
  }

  if (tag) {
    result = result.filter((event) => event.tags.includes(tag));
  }

  result = result.filter(
    (event) =>
      matchesDateRange(event.eventTime, dateRange) &&
      matchesMinCameras(event.clips.length, minCameras),
  );

  const lower = search.trim().toLowerCase();
  if (lower) {
    result = result.filter(
      (event) =>
        event.note.toLowerCase().includes(lower) ||
        event.tags.some((entry) => entry.toLowerCase().includes(lower)) ||
        event.source.toLowerCase().includes(lower) ||
        formatEventTime(event.eventTime).toLowerCase().includes(lower),
    );
  }

  return sortEvents(result, sort);
};
