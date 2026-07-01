import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ImportSourceSelect } from "@/components/import-source-select";
import { EventHeaderActions } from "@/components/event-header-actions";
import { GridExportStatus } from "@/components/grid-export-status";
import { VideoPlayer } from "@/components/video-player";
import type { GridExportQuality } from "@/lib/grid-export-quality";
import type { PlaybackLayout } from "@/lib/library-preferences";
import {
  computeExportSegment,
  DEFAULT_PLAYBACK_METRICS,
  type PlaybackMetrics,
} from "@/lib/playback-metrics";
import {
  cameraLabel,
  formatDuration,
  formatDurationMs,
  formatEventTime,
  formatFileSize,
  formatRelativeTime,
  getSourceDotClass,
  sortClipsByCamera,
  sourceLabel,
  sumClipFileSize,
} from "@/lib/format";
import { MAX_EVENT_NOTE_LENGTH } from "@/lib/event-notes";
import type { DashEvent, EventSource, TagInfo } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EventDetailPanelProps = {
  event: DashEvent;
  tags: TagInfo[];
  noteDraft: string;
  playbackLayout: PlaybackLayout;
  seekStepSecs: number;
  exportSegmentSecs: number;
  gridExportQuality: GridExportQuality;
  onGridExportQualityChange: (quality: GridExportQuality) => void;
  detailInspectorOpen: boolean;
  isViewRefreshing?: boolean;
  onPlaybackLayoutChange: (layout: PlaybackLayout) => void;
  onDetailInspectorOpenChange: (open: boolean) => void;
  onNoteChange: (value: string) => void;
  onNoteSave: () => void;
  onToggleTag: (tagName: string) => void;
  onSourceChange: (source: EventSource) => void;
  onLibraryChange: () => void;
  onDeleted: () => void;
};

const INSPECTOR_PANEL_CLASS = "w-60 xl:w-64";

export const EventDetailPanel = ({
  event,
  tags,
  noteDraft,
  playbackLayout,
  seekStepSecs,
  exportSegmentSecs,
  gridExportQuality,
  onGridExportQualityChange,
  detailInspectorOpen,
  isViewRefreshing = false,
  onPlaybackLayoutChange,
  onDetailInspectorOpenChange,
  onNoteChange,
  onNoteSave,
  onToggleTag,
  onSourceChange,
  onLibraryChange,
  onDeleted,
}: EventDetailPanelProps) => {
  const [gridExportPath, setGridExportPath] = useState<string | null>(null);
  const [gridExportQualityLabel, setGridExportQualityLabel] = useState<GridExportQuality | null>(
    null,
  );
  const [exportSuccessPath, setExportSuccessPath] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [playbackMetrics, setPlaybackMetrics] = useState<PlaybackMetrics>(
    DEFAULT_PLAYBACK_METRICS,
  );
  const [segmentEnabled, setSegmentEnabled] = useState(false);
  const eventLabel = formatEventTime(event.eventTime);
  const sortedClips = useMemo(() => sortClipsByCamera(event.clips), [event.clips]);
  const totalFileSize = useMemo(() => sumClipFileSize(event.clips), [event.clips]);
  const playbackDurationLabel =
    playbackMetrics.duration > 0 ? formatDuration(playbackMetrics.duration) : null;
  const updatedLabel = formatRelativeTime(event.updatedAt);
  const sourceDotClass = getSourceDotClass(event.source);
  const detailsActive = event.tags.length > 0 || noteDraft.trim().length > 0;

  const exportSegment =
    segmentEnabled && playbackMetrics.duration > 0
      ? computeExportSegment(
          playbackMetrics.currentTime,
          playbackMetrics.duration,
          exportSegmentSecs,
        )
      : null;

  useEffect(() => {
    setPlaybackMetrics(DEFAULT_PLAYBACK_METRICS);
    setSegmentEnabled(false);
  }, [event.id]);

  const handlePlaybackMetricsChange = useCallback((metrics: PlaybackMetrics) => {
    setPlaybackMetrics(metrics);
  }, []);

  const handleSegmentToggle = useCallback(() => {
    setSegmentEnabled((previous) => !previous);
  }, []);

  const handleInspectorToggle = useCallback(() => {
    onDetailInspectorOpenChange(!detailInspectorOpen);
  }, [detailInspectorOpen, onDetailInspectorOpenChange]);

  useEffect(() => {
    if (!exportSuccessPath) return;

    const timeout = window.setTimeout(() => setExportSuccessPath(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [exportSuccessPath]);

  const handleExportingChange = (
    exporting: boolean,
    destPath?: string,
    quality?: GridExportQuality,
  ) => {
    setGridExportPath(exporting && destPath ? destPath : null);
    setGridExportQualityLabel(exporting && quality ? quality : null);
    if (exporting) setExportSuccessPath(null);
  };

  const handleExportSuccess = (destPath: string) => {
    setExportSuccessPath(destPath);
  };

  const inspectorToggleLabel = detailInspectorOpen ? "Hide details" : "Show details";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950">
      <header
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-2.5 transition-opacity duration-200 ease-out",
          isViewRefreshing && "opacity-70",
        )}
      >
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold tracking-tight text-zinc-100">
            {eventLabel}
          </h2>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sourceDotClass)}
              aria-hidden
            />
            <ImportSourceSelect
              value={event.source as EventSource}
              onChange={onSourceChange}
              size="compact"
              aria-label="Event source"
              className="h-auto border-0 bg-transparent px-0 py-0 text-xs text-zinc-500 shadow-none ring-0 hover:text-zinc-300 [&_svg]:hidden"
            />
            {event.archived && (
              <span className="text-zinc-500">· Archived</span>
            )}
            <span className="shrink-0">
              {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
            </span>
            {playbackDurationLabel && (
              <>
                <span aria-hidden>·</span>
                <span className="shrink-0 tabular-nums">{playbackDurationLabel}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <EventHeaderActions
            event={event}
            exportSegment={exportSegment}
            gridExportQuality={gridExportQuality}
            onGridExportQualityChange={onGridExportQualityChange}
            onLibraryChange={onLibraryChange}
            onDeleted={onDeleted}
            onError={setActionError}
            onExportingChange={handleExportingChange}
            onExportSuccess={handleExportSuccess}
          />

          <button
            type="button"
            aria-expanded={detailInspectorOpen}
            aria-controls="event-detail-inspector"
            aria-label={inspectorToggleLabel}
            onClick={handleInspectorToggle}
            className={cn(
              "relative inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition ring-1 ring-inset",
              detailInspectorOpen
                ? "bg-zinc-800 text-zinc-100 ring-zinc-700"
                : "text-zinc-500 ring-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-300",
            )}
          >
            {detailInspectorOpen ? (
              <PanelRightClose className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <PanelRightOpen className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Details
            {detailsActive && !detailInspectorOpen && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sky-500"
                aria-hidden
              />
            )}
          </button>
        </div>
      </header>

      {actionError && (
        <div
          role="alert"
          className="shrink-0 border-b border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-[11px] text-red-300"
        >
          {actionError}
        </div>
      )}

      {gridExportPath && (
        <GridExportStatus destPath={gridExportPath} quality={gridExportQualityLabel} />
      )}

      {exportSuccessPath && (
        <div
          role="status"
          className="shrink-0 border-b border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] text-emerald-200"
        >
          Grid saved ·{" "}
          <span className="font-mono text-emerald-100">
            {exportSuccessPath.split(/[/\\]/).pop()}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-0 flex-1 overflow-hidden transition-opacity duration-200 ease-out",
          isViewRefreshing && "pointer-events-none opacity-60",
        )}
      >
        <VideoPlayer
          eventId={event.id}
          clips={event.clips}
          eventLabel={eventLabel}
          layout={playbackLayout}
          seekStepSecs={seekStepSecs}
          exportSegmentWindowSecs={exportSegmentSecs}
          onLayoutChange={onPlaybackLayoutChange}
          onPlaybackMetricsChange={handlePlaybackMetricsChange}
          segmentEnabled={segmentEnabled}
          exportSegment={exportSegment}
          onSegmentToggle={handleSegmentToggle}
          className="min-h-0 min-w-0 flex-1"
        />

        <aside
          id="event-detail-inspector"
          aria-label="Event details"
          aria-hidden={!detailInspectorOpen}
          className={cn(
            "shrink-0 overflow-hidden border-l border-zinc-800 bg-zinc-950 transition-[width] duration-200 ease-out",
            detailInspectorOpen ? INSPECTOR_PANEL_CLASS : "w-0 border-l-0",
          )}
        >
          <div
            className={cn(
              INSPECTOR_PANEL_CLASS,
              "flex h-full flex-col overflow-y-auto px-3 py-3",
              !detailInspectorOpen && "invisible",
            )}
          >
            <div className="space-y-3">
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => {
                    const active = event.tags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => onToggleTag(tag.name)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium transition",
                          active
                            ? "bg-zinc-800 text-zinc-100 ring-1 ring-inset ring-zinc-700"
                            : "text-zinc-500 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-300",
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-600">No tags yet.</p>
              )}

              <Textarea
                id="event-note"
                value={noteDraft}
                onChange={(e) => onNoteChange(e.target.value)}
                onBlur={onNoteSave}
                maxLength={MAX_EVENT_NOTE_LENGTH}
                rows={3}
                placeholder="Add a note…"
                className="min-h-[5rem] resize-none border-zinc-800/80 bg-zinc-900/40 text-sm"
              />

              <ul className="divide-y divide-zinc-800/80 rounded-lg ring-1 ring-inset ring-zinc-800/80">
                {sortedClips.map((clip) => {
                  const durationLabel = formatDurationMs(clip.durationMs);
                  const metaParts = [
                    durationLabel,
                    clip.fileSize ? formatFileSize(clip.fileSize) : null,
                  ].filter(Boolean);

                  return (
                    <li
                      key={clip.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5"
                    >
                      <span className="text-xs font-medium text-zinc-400">
                        {cameraLabel(clip.camera)}
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
                        {metaParts.length > 0 ? metaParts.join(" · ") : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-auto pt-4 text-[10px] text-zinc-600">
              {totalFileSize > 0 && (
                <span className="tabular-nums">{formatFileSize(totalFileSize)}</span>
              )}
              {totalFileSize > 0 && updatedLabel && <span aria-hidden> · </span>}
              {updatedLabel && <span>Updated {updatedLabel}</span>}
              {!totalFileSize && !updatedLabel && (
                <span>{sourceLabel(event.source)}</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
