import { CheckCircle2, Info, Loader2, Plus } from "lucide-react";
import { ImportSourceSelect } from "@/components/import-source-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatEventTime, sourceBadgeClass, sourceLabel } from "@/lib/format";
import {
  DEFAULT_LOOSE_IMPORT_SOURCE,
  getUnrecognizedSource,
} from "@/lib/import-source";
import type { DetectedEvent, EventSource, ImportJobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type ImportPreviewPanelProps = {
  detected: DetectedEvent[];
  selectedEvents: Set<string>;
  loading: boolean;
  importing: boolean;
  importProgress: ImportJobStatus | null;
  dragOver: boolean;
  newEventCount: number;
  importedEventCount: number;
  allAlreadyInLibrary: boolean;
  hasMixedImportResults: boolean;
  showSourcePicker: boolean;
  bulkUnrecognizedSource: EventSource | undefined;
  sourceOverrides: Record<string, EventSource>;
  selectionSummary: { events: number; cameras: number };
  onToggleEvent: (folderPath: string, checked: boolean) => void;
  onSelectAllNew: () => void;
  onBulkSourceChange: (source: EventSource) => void;
  onSourceOverride: (folderPath: string, source: EventSource) => void;
  onPickFolders: () => void;
  onPickFiles: () => void;
  onImport: () => void;
  onCancelImport: () => void;
};

export const ImportPreviewPanel = ({
  detected,
  selectedEvents,
  loading,
  importing,
  importProgress,
  dragOver,
  newEventCount,
  importedEventCount,
  allAlreadyInLibrary,
  hasMixedImportResults,
  showSourcePicker,
  bulkUnrecognizedSource,
  sourceOverrides,
  selectionSummary,
  onToggleEvent,
  onSelectAllNew,
  onBulkSourceChange,
  onSourceOverride,
  onPickFolders,
  onPickFiles,
  onImport,
  onCancelImport,
}: ImportPreviewPanelProps) => (
  <section className="flex flex-col gap-3" aria-label="Review import">
    <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
      <p className="text-sm text-zinc-400">
        {detected.length} event{detected.length === 1 ? "" : "s"} found
        {newEventCount > 0 && (
          <span className="text-emerald-400/90">
            {" "}
            · {newEventCount} new
          </span>
        )}
        {importedEventCount > 0 && (
          <span className="text-zinc-500">
            {" "}
            · {importedEventCount} already in library
          </span>
        )}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onSelectAllNew}
        disabled={loading || newEventCount === 0}
        className="h-8 text-zinc-400"
      >
        Select all new
      </Button>
    </div>

    {allAlreadyInLibrary && (
      <div
        role="status"
        className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-sm text-sky-100/90"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
        <p>Nothing new. This footage is already in your library.</p>
      </div>
    )}

    {hasMixedImportResults && (
      <div
        role="status"
        className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5 text-sm text-zinc-400"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Events marked <span className="text-zinc-300">In library</span> cannot be imported again.
        </p>
      </div>
    )}

    {showSourcePicker && (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
        <p className="text-sm text-amber-100/90">
          Choose Recent, Sentry, or Saved for each event.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Set all to:</span>
          <ImportSourceSelect
            value={bulkUnrecognizedSource ?? DEFAULT_LOOSE_IMPORT_SOURCE}
            onChange={onBulkSourceChange}
            disabled={loading}
            aria-label="Set source for all unrecognized events"
          />
        </div>
      </div>
    )}

    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40",
        dragOver && "border-zinc-600",
      )}
    >
      <ul className="max-h-[min(420px,50vh)] divide-y divide-zinc-800/80 overflow-y-auto">
        {detected.map((event) => {
          const isSelected = selectedEvents.has(event.folderPath);
          const isImported = event.alreadyImported;

          return (
            <li key={event.folderPath}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  isImported && "opacity-45",
                  !isImported && !isSelected && "hover:bg-zinc-800/30",
                  isSelected && !isImported && "bg-zinc-800/60",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={isImported || loading}
                  onCheckedChange={(checked) =>
                    onToggleEvent(event.folderPath, checked === true)
                  }
                  aria-label={`Import ${formatEventTime(event.eventTime)}`}
                />
                <span className="min-w-0 flex-1 text-sm text-zinc-200">
                  {formatEventTime(event.eventTime)}
                </span>
                {event.sourceInferred ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                      sourceBadgeClass(event.source),
                    )}
                  >
                    {sourceLabel(event.source)}
                  </span>
                ) : (
                  <ImportSourceSelect
                    value={getUnrecognizedSource(event, sourceOverrides)}
                    onChange={(source) => onSourceOverride(event.folderPath, source)}
                    disabled={isImported || loading}
                    size="compact"
                    aria-label={`Source for ${formatEventTime(event.eventTime)}`}
                  />
                )}
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                  {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
                </span>
                {isImported && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-zinc-500">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    In library
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex border-t border-zinc-800/80 px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPickFolders}
          disabled={loading || importing}
          className="text-zinc-500"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add folders
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPickFiles}
          disabled={loading || importing}
          className="text-zinc-500"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add files
        </Button>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-zinc-400">
          {importing && importProgress ? (
            <>
              Copying {importProgress.completedEvents}/{importProgress.totalEvents}
              {importProgress.currentLabel ? (
                <span className="text-zinc-600"> · {importProgress.currentLabel}</span>
              ) : null}
            </>
          ) : allAlreadyInLibrary ? (
            "Nothing selected to import"
          ) : selectionSummary.events > 0 ? (
            <>
              {selectionSummary.events} event{selectionSummary.events === 1 ? "" : "s"} ·{" "}
              {selectionSummary.cameras} camera{selectionSummary.cameras === 1 ? "" : "s"}
            </>
          ) : (
            "Select events to import"
          )}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {importing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelImport}
              className="text-zinc-400"
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onImport}
            disabled={loading || importing || selectionSummary.events === 0}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Copying…
              </>
            ) : (
              <>Import{selectionSummary.events > 0 ? ` (${selectionSummary.events})` : ""}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  </section>
);
