import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { EventSource } from "./types";

/** Tesla filenames use local wall-clock time — display without timezone conversion. */
export const parseEventWallTime = (iso: string): Date => {
  const match = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) {
    return parseISO(iso);
  }

  const [, year, month, day, hours, minutes, seconds = "0"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
  );
};

export const formatEventTime = (iso: string) => {
  try {
    return format(parseEventWallTime(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return iso;
  }
};

export const formatFileSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const sourceLabel = (source: EventSource | string) => {
  switch (source) {
    case "sentry":
      return "Sentry";
    case "saved":
      return "Saved";
    case "recent":
      return "Recent";
    default:
      return source;
  }
};

export const getSourceDotClass = (source: EventSource | string) => {
  switch (source) {
    case "sentry":
      return "bg-amber-400";
    case "saved":
      return "bg-emerald-400";
    case "recent":
      return "bg-sky-400";
    default:
      return "bg-zinc-500";
  }
};

export const sourceBadgeClass = (source: EventSource | string) => {
  switch (source) {
    case "sentry":
      return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
    case "saved":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "recent":
      return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30";
  }
};

export const sourceFilterPillClass = (
  source: EventSource | string | undefined,
  active: boolean,
) => {
  const key = source ?? "all";

  if (active) {
    if (key === "all") {
      return "bg-zinc-500/20 text-zinc-200 ring-1 ring-inset ring-zinc-500/40";
    }
    return `ring-1 ring-inset ${sourceBadgeClass(key)}`;
  }

  switch (key) {
    case "sentry":
      return "text-amber-400/60 ring-1 ring-inset ring-transparent hover:bg-amber-500/10 hover:text-amber-300/90";
    case "saved":
      return "text-emerald-400/60 ring-1 ring-inset ring-transparent hover:bg-emerald-500/10 hover:text-emerald-300/90";
    case "recent":
      return "text-sky-400/60 ring-1 ring-inset ring-transparent hover:bg-sky-500/10 hover:text-sky-300/90";
    default:
      return "text-zinc-500 ring-1 ring-inset ring-transparent hover:bg-zinc-800/80 hover:text-zinc-300";
  }
};

export const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const CAMERA_LABELS: Record<string, string> = {
  front: "Front",
  back: "Back",
  left_repeater: "Left Fender",
  right_repeater: "Right Fender",
  left_pillar: "Left Pillar",
  right_pillar: "Right Pillar",
};

export const cameraLabel = (camera: string) =>
  CAMERA_LABELS[camera] ??
  camera.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

export const CAMERA_ORDER = [
  "front",
  "back",
  "left_repeater",
  "right_repeater",
  "left_pillar",
  "right_pillar",
] as const;

export const formatDurationMs = (durationMs?: number) => {
  if (!durationMs || durationMs <= 0) return null;
  return formatDuration(durationMs / 1000);
};

export const formatRelativeTime = (iso: string) => {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return null;
  }
};

export const sumClipFileSize = (clips: Array<{ fileSize?: number }>) =>
  clips.reduce((total, clip) => total + (clip.fileSize ?? 0), 0);

export const sortClipsByCamera = <T extends { camera: string }>(clips: T[]): T[] =>
  [...clips].sort((a, b) => {
    const ai = CAMERA_ORDER.indexOf(a.camera as (typeof CAMERA_ORDER)[number]);
    const bi = CAMERA_ORDER.indexOf(b.camera as (typeof CAMERA_ORDER)[number]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
