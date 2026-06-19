import {
  Archive,
  ArchiveRestore,
  Download,
  FolderOpen,
  Grid2x2,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  InlineActionLabel,
  useInlineActionLabel,
} from "@/components/ui/inline-action-label";
import { openEventFolder } from "@/lib/api";
import {
  exportGridVideoToPath,
  pickGridExportPath,
  runDeleteEvent,
  runExportEvent,
  runToggleArchiveEvent,
} from "@/lib/event-actions";
import type { ExportSegment } from "@/lib/playback-metrics";
import { segmentExportLabel } from "@/lib/playback-metrics";
import type { DashEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventHeaderActionsProps = {
  event: DashEvent;
  exportSegment?: ExportSegment | null;
  onLibraryChange: () => void;
  onDeleted: () => void;
  onError: (message: string) => void;
  onExportingChange?: (exporting: boolean, destPath?: string) => void;
  onExportSuccess?: (destPath: string) => void;
};

type HeaderAction = "folder" | "export" | "grid-export" | "archive" | "delete";

export const EventHeaderActions = ({
  event,
  exportSegment = null,
  onLibraryChange,
  onDeleted,
  onError,
  onExportingChange,
  onExportSuccess,
}: EventHeaderActionsProps) => {
  const [busyAction, setBusyAction] = useState<HeaderAction | null>(null);
  const { hoveredLabel, hoverProps, clearHover, handleBlur } = useInlineActionLabel();
  const isBusy = Boolean(busyAction);
  const canExportGrid = event.clips.length >= 2;
  const segmentLabel = exportSegment ? segmentExportLabel(exportSegment) : null;
  const zipHoverLabel = segmentLabel ? `Export ZIP (${segmentLabel})` : "Export ZIP";
  const gridHoverLabel = canExportGrid
    ? segmentLabel
      ? `Export grid MP4 (${segmentLabel})`
      : "Export grid MP4"
    : "Needs 2+ cameras";

  const handleGridExport = async () => {
    if (busyAction) return;

    setBusyAction("grid-export");
    onError("");

    try {
      const destPath = await pickGridExportPath(event, exportSegment);
      if (!destPath) return;

      onExportingChange?.(true, destPath);

      await exportGridVideoToPath(event.id, destPath, exportSegment);
      onExportSuccess?.(destPath);
    } catch (err) {
      onError(String(err));
    } finally {
      onExportingChange?.(false);
      setBusyAction(null);
    }
  };

  const runAction = async (
    action: HeaderAction,
    handler: () => Promise<boolean>,
    onSuccess: () => void,
  ) => {
    if (busyAction) return;

    setBusyAction(action);
    onError("");

    try {
      const completed = await handler();
      if (completed) onSuccess();
    } catch (err) {
      onError(String(err));
    } finally {
      setBusyAction(null);
    }
  };

  const actionButtonClass = (tone: "folder" | "export" | "grid" | "archive" | "restore" | "delete") =>
    cn(
      "flex h-7 w-7 items-center justify-center rounded-md transition",
      "focus:outline-none focus-visible:outline-none",
      "disabled:opacity-40",
      tone === "folder" && "text-sky-400 hover:bg-sky-500/15 hover:text-sky-300",
      tone === "export" && "text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300",
      tone === "grid" && "text-violet-400 hover:bg-violet-500/15 hover:text-violet-300",
      tone === "archive" && "text-amber-400 hover:bg-amber-500/15 hover:text-amber-300",
      tone === "restore" && "text-teal-400 hover:bg-teal-500/15 hover:text-teal-300",
      tone === "delete" && "text-rose-400 hover:bg-rose-500/15 hover:text-rose-300",
    );

  return (
    <div
      className="flex shrink-0 items-center"
      onMouseLeave={clearHover}
      onBlur={handleBlur}
    >
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-lg bg-zinc-900/90 p-0.5 ring-1 ring-zinc-800/60 backdrop-blur-sm",
          exportSegment && "ring-fuchsia-500/30",
        )}
      >
        <button
          type="button"
          disabled={isBusy}
          aria-label="Show event folder in file explorer"
          className={actionButtonClass("folder")}
          {...hoverProps("Open in Explorer")}
          onClick={() =>
            void runAction(
              "folder",
              async () => {
                await openEventFolder(event.id);
                return true;
              },
              () => undefined,
            )
          }
        >
          {busyAction === "folder" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <FolderOpen className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          className={actionButtonClass("export")}
          {...hoverProps(zipHoverLabel)}
          onClick={() =>
            void runAction(
              "export",
              () => runExportEvent(event, exportSegment),
              () => undefined,
            )
          }
        >
          {busyAction === "export" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy || !canExportGrid}
          className={actionButtonClass("grid")}
          {...hoverProps(gridHoverLabel)}
          onClick={() => void handleGridExport()}
        >
          {busyAction === "grid-export" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Grid2x2 className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          className={actionButtonClass(event.archived ? "restore" : "archive")}
          {...hoverProps(event.archived ? "Restore" : "Archive")}
          onClick={() =>
            void runAction(
              "archive",
              () => runToggleArchiveEvent(event),
              onLibraryChange,
            )
          }
        >
          {busyAction === "archive" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : event.archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Archive className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          aria-label="Delete event"
          className={actionButtonClass("delete")}
          {...hoverProps("Delete")}
          onClick={() =>
            void runAction("delete", () => runDeleteEvent(event), onDeleted)
          }
        >
          {busyAction === "delete" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>

      <InlineActionLabel label={hoveredLabel} className="ml-2" />
    </div>
  );
};
