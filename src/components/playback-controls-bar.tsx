import { Grid2x2, Maximize2, Pause, Play, Scissors, Square } from "lucide-react";
import {
  InlineActionHintRow,
  useInlineActionLabel,
} from "@/components/ui/inline-action-label";
import { Button } from "@/components/ui/button";
import { cameraLabel, formatDuration } from "@/lib/format";
import type { PlaybackLayout } from "@/lib/library-preferences";
import type { ExportSegment } from "@/lib/playback-metrics";
import { cn } from "@/lib/utils";

type CameraTab = {
  id: string;
  camera: string;
};

type PlaybackControlsBarProps = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  layout?: PlaybackLayout;
  onLayoutChange?: (layout: PlaybackLayout) => void;
  canUseGrid?: boolean;
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
  cameras?: CameraTab[];
  activeCamera?: string;
  onCameraChange?: (camera: string) => void;
  seekLabel?: string;
  segmentEnabled?: boolean;
  exportSegment?: ExportSegment | null;
  onSegmentToggle?: () => void;
  canUseSegment?: boolean;
  exportSegmentWindowSecs?: number;
};

export const PlaybackControlsBar = ({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  layout,
  onLayoutChange,
  canUseGrid = false,
  isFullscreen = false,
  onEnterFullscreen,
  cameras = [],
  activeCamera,
  onCameraChange,
  seekLabel = "Seek playback",
  segmentEnabled = false,
  exportSegment = null,
  onSegmentToggle,
  canUseSegment = false,
  exportSegmentWindowSecs = 30,
}: PlaybackControlsBarProps) => {
  const { hoveredLabel, hoverProps, clearHover, handleBlur } = useInlineActionLabel();
  const showCameraTabs = cameras.length > 1 && onCameraChange;
  const showLayoutToggle = canUseGrid && onLayoutChange && layout;
  const segmentStartPercent =
    exportSegment && duration > 0 ? (exportSegment.startSecs / duration) * 100 : 0;
  const segmentWidthPercent =
    exportSegment && duration > 0 ? (exportSegment.durationSecs / duration) * 100 : 0;

  const segmentEndSecs =
    exportSegment != null ? exportSegment.startSecs + exportSegment.durationSecs : 0;
  const showSegmentRail = segmentEnabled && exportSegment != null && duration > 0;

  const segmentHoverLabel = segmentEnabled
    ? "Export segment on. ZIP and grid use this range."
    : canUseSegment
      ? `Set ${exportSegmentWindowSecs}s export segment at playhead`
      : "Load footage first";

  return (
    <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950 px-3 py-2">
      <div
        className="mx-auto flex max-w-4xl flex-col gap-1"
        onMouseLeave={clearHover}
        onBlur={handleBlur}
      >
        {onSegmentToggle && (
          <div className="flex h-6 shrink-0 items-center gap-2.5 pb-1.5">
            <span
              className={cn(
                "w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-fuchsia-400",
                !showSegmentRail && "invisible",
              )}
            >
              Export
            </span>
            <div
              aria-hidden={!showSegmentRail}
              className={cn(
                "relative h-3 min-w-0 flex-1 rounded-full ring-1 ring-inset ring-zinc-700/80",
                showSegmentRail ? "bg-zinc-800" : "bg-zinc-900/40",
              )}
            >
              {showSegmentRail && exportSegment && (
                <>
                  <div
                    className="absolute inset-y-0 rounded-full bg-fuchsia-500/85 ring-1 ring-fuchsia-300/50"
                    style={{
                      left: `${segmentStartPercent}%`,
                      width: `${segmentWidthPercent}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 z-[1] h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.45)]"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium tabular-nums text-fuchsia-300",
                !showSegmentRail && "invisible",
              )}
            >
              {showSegmentRail && exportSegment
                ? `${formatDuration(exportSegment.startSecs)}–${formatDuration(segmentEndSecs)}`
                : "0:00–0:00"}
            </span>
          </div>
        )}

        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => onSeek(Number(event.target.value))}
            aria-label={seekLabel}
            className="relative z-[1] h-1.5 w-full cursor-pointer accent-sky-500 focus:outline-none focus-visible:outline-none"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex w-[9.5rem] shrink-0 items-center gap-1 justify-self-start">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void onTogglePlay()}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="h-7 w-7 shrink-0 p-0"
              {...hoverProps(isPlaying ? "Pause" : "Play")}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" aria-hidden />
              ) : (
                <Play className="h-4 w-4" aria-hidden />
              )}
            </Button>

            {onSegmentToggle && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onSegmentToggle}
                disabled={!canUseSegment}
                aria-pressed={segmentEnabled}
                aria-label={segmentHoverLabel}
                className={cn(
                  "h-7 w-7 shrink-0 p-0",
                  segmentEnabled
                    ? "text-fuchsia-300 hover:text-fuchsia-200"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
                {...hoverProps(segmentHoverLabel)}
              >
                <Scissors className="h-3.5 w-3.5" aria-hidden />
              </Button>
            )}

            <span className="min-w-0 truncate text-xs tabular-nums text-zinc-400">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          {showCameraTabs ? (
            <div
              role="tablist"
              aria-label="Camera angles"
              className="flex min-w-0 justify-self-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-zinc-800/90 bg-zinc-900/70 p-0.5 ring-1 ring-inset ring-zinc-800/50">
                {cameras.map((clip) => {
                  const isActive = layout !== "grid" && clip.camera === activeCamera;
                  return (
                    <button
                      key={clip.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => onCameraChange(clip.camera)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150 outline-none focus:outline-none focus-visible:outline-none",
                        isActive
                          ? "bg-zinc-100 text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200",
                      )}
                    >
                      {cameraLabel(clip.camera)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div aria-hidden />
          )}

          <div className="flex shrink-0 items-center justify-end gap-1 justify-self-end">
            {showLayoutToggle && (
              <div
                role="group"
                aria-label="Playback layout"
                className="inline-flex rounded-md border border-zinc-800 p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={layout === "single"}
                  onClick={() => onLayoutChange("single")}
                  className={cn(
                    "inline-flex h-7 items-center rounded px-1.5 transition",
                    layout === "single"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                  {...hoverProps("Single camera")}
                >
                  <Square className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-pressed={layout === "grid"}
                  onClick={() => onLayoutChange("grid")}
                  className={cn(
                    "inline-flex h-7 items-center rounded px-1.5 transition",
                    layout === "grid"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                  {...hoverProps("Multi-camera grid")}
                >
                  <Grid2x2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            )}

            {!isFullscreen && onEnterFullscreen && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onEnterFullscreen}
                aria-label={layout === "grid" ? "Fullscreen grid" : "Fullscreen video"}
                className="h-7 w-7 shrink-0 p-0 text-zinc-400 hover:text-zinc-200"
                {...hoverProps(
                  layout === "grid" ? "Fullscreen grid" : "Fullscreen video",
                )}
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            )}
          </div>
        </div>

        <InlineActionHintRow label={hoveredLabel} />
      </div>
    </div>
  );
};
