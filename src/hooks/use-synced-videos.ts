import { useCallback, useEffect, useRef, useState } from "react";

type UseSyncedVideosOptions = {
  /** In single-camera mode, keep this clip aligned with the master timeline. */
  focusClipId?: string;
};

export const useSyncedVideos = (
  masterClipId: string | undefined,
  options: UseSyncedVideosOptions = {},
) => {
  const { focusClipId } = options;
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const masterClipIdRef = useRef(masterClipId);
  const focusClipIdRef = useRef(focusClipId);
  const seekingRef = useRef(false);
  const masterCleanupRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  masterClipIdRef.current = masterClipId;
  focusClipIdRef.current = focusClipId;

  const syncVideoToMaster = useCallback((video: HTMLVideoElement, master: HTMLVideoElement) => {
    if (master.readyState < 1) return;
    if (Math.abs(video.currentTime - master.currentTime) > 0.12) {
      video.currentTime = master.currentTime;
    }
  }, []);

  const bindMaster = useCallback(
    (master: HTMLVideoElement) => {
      masterCleanupRef.current?.();

      const syncPlayingState = () => {
        setIsPlaying(!master.paused && !master.ended);
      };

      const handleLoadedMetadata = () => {
        if (Number.isFinite(master.duration)) {
          setDuration(master.duration);
        }
        setCurrentTime(master.currentTime);
        syncPlayingState();
      };

      const handleTimeUpdate = () => {
        if (seekingRef.current) return;
        setCurrentTime(master.currentTime);
        for (const video of videoRefs.current.values()) {
          if (video === master) continue;
          syncVideoToMaster(video, master);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
      };

      master.addEventListener("loadedmetadata", handleLoadedMetadata);
      master.addEventListener("timeupdate", handleTimeUpdate);
      master.addEventListener("ended", handleEnded);
      master.addEventListener("play", syncPlayingState);
      master.addEventListener("pause", syncPlayingState);

      if (master.readyState >= 1) {
        handleLoadedMetadata();
      }

      masterCleanupRef.current = () => {
        master.removeEventListener("loadedmetadata", handleLoadedMetadata);
        master.removeEventListener("timeupdate", handleTimeUpdate);
        master.removeEventListener("ended", handleEnded);
        master.removeEventListener("play", syncPlayingState);
        master.removeEventListener("pause", syncPlayingState);
      };
    },
    [syncVideoToMaster],
  );

  const registerVideoRef = useCallback(
    (clipId: string, element: HTMLVideoElement | null) => {
      if (element) {
        const masterId = masterClipIdRef.current;
        const master = masterId ? videoRefs.current.get(masterId) : undefined;
        if (master && master !== element) {
          syncVideoToMaster(element, master);
        }
        videoRefs.current.set(clipId, element);

        if (clipId === masterId) {
          bindMaster(element);
        }
        return;
      }

      if (clipId === masterClipIdRef.current) {
        masterCleanupRef.current?.();
        masterCleanupRef.current = null;
      }
      videoRefs.current.delete(clipId);
    },
    [bindMaster, syncVideoToMaster],
  );

  const syncAllVideos = useCallback((time: number, pauseUpdates = false) => {
    if (pauseUpdates) {
      seekingRef.current = true;
    }

    for (const video of videoRefs.current.values()) {
      if (Math.abs(video.currentTime - time) > 0.12) {
        video.currentTime = time;
      }
    }

    setCurrentTime(time);

    if (pauseUpdates) {
      requestAnimationFrame(() => {
        seekingRef.current = false;
      });
    }
  }, []);

  const handleTogglePlay = useCallback(async () => {
    const videos = [...videoRefs.current.values()];
    const anyPlaying = videos.some((video) => !video.paused);

    if (anyPlaying) {
      for (const video of videos) {
        video.pause();
      }
      setIsPlaying(false);
      return;
    }

    await Promise.all(videos.map((video) => video.play().catch(() => undefined)));
    setIsPlaying(true);
  }, []);

  const handleSeek = useCallback(
    (value: number) => {
      syncAllVideos(value, true);
    },
    [syncAllVideos],
  );

  useEffect(() => {
    const masterId = masterClipIdRef.current;
    const master = masterId ? videoRefs.current.get(masterId) : undefined;
    const focusId = focusClipIdRef.current;
    if (!master || !focusId || focusId === masterId) return;

    const focusVideo = videoRefs.current.get(focusId);
    if (!focusVideo) return;

    syncVideoToMaster(focusVideo, master);
  }, [focusClipId, syncVideoToMaster]);

  useEffect(() => {
    seekingRef.current = false;

    const master = videoRefs.current.get(masterClipId ?? "");
    if (master) {
      bindMaster(master);
      if (master.readyState < 1) {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }

    return () => {
      masterCleanupRef.current?.();
      masterCleanupRef.current = null;
    };
  }, [masterClipId, bindMaster]);

  useEffect(
    () => () => {
      masterCleanupRef.current?.();
    },
    [],
  );

  return {
    registerVideoRef,
    isPlaying,
    currentTime,
    duration,
    handleTogglePlay,
    handleSeek,
  };
};
