import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Maximize2, Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { stopTitleBarMouseDown } from "@/lib/title-bar";
import { cn } from "@/lib/utils";

const controlBaseClass =
  "inline-flex h-14 w-11 items-center justify-center text-zinc-400 transition-colors outline-none hover:bg-zinc-800 hover:text-zinc-100 focus-visible:bg-zinc-800 focus-visible:text-zinc-100";

export const WindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;

    const appWindow = getCurrentWindow();
    let unlistenResize: (() => void) | undefined;

    const syncMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };

    void syncMaximized();
    void appWindow.onResized(() => {
      void syncMaximized();
    }).then((unlisten) => {
      unlistenResize = unlisten;
    });

    return () => {
      unlistenResize?.();
    };
  }, []);

  if (!isTauri()) {
    return null;
  }

  const handleMinimize = () => {
    void getCurrentWindow().minimize();
  };

  const handleToggleMaximize = () => {
    void getCurrentWindow().toggleMaximize();
  };

  const handleClose = () => {
    void getCurrentWindow().close();
  };

  return (
    <div
      className="flex shrink-0 items-stretch"
      role="group"
      aria-label="Window controls"
      data-no-drag
      onMouseDown={stopTitleBarMouseDown}
    >
      <button
        type="button"
        onClick={handleMinimize}
        aria-label="Minimize window"
        className={controlBaseClass}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>

      <button
        type="button"
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
        className={controlBaseClass}
      >
        {isMaximized ? (
          <Square className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Close window"
        className={cn(
          controlBaseClass,
          "hover:bg-red-600 hover:text-white focus-visible:bg-red-600 focus-visible:text-white",
        )}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
};
