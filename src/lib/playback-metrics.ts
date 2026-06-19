export type PlaybackMetrics = {
  currentTime: number;
  duration: number;
};

export const DEFAULT_PLAYBACK_METRICS: PlaybackMetrics = {
  currentTime: 0,
  duration: 0,
};

export type ExportSegment = {
  startSecs: number;
  durationSecs: number;
};

export const EXPORT_SEGMENT_WINDOW_SECS = 30;

export const PLAYBACK_SEEK_STEP_SECS = 5;

export const computeExportSegment = (
  currentTime: number,
  duration: number,
  windowSecs = EXPORT_SEGMENT_WINDOW_SECS,
): ExportSegment => {
  const footageDuration = duration > 0 ? duration : windowSecs;
  const halfWindow = windowSecs / 2;
  let startSecs = Math.max(0, currentTime - halfWindow);

  if (startSecs + windowSecs > footageDuration) {
    startSecs = Math.max(0, footageDuration - windowSecs);
  }

  const availableSecs = Math.max(0.1, footageDuration - startSecs);

  return {
    startSecs,
    durationSecs: Math.min(windowSecs, availableSecs),
  };
};

export const segmentFileSuffix = (segment: ExportSegment) =>
  `${Math.round(segment.durationSecs)}s-at-${Math.round(segment.startSecs)}s`;

export const segmentExportLabel = (segment: ExportSegment) =>
  `${Math.round(segment.durationSecs)}s segment`;
