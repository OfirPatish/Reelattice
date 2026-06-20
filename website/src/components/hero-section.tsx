import { ChevronRight } from "lucide-react";
import { AppPreview } from "@/components/app-preview";
import { GameButton } from "@/components/game-button";
import { HudFrame } from "@/components/hud-frame";
import { Reveal } from "@/components/reveal";
import { useCycleText } from "@/hooks/use-cycle-text";
import { APP_VERSION, DOWNLOAD_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CYCLE_LINES = [
  "▸ 6 cameras · synced grid playback",
  "▸ Sentry alerts · tagged & archived",
  "▸ 100% offline · zero cloud uploads",
  "▸ Export ZIP or grid MP4 · instantly",
] as const;

const QUICK_STATS = [
  { label: "Cameras", value: "6", color: "text-neon-cyan" },
  { label: "Cloud", value: "0%", color: "text-neon-magenta" },
  { label: "Cost", value: "FREE", color: "text-neon-yellow" },
] as const;

export const HeroSection = () => {
  const { text, visible } = useCycleText(CYCLE_LINES);

  return (
    <section className="relative px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-8">
        <div>
          <Reveal delay={0}>
            <div className="mb-4 inline-flex items-center gap-2 border border-red-500/40 bg-red-500/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
              <span className="rec-blink size-2 rounded-sm bg-red-500" aria-hidden />
              Live · v{APP_VERSION} · Windows
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="glitch-title font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-white min-[420px]:text-4xl md:text-5xl lg:text-6xl">
              Tesla
              <br />
              <span className="text-neon-cyan">Footage</span>
              <br />
              <span className="text-neon-magenta">Loadout</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p
              className={cn(
                "cycle-text mt-5 min-h-[1.75rem] font-display text-sm font-semibold uppercase tracking-wide text-cyan-400/90 md:text-base",
                !visible && "cycle-text-hidden",
              )}
              aria-live="polite"
            >
              {text}
            </p>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
              Import dashcam clips, review every angle in a synced grid, tag incidents,
              export proof — like managing a squad, except the squad is six camera feeds.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-8">
              <GameButton
                href={DOWNLOAD_URL}
                className="w-full sm:w-auto"
                ariaLabel="Start — download Reelattice"
              >
                <ChevronRight className="size-4" aria-hidden />
                New Game
              </GameButton>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
              {QUICK_STATS.map((stat) => (
                <HudFrame key={stat.label} glow="cyan" className="text-center">
                  <div className="px-2 py-3 sm:px-3">
                    <p className={cn("font-display text-lg font-black sm:text-xl md:text-2xl", stat.color)}>
                      {stat.value}
                    </p>
                    <p className="mt-1 font-display text-[9px] uppercase tracking-widest text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                </HudFrame>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={120} direction="left">
          <HudFrame title="Live Preview" glow="magenta" className="float-badge">
            <div className="space-y-3 p-3 md:p-4">
              <AppPreview />
              <p className="text-center font-display text-[9px] uppercase tracking-[0.2em] text-fuchsia-400/70">
                ◎ Interactive — click to play
              </p>
            </div>
          </HudFrame>
        </Reveal>
      </div>
    </section>
  );
};
