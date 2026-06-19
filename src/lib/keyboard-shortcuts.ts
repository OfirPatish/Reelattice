export type KeyboardShortcut = {
  description: string;
  keyGroups: string[][];
};

/** Library view — ignored while typing in a text field. */
export const LIBRARY_SHORTCUTS: KeyboardShortcut[] = [
  { description: "Focus search", keyGroups: [["/"]] },
  { description: "Next / previous event", keyGroups: [["j", "k"], ["↑", "↓"]] },
  { description: "Select all (bulk mode)", keyGroups: [["a"]] },
  { description: "Range select (bulk mode)", keyGroups: [["Shift", "click"]] },
  { description: "Delete selected event(s)", keyGroups: [["Delete"]] },
  { description: "Exit bulk selection", keyGroups: [["Esc"]] },
];

/** Event playback — when an event is open; not in notes/search fields. */
export const getPlaybackShortcuts = (seekStepSecs: number): KeyboardShortcut[] => [
  { description: `Skip back ${seekStepSecs} seconds`, keyGroups: [["←"]] },
  { description: `Skip forward ${seekStepSecs} seconds`, keyGroups: [["→"]] },
  { description: "Play / pause", keyGroups: [["Space"]] },
];

/** @deprecated Use getPlaybackShortcuts with the user's seek step preference. */
export const PLAYBACK_SHORTCUTS: KeyboardShortcut[] = getPlaybackShortcuts(5);

export const ALL_SHORTCUTS: KeyboardShortcut[] = [
  ...LIBRARY_SHORTCUTS,
  ...getPlaybackShortcuts(5),
];
