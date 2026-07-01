import { CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { ImportSourceSelect } from "@/components/import-source-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatEventTime, getSourceDotClass, sourceLabel } from "@/lib/format";
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

const ImportNotice = ({ children }: { children: ReactNode }) => (
  <div
    role="status"
    className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5 text-sm leading-relaxed text-zinc-500"
  >
    {children}
  </div>
);

const ImportEventSource = ({
  event,
  sourceOverrides,
  loading,
  onSourceOverride,
}: {
  event: DetectedEvent;
  sourceOverrides: Record<string, EventSource>;
  loading: boolean;
  onSourceOverride: (folderPath: string, source: EventSource) => void;
}) => {
  if (event.sourceInferred) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", getSourceDotClass(event.source))}
          aria-hidden
        />
        {sourceLabel(event.source)}
      </span>
    );
  }

  return (
    <ImportSourceSelect
      value={getUnrecognizedSource(event, sourceOverrides)}
      onChange={(source) => onSourceOverride(event.folderPath, source)}
      disabled={loading}
      size="compact"
      aria-label={`Source for ${formatEventTime(event.eventTime)}`}
      className="h-auto min-w-0 border-0 bg-transparent px-0 py-0 text-xs text-zinc-500 shadow-none ring-0 [&_svg]:size-3.5"
    />
  );
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
  <section className="flex flex-col gap-2.5" aria-label="Review import">
    <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
      <p className="text-sm text-zinc-500">
        {detected.length} event{detected.length === 1 ? "" : "s"}
        {newEventCount > 0 && (
          <span className="text-zinc-400">
            {" "}
            · {newEventCount} new
          </span>
        )}
        {importedEventCount > 0 && (
          <span>
            {" "}
            · {importedEventCount} in library
          </span>
        )}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onSelectAllNew}
        disabled={loading || newEventCount === 0}
        className="h-8 text-sm text-zinc-500"
      >
        Select all new
      </Button>
    </div>

    {allAlreadyInLibrary && (
      <ImportNotice>Nothing new — this footage is already in your library.</ImportNotice>
    )}

    {hasMixedImportResults && (
      <ImportNotice>
        Events marked <span className="text-zinc-400">In library</span> cannot be imported again.
      </ImportNotice>
    )}

    {showSourcePicker && (
      <ImportNotice>
        <p>Choose Recent, Sentry, or Saved for each event.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-zinc-600">Set all to</span>
          <ImportSourceSelect
            value={bulkUnrecognizedSource ?? DEFAULT_LOOSE_IMPORT_SOURCE}
            onChange={onBulkSourceChange}
            disabled={loading}
            aria-label="Set source for all unrecognized events"
            className="h-7 w-auto min-w-0 text-xs"
          />
        </div>
      </ImportNotice>
    )}

    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl ring-1 ring-inset ring-zinc-800",
        dragOver && "ring-zinc-600",
      )}
    >
      <ul className="max-h-[min(420px,50vh)] divide-y divide-zinc-800/80 overflow-y-auto bg-zinc-950/30">
        {detected.map((event) => {
          const isSelected = selectedEvents.has(event.folderPath);
          const isImported = event.alreadyImported;

          return (
            <li key={event.folderPath}>
              <div
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 transition-colors",
                  isImported && "opacity-45",
                  !isImported && !isSelected && "hover:bg-zinc-900/40",
                  isSelected && !isImported && "bg-zinc-900/80 ring-1 ring-inset ring-zinc-700/50",
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
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                  {formatEventTime(event.eventTime)}
                </span>
                <ImportEventSource
                  event={event}
                  sourceOverrides={sourceOverrides}
                  loading={isImported || loading}
                  onSourceOverride={onSourceOverride}
                />
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                  {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
                </span>
                {isImported && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-zinc-600">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    In library
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2 border-t border-zinc-800/80 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={onPickFolders}
          disabled={loading || importing}
          className="text-zinc-500 transition hover:text-zinc-300 disabled:opacity-40"
        >
          Add folders
        </button>
        <span className="text-zinc-700" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={onPickFiles}
          disabled={loading || importing}
          className="text-zinc-500 transition hover:text-zinc-300 disabled:opacity-40"
        >
          Add files
        </button>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-3 py-2.5"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-zinc-500">
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
              {selectionSummary.cameras} cam{selectionSummary.cameras === 1 ? "" : "s"}
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
              className="h-8 text-zinc-500"
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={onImport}
            disabled={loading || importing || selectionSummary.events === 0}
          >
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
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
