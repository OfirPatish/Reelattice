import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { AppView } from "@/lib/types";
import { cn } from "@/lib/utils";

type HeaderCompanionProps = {
  activeView: AppView;
};

const BUBBLE_HIDE_MS = 2800;

const COMPANION_LINES: Record<AppView, readonly string[]> = {
  library: [
    "Quest log: pick an event from the list.",
    "Hotkeys j/k — speedrun the timeline.",
    "Grid mode: all six cameras, one boss fight.",
  ],
  import: [
    "Loot drop: drag TeslaCam folders here.",
    "Recent, Sentry, Saved — I read the labels.",
  ],
  cases: [
    "Party up: bundle events into one case.",
    "Bulk select → Add to case from Library.",
  ],
  help: [
    "Strategy guide unlocked. You're prepared.",
    "Full manual — no walkthrough spoilers.",
  ],
  changelog: [
    "Patch notes loaded. Meta shifted?",
    "New build detected. Check the highlights.",
  ],
  settings: [
    "Stat screen — all local, no cloud save.",
    "Storage, playback, updates — tune here.",
  ],
};

const VIEW_ACCENT: Record<AppView, { ring: string; core: string; glow: string }> = {
  library: {
    ring: "ring-sky-500/40",
    core: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.75)]",
    glow: "shadow-[0_0_14px_rgba(56,189,248,0.35)]",
  },
  import: {
    ring: "ring-amber-500/40",
    core: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.28)]",
  },
  cases: {
    ring: "ring-violet-500/40",
    core: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.65)]",
    glow: "shadow-[0_0_12px_rgba(167,139,250,0.28)]",
  },
  help: {
    ring: "ring-zinc-500/35",
    core: "bg-zinc-200 shadow-[0_0_6px_rgba(255,255,255,0.35)]",
    glow: "shadow-[0_0_10px_rgba(161,161,170,0.2)]",
  },
  changelog: {
    ring: "ring-emerald-500/40",
    core: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.28)]",
  },
  settings: {
    ring: "ring-teal-500/40",
    core: "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.65)]",
    glow: "shadow-[0_0_12px_rgba(45,212,191,0.28)]",
  },
};

const HEX_CLIP =
  "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

const ReelOrb = ({
  accent,
  active,
}: {
  accent: (typeof VIEW_ACCENT)[AppView];
  active: boolean;
}) => (
  <div className="relative flex h-8 w-8 items-center justify-center">
    <span
      className={cn(
        "absolute inset-0 bg-gradient-to-b from-zinc-600/90 to-zinc-900 ring-1 ring-inset transition-shadow duration-300",
        accent.ring,
        accent.glow,
        active && "companion-hex-pulse",
      )}
      style={{ clipPath: HEX_CLIP }}
      aria-hidden
    />
    <span
      className="absolute inset-[5px] bg-zinc-950/95"
      style={{ clipPath: HEX_CLIP }}
      aria-hidden
    />
    <span
      className={cn("relative h-2 w-2 rounded-full", accent.core)}
      aria-hidden
    />
    <span
      className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-500 companion-rec-dot"
      aria-hidden
    />
  </div>
);

export const HeaderCompanion = ({ activeView }: HeaderCompanionProps) => {
  const hideTimeoutRef = useRef<number | null>(null);

  const [lineIndex, setLineIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const reduceMotion = useReducedMotion();
  const lines = COMPANION_LINES[activeView];
  const accent = VIEW_ACCENT[activeView];

  useEffect(() => {
    setLineIndex(0);
    setOpen(false);
  }, [activeView]);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    },
    [],
  );

  const handleClick = () => {
    setLineIndex((current) => (current + 1) % lines.length);
    setOpen(true);

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, BUBBLE_HIDE_MS);
  };

  return (
    <div
      className={cn(
        "relative flex h-14 shrink-0 items-center overflow-visible",
        open && "z-40",
      )}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            key={`${activeView}-${lineIndex}`}
            initial={{ opacity: 0, x: 12, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 520, damping: 32 }}
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute right-full top-1/2 z-50 mr-2.5 w-max max-w-[min(18rem,calc(100vw-14rem))] -translate-y-1/2 rounded-lg border border-zinc-600/90 bg-zinc-900/98 px-3 py-2 text-left font-mono text-[11px] leading-snug tracking-tight text-zinc-100 shadow-xl shadow-black/60 backdrop-blur-sm"
          >
            <span className="mb-1 block text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Reel
            </span>
            {lines[lineIndex]}
            <span
              className="absolute -right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-r border-t border-zinc-600/90 bg-zinc-900/98"
              aria-hidden
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleClick}
        aria-label="Reel, your dashcam buddy. Click for a hint."
        aria-expanded={open}
        className="inline-flex h-14 w-11 shrink-0 items-center justify-center border-r border-zinc-800/80 text-zinc-400 outline-none transition-colors hover:bg-zinc-900/80 focus-visible:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500/40"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -1, 0],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
      >
        <ReelOrb accent={accent} active={open} />
      </motion.button>
    </div>
  );
};
