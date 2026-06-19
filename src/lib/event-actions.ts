import { confirm, save } from "@tauri-apps/plugin-dialog";
import { deleteEvent, exportEvent, exportEventGridVideo, setEventArchive } from "@/lib/api";
import type { GridExportOptions } from "@/lib/api";
import {
  EXPORT_SEGMENT_WINDOW_SECS,
  segmentFileSuffix,
  type ExportSegment,
} from "@/lib/playback-metrics";
import type { DashEvent } from "@/lib/types";

const eventSlug = (eventTime: string) => eventTime.replace(/[: ]/g, "-");

export const exportZipFileName = (eventTime: string, segment?: ExportSegment | null) => {
  const slug = eventSlug(eventTime);
  if (!segment) return `Reelattice-${slug}.zip`;
  return `Reelattice-${slug}-${segmentFileSuffix(segment)}.zip`;
};

export const exportGridVideoFileName = (eventTime: string, segment?: ExportSegment | null) => {
  const slug = eventSlug(eventTime);
  if (!segment) return `Reelattice-${slug}-grid.mp4`;
  return `Reelattice-${slug}-grid-${segmentFileSuffix(segment)}.mp4`;
};

export const segmentToExportOptions = (segment: ExportSegment): GridExportOptions => ({
  startSecs: segment.startSecs,
  durationSecs: segment.durationSecs,
});

export const runExportEvent = async (
  event: DashEvent,
  segment?: ExportSegment | null,
): Promise<boolean> => {
  const destPath = await save({
    defaultPath: exportZipFileName(event.eventTime, segment),
    filters: [{ name: "ZIP archive", extensions: ["zip"] }],
  });

  if (!destPath) return false;

  await exportEvent(event.id, destPath, segment ?? undefined);
  return true;
};

export const pickGridExportPath = async (
  event: DashEvent,
  segment?: ExportSegment | null,
): Promise<string | null> => {
  if (event.clips.length < 2) {
    throw new Error("Grid video export requires at least two camera angles.");
  }

  const destPath = await save({
    defaultPath: exportGridVideoFileName(event.eventTime, segment),
    filters: [{ name: "MP4 video", extensions: ["mp4"] }],
  });

  return destPath;
};

export const exportGridVideoToPath = async (
  eventId: string,
  destPath: string,
  segment?: ExportSegment | null,
): Promise<string> =>
  exportEventGridVideo(
    eventId,
    destPath,
    segment ? segmentToExportOptions(segment) : undefined,
  );

export const runToggleArchiveEvent = async (event: DashEvent): Promise<boolean> => {
  const nextArchived = !event.archived;

  if (nextArchived) {
    const confirmed = await confirm(
      "Archive hides this event from your active library. You can restore it anytime from Archived.",
      { title: "Archive event", kind: "info", okLabel: "Archive" },
    );
    if (!confirmed) return false;
  }

  await setEventArchive(event.id, nextArchived);
  return true;
};

export const runDeleteEvent = async (event: DashEvent): Promise<boolean> => {
  const confirmed = await confirm(
    "This permanently removes the event and all copied video files from your library. You can import the footage again later.",
    { title: "Delete event", kind: "warning", okLabel: "Delete" },
  );

  if (!confirmed) return false;

  await deleteEvent(event.id);
  return true;
};

export { EXPORT_SEGMENT_WINDOW_SECS };
