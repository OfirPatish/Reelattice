import { convertFileSrc } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CameraBadge, cameraAriaLabel } from "@/components/camera-badge";
import { PlaybackClipError } from "@/components/playback-clip-error";
import { PlaybackControlsBar } from "@/components/playback-controls-bar";
import { useSyncedVideos } from "@/hooks/use-synced-videos";
import { getCameraGridArea, getReviewGridStyle } from "@/lib/camera-layout";
import { sortClipsByCamera } from "@/lib/format";
import type { PlaybackLayout } from "@/lib/library-preferences";
import type { ExportSegment, PlaybackMetrics } from "@/lib/playback-metrics";
import type { Clip } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventPlaybackSurfaceProps = {
  clips: Clip[];
  layout: PlaybackLayout;
  activeCamera: string;
  onActiveCameraChange: (camera: string) => void;
  seekStepSecs: number;
  exportSegmentWindowSecs: number;
  onLayoutChange?: (layout: PlaybackLayout) => void;
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
  onPlaybackMetricsChange?: (metrics: PlaybackMetrics) => void;
  segmentEnabled?: boolean;
  exportSegment?: ExportSegment | null;
  onSegmentToggle?: () => void;
  className?: string;
};

export const EventPlaybackSurface = ({
  clips,
  layout,
  activeCamera,
  onActiveCameraChange,
  seekStepSecs,
  exportSegmentWindowSecs,
  onLayoutChange,
  isFullscreen = false,
  onEnterFullscreen,
  onPlaybackMetricsChange,
  segmentEnabled = false,
  exportSegment = null,
  onSegmentToggle,
  className,
}: EventPlaybackSurfaceProps) => {
  const sortedClips = useMemo(() => sortClipsByCamera(clips), [clips]);
  const canUseGrid = sortedClips.length > 1;
  const showGrid = layout === "grid" && canUseGrid;
  const masterClipId = sortedClips[0]?.id;
  const activeClipId =
    sortedClips.find((clip) => clip.camera === activeCamera)?.id ?? masterClipId;

  const activeClip =
    sortedClips.find((clip) => clip.camera === activeCamera) ?? sortedClips[0];

  const gridStyle = useMemo(
    () => getReviewGridStyle(sortedClips.map((clip) => clip.camera)),
    [sortedClips],
  );

  const [readyClips, setReadyClips] = useState<Set<string>>(() => new Set());
  const [failedClips, setFailedClips] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setReadyClips(new Set());
    setFailedClips(new Set());
  }, [clips]);

  const handleClipReady = useCallback((clipId: string) => {
    setReadyClips((previous) => {
      if (previous.has(clipId)) return previous;
      const next = new Set(previous);
      next.add(clipId);
      return next;
    });
    setFailedClips((previous) => {
      if (!previous.has(clipId)) return previous;
      const next = new Set(previous);
      next.delete(clipId);
      return next;
    });
  }, []);

  const handleClipError = useCallback((clipId: string) => {
    setFailedClips((previous) => {
      if (previous.has(clipId)) return previous;
      const next = new Set(previous);
      next.add(clipId);
      return next;
    });
    setReadyClips((previous) => {
      if (!previous.has(clipId)) return previous;
      const next = new Set(previous);
      next.delete(clipId);
      return next;
    });
  }, []);

  const { registerVideoRef, isPlaying, currentTime, duration, handleTogglePlay, handleSeek } =
    useSyncedVideos(masterClipId, { focusClipId: showGrid ? undefined : activeClipId });

  useEffect(() => {
    onPlaybackMetricsChange?.({ currentTime, duration });
  }, [currentTime, duration, onPlaybackMetricsChange]);

  useEffect(() => {
    const isPlaybackKeyTarget = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return true;
      if (active.isContentEditable) return false;
      if (active instanceof HTMLTextAreaElement) return false;
      if (active instanceof HTMLInputElement) {
        if (active.type === "range") return true;
        return false;
      }
      return true;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPlaybackKeyTarget()) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === " ") {
        event.preventDefault();
        void handleTogglePlay();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleSeek(Math.max(0, currentTime - seekStepSecs));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const maxTime = duration > 0 ? duration : currentTime + seekStepSecs;
        handleSeek(Math.min(maxTime, currentTime + seekStepSecs));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, duration, handleSeek, handleTogglePlay, seekStepSecs]);

  const handleSurfaceClick = () => {
    if (showGrid) {
      void handleTogglePlay();
    }
  };

  const handleCameraChange = (camera: string) => {
    if (layout === "grid") {
      onLayoutChange?.("single");
    }
    onActiveCameraChange(camera);
  };

  return (
    <div className={cn("flex min-h-0 flex-col bg-black", className)}>
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden bg-black",
          showGrid ? "grid gap-0" : "",
        )}
        style={showGrid ? gridStyle : undefined}
        onClick={showGrid ? handleSurfaceClick : undefined}
      >
        {sortedClips.map((clip) => {
          const gridArea = getCameraGridArea(clip.camera);
          const isActiveSingle = clip.camera === activeCamera;
          const isReady = readyClips.has(clip.id);
          const hasFailed = failedClips.has(clip.id);
          const showVideo = isReady && (showGrid || isActiveSingle);
          const showPlaybackError =
            hasFailed && (showGrid || isActiveSingle) && !isReady;

          return (
            <div
              key={clip.id}
              className={cn(
                "overflow-hidden bg-black",
                showGrid
                  ? "relative min-h-0 min-w-0"
                  : cn(
                      "absolute inset-0",
                      isActiveSingle ? "z-[1]" : "z-0 pointer-events-none",
                    ),
              )}
              style={showGrid && gridArea ? { gridArea } : undefined}
            >
              {showGrid && (
                <CameraBadge camera={clip.camera} className="left-2 top-2 z-10" />
              )}

              <div className="relative h-full w-full">
                {!showGrid && isActiveSingle && (
                  <CameraBadge camera={clip.camera} className="left-3 top-3 z-10" />
                )}

                {!isReady && clip.thumbnailPath && (
                  <img
                    src={convertFileSrc(clip.thumbnailPath)}
                    alt=""
                    aria-hidden
                    className={cn(
                      "absolute inset-0 z-0 h-full w-full bg-black",
                      showGrid ? "object-cover" : "object-contain",
                    )}
                  />
                )}

                <video
                  ref={(element) => {
                    registerVideoRef(clip.id, element);
                    if (element && element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                      handleClipReady(clip.id);
                    }
                  }}
                  src={convertFileSrc(clip.filePath)}
                  muted={showGrid ? clip.camera !== "front" : clip.camera !== activeCamera}
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  onContextMenu={(event) => event.preventDefault()}
                  onLoadedData={() => handleClipReady(clip.id)}
                  onError={() => handleClipError(clip.id)}
                  onClick={
                    !showGrid && isActiveSingle
                      ? (event) => {
                          event.stopPropagation();
                          void handleTogglePlay();
                        }
                      : undefined
                  }
                  className={cn(
                    "h-full w-full bg-black transition-opacity duration-150",
                    showGrid ? "object-cover" : "object-contain",
                    showVideo ? "opacity-100" : "opacity-0",
                    !showGrid && isActiveSingle && "cursor-pointer",
                  )}
                  aria-label={cameraAriaLabel(clip.camera)}
                  aria-hidden={!showGrid && !isActiveSingle}
                />

                {showPlaybackError && <PlaybackClipError />}
              </div>
            </div>
          );
        })}
      </div>

      <PlaybackControlsBar
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        layout={layout}
        onLayoutChange={onLayoutChange}
        canUseGrid={canUseGrid}
        isFullscreen={isFullscreen}
        onEnterFullscreen={onEnterFullscreen}
        cameras={sortedClips}
        activeCamera={activeCamera}
        onCameraChange={handleCameraChange}
        seekLabel={
          showGrid
            ? "Seek all cameras"
            : `Seek ${cameraAriaLabel(activeClip?.camera ?? "front")}`
        }
        segmentEnabled={segmentEnabled}
        exportSegment={exportSegment}
        onSegmentToggle={onSegmentToggle}
        canUseSegment={duration > 0}
        exportSegmentWindowSecs={exportSegmentWindowSecs}
      />
    </div>
  );
};
