import { Download } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UpdateInstallDialogProps = {
  open: boolean;
  currentVersion: string;
  availableVersion: string;
  highlights: readonly string[];
  releaseNotes?: string | null;
  onInstall: () => void;
  onLater: () => void;
};

export const UpdateInstallDialog = ({
  open,
  currentVersion,
  availableVersion,
  highlights,
  releaseNotes,
  onInstall,
  onLater,
}: UpdateInstallDialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const installRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    installRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onLater();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onLater, open]);

  if (!open) {
    return null;
  }

  const showReleaseNotes =
    releaseNotes &&
    releaseNotes.trim().length > 0 &&
    !highlights.some((item) => releaseNotes.includes(item.slice(0, 24)));

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={onLater}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-zinc-800/80 px-6 py-5">
          <h2 id={titleId} className="text-base font-semibold text-zinc-100">
            Update available
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-zinc-500">
            A new version of Reelattice is ready to install.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-xs tabular-nums text-zinc-400 ring-1 ring-inset ring-zinc-700/80">
              v{currentVersion}
            </span>
            <span className="text-xs text-zinc-600" aria-hidden>
              →
            </span>
            <span className="rounded-md bg-sky-500/15 px-2.5 py-1 text-xs font-medium tabular-nums text-sky-300 ring-1 ring-inset ring-sky-500/30">
              v{availableVersion}
            </span>
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto px-6 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            What&apos;s new
          </p>
          {highlights.length > 0 ? (
            <ul className="mt-2.5 space-y-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed text-zinc-300"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400/80" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Bug fixes and improvements in this release.
            </p>
          )}

          {showReleaseNotes && (
            <p
              className={cn(
                "mt-3 text-xs leading-relaxed text-zinc-500",
                highlights.length > 0 && "border-t border-zinc-800/80 pt-3",
              )}
            >
              {releaseNotes}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-800/80 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onLater}>
            Later
          </Button>
          <Button
            ref={installRef}
            type="button"
            size="sm"
            className="bg-sky-600 text-white hover:bg-sky-500"
            onClick={onInstall}
          >
            <Download className="h-4 w-4" aria-hidden />
            Install v{availableVersion}
          </Button>
        </div>

        <p className="border-t border-zinc-800/60 px-6 py-2.5 text-[11px] text-zinc-600">
          Download and install progress appears in a full-screen overlay. The app restarts when
          finished.
        </p>
      </div>
    </div>
  );
};
