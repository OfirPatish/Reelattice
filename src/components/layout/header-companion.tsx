import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import type { AppView } from "@/lib/types";
import { cn } from "@/lib/utils";

type HeaderCompanionProps = {
  activeView: AppView;
};

const PET_WIDTH = 40;
const PATROL_BASE_SECS = 9;
const TOOLTIP_Z_INDEX = 10050;

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

const VIEW_ACCENT: Record<AppView, { shell: string; eye: string; leg: string; glow: string }> =
  {
    library: {
      shell: "from-zinc-700 to-zinc-900 ring-sky-400/45",
      eye: "bg-sky-300 shadow-[0_0_4px_rgba(56,189,248,0.8)]",
      leg: "bg-sky-400",
      glow: "shadow-[0_0_12px_rgba(56,189,248,0.35)]",
    },
    import: {
      shell: "from-zinc-700 to-zinc-900 ring-amber-400/45",
      eye: "bg-amber-200 shadow-[0_0_4px_rgba(251,191,36,0.7)]",
      leg: "bg-amber-400",
      glow: "shadow-[0_0_12px_rgba(251,191,36,0.28)]",
    },
    cases: {
      shell: "from-zinc-700 to-zinc-900 ring-violet-400/45",
      eye: "bg-violet-200 shadow-[0_0_4px_rgba(167,139,250,0.7)]",
      leg: "bg-violet-400",
      glow: "shadow-[0_0_12px_rgba(167,139,250,0.28)]",
    },
    help: {
      shell: "from-zinc-700 to-zinc-900 ring-zinc-400/40",
      eye: "bg-zinc-100 shadow-[0_0_3px_rgba(255,255,255,0.35)]",
      leg: "bg-zinc-400",
      glow: "shadow-[0_0_10px_rgba(161,161,170,0.2)]",
    },
    changelog: {
      shell: "from-zinc-700 to-zinc-900 ring-emerald-400/45",
      eye: "bg-emerald-200 shadow-[0_0_4px_rgba(52,211,153,0.7)]",
      leg: "bg-emerald-400",
      glow: "shadow-[0_0_12px_rgba(52,211,153,0.28)]",
    },
    settings: {
      shell: "from-zinc-700 to-zinc-900 ring-teal-400/45",
      eye: "bg-teal-200 shadow-[0_0_4px_rgba(45,212,191,0.7)]",
      leg: "bg-teal-400",
      glow: "shadow-[0_0_12px_rgba(45,212,191,0.28)]",
    },
  };

const ReelPetSprite = ({
  facingRight,
  accent,
  walking,
}: {
  facingRight: boolean;
  accent: (typeof VIEW_ACCENT)[AppView];
  walking: boolean;
}) => (
  <div className={cn("relative h-7 w-10", facingRight ? "" : "-scale-x-100")}>
    <div className={cn("relative h-full w-full", walking && "companion-walk-bob")}>
      <span
        className="absolute -top-px left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-[1px] bg-red-500 companion-rec-dot"
        aria-hidden
      />

      <span
        className={cn(
          "absolute inset-x-0.5 top-1.5 bottom-1.5 rounded-md bg-gradient-to-b ring-1 ring-inset",
          accent.shell,
          accent.glow,
        )}
        aria-hidden
      >
        <span className="absolute inset-x-2 top-1.5 flex justify-between">
          <span className={cn("h-1.5 w-1.5 rounded-[1px]", accent.eye)} />
          <span className={cn("h-1.5 w-1.5 rounded-[1px]", accent.eye)} />
        </span>
        <span className="absolute inset-x-2.5 bottom-1.5 h-1.5 rounded-full bg-zinc-950/80 ring-1 ring-inset ring-white/10" />
      </span>

      <span
        className={cn(
          "absolute bottom-0 left-1.5 h-2 w-1.5 rounded-b-sm",
          accent.leg,
          walking && "companion-leg-left",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "absolute bottom-0 right-1.5 h-2 w-1.5 rounded-b-sm",
          accent.leg,
          walking && "companion-leg-right",
        )}
        aria-hidden
      />
    </div>
  </div>
);

type TooltipAnchor = {
  x: number;
  y: number;
};

export const HeaderCompanion = ({ activeView }: HeaderCompanionProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const patrolCancelRef = useRef(false);
  const prevXRef = useRef(0);

  const [maxX, setMaxX] = useState(120);
  const [lineIndex, setLineIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipAnchor | null>(null);

  const reduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const x = useMotionValue(0);

  const lines = COMPANION_LINES[activeView];
  const accent = VIEW_ACCENT[activeView];

  const syncTooltipAnchor = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setTooltipAnchor({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
  }, []);

  useMotionValueEvent(x, "change", (latest) => {
    const delta = latest - prevXRef.current;
    if (Math.abs(delta) > 0.35) {
      setFacingRight(delta > 0);
    }
    prevXRef.current = latest;
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateBounds = () => {
      const nextMaxX = Math.max(24, track.clientWidth - PET_WIDTH);
      setMaxX(nextMaxX);

      const currentX = x.get();
      if (currentX > nextMaxX) {
        controls.set({ x: nextMaxX });
      }
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(track);
    return () => observer.disconnect();
  }, [controls, x]);

  useEffect(() => {
    setLineIndex(0);
    setOpen(false);
    setPaused(false);
    setTooltipAnchor(null);
  }, [activeView]);

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    if (reduceMotion) {
      patrolCancelRef.current = true;
      controls.stop();
      controls.set({ x: maxX / 2 });
      return;
    }

    if (paused || maxX <= 8) {
      patrolCancelRef.current = true;
      controls.stop();
      return;
    }

    patrolCancelRef.current = false;
    let goingRight = x.get() <= maxX / 2;

    const patrol = async () => {
      while (!patrolCancelRef.current) {
        const target = goingRight ? maxX : 0;
        await controls.start({
          x: target,
          transition: {
            duration: PATROL_BASE_SECS + maxX / 100,
            ease: "easeInOut",
          },
        });

        if (patrolCancelRef.current) return;

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 380);
        });

        goingRight = !goingRight;
      }
    };

    void patrol();

    return () => {
      patrolCancelRef.current = true;
      controls.stop();
    };
  }, [controls, maxX, paused, reduceMotion, x]);

  const handleClick = () => {
    patrolCancelRef.current = true;
    controls.stop();

    setLineIndex((current) => (current + 1) % lines.length);
    setOpen(true);
    setPaused(true);
    syncTooltipAnchor();

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      setTooltipAnchor(null);
      setPaused(false);
    }, 2800);
  };

  const walking = !reduceMotion && !paused;

  const tooltip =
    open && tooltipAnchor
      ? createPortal(
          <AnimatePresence>
            <motion.div
              key={`${activeView}-${lineIndex}`}
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 520, damping: 32 }}
              role="status"
              aria-live="polite"
              className="pointer-events-none w-max max-w-[15rem] rounded-lg border border-zinc-600/90 bg-zinc-900/98 px-3 py-2 text-left font-mono text-[11px] leading-snug tracking-tight text-zinc-100 shadow-xl shadow-black/60 backdrop-blur-sm"
              style={{
                position: "fixed",
                left: tooltipAnchor.x,
                top: tooltipAnchor.y,
                transform: "translateX(-50%)",
                zIndex: TOOLTIP_Z_INDEX,
              }}
            >
              <span className="mb-1 block text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Reel
              </span>
              {lines[lineIndex]}
              <span
                className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-zinc-600/90 bg-zinc-900/98"
                aria-hidden
              />
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={trackRef} className="relative min-h-0 min-w-[7rem] flex-1 self-stretch">
        <div
          className="pointer-events-none absolute inset-x-4 bottom-2.5 h-px bg-gradient-to-r from-transparent via-zinc-700/90 to-transparent"
          aria-hidden
        />

        <motion.button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          aria-label="Reel, your dashcam buddy. Click for a hint."
          aria-expanded={open}
          className="absolute bottom-1 left-0 z-[2] outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
          animate={controls}
          style={{ x }}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        >
          <ReelPetSprite facingRight={facingRight} accent={accent} walking={walking} />
        </motion.button>
      </div>

      {tooltip}
    </>
  );
};
