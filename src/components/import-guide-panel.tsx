import { useCallback, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { ImportGuideIllustration } from "@/components/empty-illustrations";
import { CollapseFade } from "@/components/ui/collapse-fade";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "Reelattice-import-guide-open";

const loadGuideOpen = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const saveGuideOpen = (open: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    /* ignore */
  }
};

export const ImportGuidePanel = () => {
  const [open, setOpen] = useState(loadGuideOpen);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      saveGuideOpen(next);
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-controls="import-guide-panel"
        className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-400"
      >
        What can I import?
        <ChevronDown
          className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <CollapseFade show={open} className="w-full">
        <div
          id="import-guide-panel"
          className="mt-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ImportGuideIllustration size="compact" className="mx-auto sm:mx-0 sm:w-44" />
            <ul className="min-w-0 flex-1 space-y-2 text-xs leading-relaxed text-zinc-500">
              <li>TeslaCam USB folder, or RecentClips / SentryClips / SavedClips</li>
              <li>Individual .mp4 files with Tesla naming</li>
              <li className="font-mono text-[10px] text-zinc-600">
                e.g. 2026-06-16_02-11-07-front.mp4
              </li>
            </ul>
          </div>
        </div>
      </CollapseFade>
    </div>
  );
};
