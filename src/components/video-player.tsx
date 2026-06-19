import { getCurrentWindow } from "@tauri-apps/api/window";
import { Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EventPlaybackSurface } from "@/components/event-playback-surface";
import { cameraLabel, sortClipsByCamera } from "@/lib/format";
import { getSavedEventCamera, saveEventCamera } from "@/lib/event-camera-memory";
import type { PlaybackLayout } from "@/lib/library-preferences";
import type { ExportSegment, PlaybackMetrics } from "@/lib/playback-metrics";
import type { Clip } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type { PlaybackLayout };

const resolveDefaultCamera = (clips: Clip[], eventId: string) => {
  const savedCamera = getSavedEventCamera(eventId);
  if (savedCamera && clips.some((clip) => clip.camera === savedCamera)) {
    return savedCamera;
  }

  return (
    clips.find((clip) => clip.camera === "front")?.camera ??
    clips[0]?.camera ??
    "front"
  );
};

type VideoPlayerProps = {
  eventId: string;
  clips: Clip[];
  eventLabel: string;
  layout: PlaybackLayout;
  seekStepSecs: number;
  exportSegmentWindowSecs: number;
  onLayoutChange?: (layout: PlaybackLayout) => void;
  onPlaybackMetricsChange?: (metrics: PlaybackMetrics) => void;
  segmentEnabled?: boolean;
  exportSegment?: ExportSegment | null;
  onSegmentToggle?: () => void;
  className?: string;
};

export const VideoPlayer = ({
  eventId,
  clips,
  eventLabel,
  layout,
  seekStepSecs,
  exportSegmentWindowSecs,
  onLayoutChange,
  onPlaybackMetricsChange,
  segmentEnabled = false,
  exportSegment = null,
  onSegmentToggle,
  className,
}: VideoPlayerProps) => {
  const sortedClips = useMemo(() => sortClipsByCamera(clips), [clips]);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [activeCamera, setActiveCamera] = useState(() =>
    resolveDefaultCamera(sortedClips, eventId),
  );

  const activeClip =
    sortedClips.find((clip) => clip.camera === activeCamera) ?? sortedClips[0];

  useEffect(() => {
    setActiveCamera(resolveDefaultCamera(sortedClips, eventId));
  }, [sortedClips, eventId]);

  const handleActiveCameraChange = useCallback(
    (camera: string) => {
      setActiveCamera(camera);
      saveEventCamera(eventId, camera);
    },
    [eventId],
  );

  const handleExitFullscreen = useCallback(() => {
    setFullscreenOpen(false);
  }, []);

  const handleEnterFullscreen = useCallback(() => {
    setFullscreenOpen(true);
  }, []);

  useEffect(() => {
    if (!fullscreenOpen) return;

    void getCurrentWindow()
      .setFullscreen(true)
      .catch(() => undefined);

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleExitFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      void getCurrentWindow()
        .setFullscreen(false)
        .catch(() => undefined);
    };
  }, [fullscreenOpen, handleExitFullscreen]);

  if (sortedClips.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[12rem] flex-1 items-center justify-center bg-black text-sm text-zinc-500",
          className,
        )}
      >
        No video clips available
      </div>
    );
  }

  const showGrid = layout === "grid" && sortedClips.length > 1;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-black",
        fullscreenOpen && "fixed inset-0 z-[200] text-zinc-100",
        !fullscreenOpen && className,
      )}
    >
      {fullscreenOpen && (
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {showGrid ? "All cameras" : cameraLabel(activeClip?.camera ?? "front")}
              </span>
            </div>
            <p className="truncate text-base font-medium">{eventLabel}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleExitFullscreen()}
            aria-label="Exit fullscreen"
          >
            <X className="h-4 w-4" aria-hidden />
            Exit
          </Button>
        </header>
      )}

      <EventPlaybackSurface
        clips={sortedClips}
        layout={layout}
        activeCamera={activeCamera}
        onActiveCameraChange={handleActiveCameraChange}
        seekStepSecs={seekStepSecs}
        exportSegmentWindowSecs={exportSegmentWindowSecs}
        onLayoutChange={onLayoutChange}
        onPlaybackMetricsChange={onPlaybackMetricsChange}
        segmentEnabled={segmentEnabled}
        exportSegment={exportSegment}
        onSegmentToggle={onSegmentToggle}
        isFullscreen={fullscreenOpen}
        onEnterFullscreen={handleEnterFullscreen}
        className="min-h-0 flex-1"
      />
    </div>
  );
};
