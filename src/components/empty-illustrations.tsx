import { cn } from "@/lib/utils";

type IllustrationProps = {
  className?: string;
  size?: "default" | "compact";
};

const sizeClass = (size: IllustrationProps["size"]) =>
  size === "compact" ? "h-24 w-24" : "h-44 w-44";

/** Left-panel timeline waiting for events. */
export const TimelineIdleIllustration = ({
  className,
  size = "default",
}: IllustrationProps) => (
  <div
    className={cn("relative flex items-center justify-center", sizeClass(size), className)}
    aria-hidden
  >
    <div className="absolute inset-x-4 top-8 space-y-2.5">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-700 timeline-dot" />
          <span
            className="h-2 flex-1 rounded-full bg-zinc-800 timeline-bar"
            style={{ animationDelay: `${index * 0.18}s` }}
          />
        </div>
      ))}
    </div>
    <div className="absolute inset-x-6 bottom-6 h-px bg-zinc-800" />
  </div>
);

/** Filter/search lane with no matches. */
export const FilterEmptyIllustration = ({
  className,
  size = "default",
}: IllustrationProps) => (
  <div
    className={cn("flex items-center justify-center", sizeClass(size), className)}
    aria-hidden
  >
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex w-16 flex-col items-center">
        <div className="h-8 w-16 rounded-t-lg border border-zinc-700 bg-zinc-900/90" />
        <div className="h-0 w-0 border-x-[2rem] border-t-[1.75rem] border-x-transparent border-t-zinc-700/80" />
        <div className="absolute left-1/2 top-2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-sky-500/60 filter-sweep" />
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-zinc-600 filter-dot"
            style={{ animationDelay: `${index * 0.35}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

/** Archived events shelf. */
export const ArchiveEmptyIllustration = ({
  className,
  size = "default",
}: IllustrationProps) => (
  <div
    className={cn("relative flex items-end justify-center", sizeClass(size), className)}
    aria-hidden
  >
    <div className="absolute inset-x-7 bottom-10 h-16 rounded-md border border-zinc-700 bg-zinc-900/95 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-x-2 top-2 h-5 rounded-sm border border-zinc-700/80 bg-zinc-800/80 archive-lid" />
      <div className="absolute inset-x-3 bottom-3 flex gap-1">
        <span className="h-5 flex-1 rounded-sm bg-zinc-800/60" />
        <span className="h-5 flex-1 rounded-sm bg-zinc-800/40" />
      </div>
    </div>
    <div className="absolute bottom-6 h-1 w-20 rounded-full bg-zinc-800 archive-shadow" />
  </div>
);

/** Bulk select — waiting for checkbox picks. */
export const BulkSelectIllustration = ({
  className,
  size = "default",
}: IllustrationProps) => (
  <div
    className={cn("flex items-center justify-center", sizeClass(size), className)}
    aria-hidden
  >
    <div className="flex w-full max-w-[7.5rem] flex-col gap-2.5">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-2.5">
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-600 bg-zinc-900 bulk-check"
            style={{ animationDelay: `${index * 0.22}s` }}
          >
            <span className="h-1.5 w-2 rotate-[-45deg] translate-y-[-0.5px] border-b border-l border-sky-400/80 bulk-check-mark" />
          </span>
          <span
            className="h-2 flex-1 rounded-full bg-zinc-800 bulk-check-bar"
            style={{ animationDelay: `${index * 0.22}s` }}
          />
        </div>
      ))}
    </div>
  </div>
);

/** Import drop zone — floating file cue. */
export const ImportDropIllustration = ({
  className,
  size = "default",
}: IllustrationProps) => (
  <div
    className={cn("relative flex items-center justify-center", sizeClass(size), className)}
    aria-hidden
  >
    <div className="absolute inset-x-6 top-6 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 import-zone">
      <div className="mx-auto mt-5 h-10 w-8 rounded-sm border border-zinc-600 bg-zinc-800/80 import-file">
        <div className="mx-1.5 mt-2 space-y-1">
          <span className="block h-0.5 rounded-full bg-zinc-600" />
          <span className="block h-0.5 w-2/3 rounded-full bg-zinc-600" />
        </div>
      </div>
      <div className="mx-auto mt-2 h-0 w-0 border-x-[0.4rem] border-t-[0.55rem] border-x-transparent border-t-sky-500/70 import-arrow" />
    </div>
  </div>
);
