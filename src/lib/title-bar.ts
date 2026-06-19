import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent as ReactMouseEvent } from "react";

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("button, a, input, textarea, select, [data-no-drag], [data-tauri-drag-region='false']"),
  );
};

export const handleTitleBarMouseDown = (event: ReactMouseEvent<HTMLElement>) => {
  if (!isTauri() || event.button !== 0) return;
  if (isInteractiveTarget(event.target)) return;

  event.preventDefault();

  if (event.detail === 2) {
    void getCurrentWindow().toggleMaximize();
    return;
  }

  void getCurrentWindow().startDragging();
};

export const stopTitleBarMouseDown = (event: ReactMouseEvent<HTMLElement>) => {
  event.stopPropagation();
};
