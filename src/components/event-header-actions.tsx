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
import { GridExportQualityDialog } from "@/components/grid-export-quality-dialog";
import { useInlineActionLabel } from "@/components/ui/inline-action-label";
import { openEventFolder } from "@/lib/api";
import {
  exportGridVideoToPath,
  pickGridExportPath,
  runDeleteEvent,
  runExportEvent,
  runToggleArchiveEvent,
} from "@/lib/event-actions";
import type { GridExportQuality } from "@/lib/grid-export-quality";
import type { ExportSegment } from "@/lib/playback-metrics";
import { segmentExportLabel } from "@/lib/playback-metrics";
import type { DashEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventHeaderActionsProps = {
  event: DashEvent;
  exportSegment?: ExportSegment | null;
  gridExportQuality: GridExportQuality;
  onGridExportQualityChange: (quality: GridExportQuality) => void;
  onLibraryChange: () => void;
  onDeleted: () => void;
  onError: (message: string) => void;
  onExportingChange?: (exporting: boolean, destPath?: string, quality?: GridExportQuality) => void;
  onExportSuccess?: (destPath: string) => void;
};

type HeaderAction = "folder" | "export" | "grid-export" | "archive" | "delete";

export const EventHeaderActions = ({
  event,
  exportSegment = null,
  gridExportQuality,
  onGridExportQualityChange,
  onLibraryChange,
  onDeleted,
  onError,
  onExportingChange,
  onExportSuccess,
}: EventHeaderActionsProps) => {
  const [busyAction, setBusyAction] = useState<HeaderAction | null>(null);
  const [qualityDialogOpen, setQualityDialogOpen] = useState(false);
  const { hoveredLabel, hoverProps, clearHover, handleBlur } = useInlineActionLabel();
  const isBusy = Boolean(busyAction);
  const canExportGrid = event.clips.length >= 2;
  const segmentLabel = exportSegment ? segmentExportLabel(exportSegment) : null;
  const zipLabel = segmentLabel ? `Export ZIP (${segmentLabel})` : "Export ZIP";
  const gridLabel = canExportGrid
    ? segmentLabel
      ? `Export grid MP4 (${segmentLabel})`
      : "Export grid MP4"
    : "Grid export needs 2+ cameras";
  const archiveLabel = event.archived ? "Restore" : "Archive";

  const runGridExport = async (quality: GridExportQuality) => {
    setBusyAction("grid-export");
    onError("");

    try {
      const destPath = await pickGridExportPath(event, exportSegment);
      if (!destPath) return;

      onExportingChange?.(true, destPath, quality);
      await exportGridVideoToPath(event.id, destPath, exportSegment, quality);
      onExportSuccess?.(destPath);
    } catch (err) {
      onError(String(err));
    } finally {
      onExportingChange?.(false);
      setBusyAction(null);
    }
  };

  const handleQualityConfirm = (quality: GridExportQuality) => {
    setQualityDialogOpen(false);
    onGridExportQualityChange(quality);
    void runGridExport(quality);
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

  const actionButtonClass = (danger = false) =>
    cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200",
      "focus:outline-none focus-visible:outline-none disabled:opacity-40",
      danger && "hover:bg-rose-500/10 hover:text-rose-300",
    );

  return (
    <>
      <div
        className="relative flex items-center"
        onMouseLeave={clearHover}
        onBlur={handleBlur}
      >
        {hoveredLabel && (
          <span
            className="pointer-events-none absolute right-full mr-2 max-w-[12rem] truncate whitespace-nowrap text-right text-sm font-medium text-zinc-400"
            aria-live="polite"
          >
            {hoveredLabel}
          </span>
        )}

        <div
          className={cn(
            "flex items-center gap-0.5 rounded-lg p-0.5 ring-1 ring-inset ring-zinc-800",
            exportSegment && "ring-fuchsia-500/25",
          )}
        >
          <button
            type="button"
            disabled={isBusy}
            aria-label="Open in Explorer"
            className={actionButtonClass()}
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
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FolderOpen className="h-4 w-4" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          aria-label={zipLabel}
          className={actionButtonClass()}
          {...hoverProps(zipLabel)}
          onClick={() =>
            void runAction(
              "export",
              () => runExportEvent(event, exportSegment),
              () => undefined,
            )
          }
        >
          {busyAction === "export" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy || !canExportGrid}
          aria-label={gridLabel}
          className={actionButtonClass()}
          {...hoverProps(gridLabel)}
          onClick={() => setQualityDialogOpen(true)}
        >
          {busyAction === "grid-export" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Grid2x2 className="h-4 w-4" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          aria-label={archiveLabel}
          className={actionButtonClass()}
          {...hoverProps(archiveLabel)}
          onClick={() =>
            void runAction(
              "archive",
              () => runToggleArchiveEvent(event),
              onLibraryChange,
            )
          }
        >
          {busyAction === "archive" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : event.archived ? (
            <ArchiveRestore className="h-4 w-4" aria-hidden />
          ) : (
            <Archive className="h-4 w-4" aria-hidden />
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          aria-label="Delete"
          className={actionButtonClass(true)}
          {...hoverProps("Delete")}
          onClick={() =>
            void runAction("delete", () => runDeleteEvent(event), onDeleted)
          }
        >
          {busyAction === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden />
          )}
        </button>
        </div>
      </div>

      <GridExportQualityDialog
        open={qualityDialogOpen}
        initialQuality={gridExportQuality}
        onConfirm={handleQualityConfirm}
        onCancel={() => setQualityDialogOpen(false)}
      />
    </>
  );
};
