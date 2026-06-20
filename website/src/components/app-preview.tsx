import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const EVENTS = [
  { id: "sentry", time: "02:11", source: "SENTRY", threat: "HIGH" },
  { id: "recent", time: "23:42", source: "RECENT", threat: "LOW" },
  { id: "saved", time: "18:03", source: "SAVED", threat: "MID" },
] as const;

const CAMERAS = ["FRONT", "LEFT", "REAR", "RIGHT"] as const;

type ViewMode = "single" | "grid";

const THREAT_COLOR = {
  HIGH: "text-red-400",
  MID: "text-yellow-400",
  LOW: "text-cyan-400",
};

export const AppPreview = () => {
  const reducedMotion = useReducedMotion();
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [autoPlay, setAutoPlay] = useState(true);

  const activeEvent = EVENTS[activeEventIndex];

  const pauseAutoPlay = useCallback(() => {
    setAutoPlay(false);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setAutoPlay(true), 12000);
  }, []);

  const handleSelectEvent = (index: number) => {
    setActiveEventIndex(index);
    setActiveCameraIndex(0);
    pauseAutoPlay();
  };

  const handleSelectCamera = (index: number) => {
    setActiveCameraIndex(index);
    pauseAutoPlay();
  };

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode);
    pauseAutoPlay();
  };

  useEffect(() => {
    if (!autoPlay || reducedMotion) return;
    const t = setInterval(() => {
      setActiveEventIndex((p) => (p + 1) % EVENTS.length);
      setActiveCameraIndex(0);
    }, 4500);
    return () => clearInterval(t);
  }, [autoPlay, reducedMotion]);

  useEffect(() => {
    if (!autoPlay || reducedMotion || viewMode !== "grid") return;
    const t = setInterval(() => {
      setActiveCameraIndex((p) => (p + 1) % CAMERAS.length);
    }, 1100);
    return () => clearInterval(t);
  }, [autoPlay, reducedMotion, viewMode]);

  useEffect(
    () => () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    },
    [],
  );

  return (
    <div
      className="overflow-hidden border border-cyan-500/20 bg-[#06080f]"
      role="img"
      aria-label="Interactive game-style preview of Reelattice"
    >
      <div className="flex items-center justify-between border-b border-cyan-500/20 bg-cyan-950/20 px-3 py-2">
        <span className="font-display text-[9px] font-bold uppercase tracking-widest text-cyan-400">
          ◉ Multi-Cam HUD
        </span>
        <span className="flex items-center gap-1.5 font-display text-[9px] text-red-400">
          <span className="rec-blink size-1.5 bg-red-500" aria-hidden />
          REC
        </span>
      </div>

      <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr]">
        <aside className="border-b border-cyan-500/15 p-2 sm:border-b-0 sm:border-r">
          <p className="mb-2 hidden font-display text-[8px] uppercase tracking-widest text-slate-600 sm:block">
            Events
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:space-y-1 sm:overflow-visible sm:pb-0">
            {EVENTS.map((event, index) => {
              const isActive = index === activeEventIndex;
              return (
                <li key={event.id} className="shrink-0 sm:shrink">
                  <button
                    type="button"
                    onClick={() => handleSelectEvent(index)}
                    className={cn(
                      "min-w-[88px] border px-2 py-1.5 text-left transition-all sm:min-w-0 sm:w-full",
                      isActive
                        ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                        : "border-transparent hover:border-slate-700 hover:bg-slate-900/50",
                    )}
                    aria-pressed={isActive}
                  >
                    <div className="flex justify-between font-mono text-[9px]">
                      <span className="text-slate-300">{event.time}</span>
                      <span className={cn("text-[8px]", THREAT_COLOR[event.threat])}>
                        {event.threat}
                      </span>
                    </div>
                    <p className="mt-0.5 font-display text-[8px] tracking-wider text-slate-500">
                      {event.source}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="p-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-[8px] uppercase tracking-widest text-fuchsia-400 sm:text-[9px]">
              {activeEvent.source} LOCK
            </span>
            <div className="flex font-display text-[8px]" role="group" aria-label="View mode">
              {(["single", "grid"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleToggleView(mode)}
                  className={cn(
                    "border border-slate-700 px-2 py-0.5 uppercase transition-colors",
                    viewMode === mode
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-300"
                      : "text-slate-600 hover:text-slate-400",
                  )}
                  aria-pressed={viewMode === mode}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden border border-slate-800 bg-black">
            <div className="scan-line pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" aria-hidden />

            {viewMode === "grid" ? (
              <div className="grid min-h-[140px] grid-cols-2 grid-rows-2 gap-px bg-slate-800 sm:min-h-[180px]">
                {CAMERAS.map((cam, i) => (
                  <button
                    key={cam}
                    type="button"
                    onClick={() => handleSelectCamera(i)}
                    className={cn(
                      "flex items-end bg-[#0a0e17] p-2 transition-all",
                      i === activeCameraIndex
                        ? "ring-1 ring-inset ring-cyan-400 shadow-[inset_0_0_20px_rgba(0,240,255,0.08)]"
                        : "hover:bg-slate-900",
                    )}
                    aria-pressed={i === activeCameraIndex}
                  >
                    <span
                      className={cn(
                        "font-display text-[8px] tracking-widest",
                        i === activeCameraIndex ? "text-neon-cyan" : "text-slate-600",
                      )}
                    >
                      {cam}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectCamera((activeCameraIndex + 1) % CAMERAS.length)}
                className="flex min-h-[140px] w-full items-center justify-center bg-[#0a0e17] transition-colors hover:bg-slate-900 sm:min-h-[180px]"
              >
                <span className="font-display text-sm font-bold uppercase tracking-widest text-neon-cyan">
                  {CAMERAS[activeCameraIndex]}
                </span>
              </button>
            )}
          </div>

          <div className="mt-2 h-1.5 overflow-hidden border border-slate-800 bg-slate-900" aria-hidden>
            <div
              key={`${activeEvent.id}-${autoPlay}`}
              className={cn(
                "h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-yellow-400",
                autoPlay && !reducedMotion && "progress-scrub",
              )}
              style={!autoPlay || reducedMotion ? { width: "42%" } : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
