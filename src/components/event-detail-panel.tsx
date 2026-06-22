import { Camera, ChevronLeft, ChevronRight, StickyNote, Tag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  sortClipsByCamera,
  sourceBadgeClass,
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

const INSPECTOR_PANEL_CLASS = "w-64 xl:w-72";

const InspectorSection = ({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn("shrink-0", className)}>
    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
      {title}
    </h3>
    {children}
  </section>
);

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
  const hasNote = noteDraft.trim().length > 0;
  const activeTagCount = event.tags.length;
  const sortedClips = useMemo(() => sortClipsByCamera(event.clips), [event.clips]);
  const totalFileSize = useMemo(() => sumClipFileSize(event.clips), [event.clips]);
  const playbackDurationLabel =
    playbackMetrics.duration > 0 ? formatDuration(playbackMetrics.duration) : null;
  const updatedLabel = formatRelativeTime(event.updatedAt);

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
          "shrink-0 border-b border-zinc-800/80 px-5 py-3 transition-opacity duration-200 ease-out",
          isViewRefreshing && "opacity-70",
        )}
      >
        <h2 className="truncate text-base font-semibold tracking-tight text-zinc-100">
          {eventLabel}
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <ImportSourceSelect
            value={event.source as EventSource}
            onChange={onSourceChange}
            size="compact"
            aria-label="Event source"
            className={cn(
              "border-transparent text-[10px] font-medium ring-1 ring-inset",
              sourceBadgeClass(event.source),
            )}
          />
          {event.archived && (
            <span className="inline-flex rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-zinc-700/80 ring-inset">
              Archived
            </span>
          )}
          <span className="text-xs text-zinc-500">
            {event.clips.length} camera{event.clips.length === 1 ? "" : "s"}
          </span>
          <span className="text-zinc-700" aria-hidden>
            |
          </span>
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
        </div>
      </header>

      {actionError && (
        <div
          role="alert"
          className="shrink-0 border-b border-red-500/30 bg-red-500/10 px-5 py-2 text-xs text-red-300"
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
          className="shrink-0 border-b border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs text-emerald-200"
        >
          Grid video saved to{" "}
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

        <div className="flex shrink-0">
          <div className="flex w-9 shrink-0 flex-col items-center border-l border-zinc-800/80 bg-zinc-900/40 py-3">
            <button
              type="button"
              aria-expanded={detailInspectorOpen}
              aria-controls="event-detail-inspector"
              aria-label={inspectorToggleLabel}
              onClick={handleInspectorToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100"
            >
              {detailInspectorOpen ? (
                <ChevronRight className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden />
              )}
            </button>

            {!detailInspectorOpen && (
              <button
                type="button"
                onClick={() => onDetailInspectorOpenChange(true)}
                aria-label="Show tags, notes, and clip files"
                className="mt-4 flex flex-col items-center gap-3 text-zinc-600 transition hover:text-zinc-400"
              >
                <span
                  className={cn(
                    "inline-flex flex-col items-center gap-0.5",
                    activeTagCount > 0 && "text-sky-500/80",
                  )}
                >
                  <Tag className="h-3.5 w-3.5" aria-hidden />
                  {activeTagCount > 0 && (
                    <span className="text-[9px] font-medium tabular-nums">
                      {activeTagCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "inline-flex flex-col items-center gap-0.5",
                    hasNote && "text-sky-500/80",
                  )}
                >
                  <StickyNote className="h-3.5 w-3.5" aria-hidden />
                  {hasNote && (
                    <span className="text-[9px] font-medium leading-none">·</span>
                  )}
                </span>
                <span className="inline-flex flex-col items-center gap-0.5">
                  <Camera className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[9px] font-medium tabular-nums">
                    {event.clips.length}
                  </span>
                </span>
              </button>
            )}
          </div>

          <aside
            id="event-detail-inspector"
            aria-label="Event metadata"
            aria-hidden={!detailInspectorOpen}
            className={cn(
              "overflow-hidden border-l border-zinc-800/80 bg-zinc-900/30 transition-[width] duration-200 ease-out",
              detailInspectorOpen ? INSPECTOR_PANEL_CLASS : "w-0 border-l-0",
            )}
          >
            <div
              className={cn(
                INSPECTOR_PANEL_CLASS,
                "flex h-full flex-col gap-5 overflow-y-auto px-4 py-4",
                !detailInspectorOpen && "invisible",
              )}
            >
              <InspectorSection title="Summary">
                <dl className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-zinc-300">
                    {playbackDurationLabel && (
                      <div>
                        <dt className="sr-only">Duration</dt>
                        <dd className="tabular-nums">{playbackDurationLabel}</dd>
                      </div>
                    )}
                    {totalFileSize > 0 && (
                      <div>
                        <dt className="sr-only">Total size</dt>
                        <dd className="tabular-nums">{formatFileSize(totalFileSize)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="sr-only">Cameras</dt>
                      <dd>
                        {event.clips.length} angle{event.clips.length === 1 ? "" : "s"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sortedClips.map((clip) => (
                      <span
                        key={clip.id}
                        className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300"
                      >
                        {cameraLabel(clip.camera)}
                      </span>
                    ))}
                  </div>
                  {updatedLabel && (
                    <div className="text-[11px] text-zinc-500">
                      <dt className="sr-only">Last updated</dt>
                      <dd>Updated {updatedLabel}</dd>
                    </div>
                  )}
                </dl>
              </InspectorSection>

              <InspectorSection title="Tags">
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const active = event.tags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => onToggleTag(tag.name)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition",
                            active
                              ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40"
                              : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                          )}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No tags yet.</p>
                )}
              </InspectorSection>

              <InspectorSection title="Notes">
                <Textarea
                  id="event-note"
                  value={noteDraft}
                  onChange={(e) => onNoteChange(e.target.value)}
                  onBlur={onNoteSave}
                  maxLength={MAX_EVENT_NOTE_LENGTH}
                  rows={4}
                  placeholder="What happened?"
                  className="min-h-[5.5rem] resize-none border-zinc-800 bg-zinc-950/80 text-sm"
                />
              </InspectorSection>

              <InspectorSection title="Cameras" className="min-h-0 flex-1">
                <ul className="space-y-1.5">
                  {sortedClips.map((clip) => {
                    const durationLabel = formatDurationMs(clip.durationMs);
                    const metaParts = [
                      durationLabel,
                      clip.fileSize ? formatFileSize(clip.fileSize) : null,
                    ].filter(Boolean);

                    return (
                      <li
                        key={clip.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-zinc-950/60 px-2.5 py-1.5"
                      >
                        <span className="text-xs font-medium text-zinc-300">
                          {cameraLabel(clip.camera)}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-zinc-500">
                          {metaParts.length > 0 ? metaParts.join(" · ") : "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </InspectorSection>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
