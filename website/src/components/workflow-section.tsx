import { Reveal } from "@/components/reveal";
import { HudFrame } from "@/components/hud-frame";
import { cn } from "@/lib/utils";

const QUESTS = [
  {
    level: "LVL 1",
    title: "Import Run",
    objective: "Connect TeslaCam USB · scan folders · copy clips locally",
    reward: "+500 XP",
    color: "cyan" as const,
  },
  {
    level: "LVL 2",
    title: "Grid Review",
    objective: "Open event · scrub all cameras · tag & annotate",
    reward: "+750 XP",
    color: "magenta" as const,
  },
  {
    level: "LVL 3",
    title: "Export Boss",
    objective: "ZIP or grid MP4 · trim segment · share proof",
    reward: "Trophy",
    color: "yellow" as const,
  },
] as const;

const glowMap = { cyan: "cyan", magenta: "magenta", yellow: "yellow" } as const;

export const WorkflowSection = () => (
  <section id="workflow" className="px-4 py-20 md:px-6 md:py-28">
    <div className="mx-auto max-w-6xl">
      <Reveal className="mb-12 text-center">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-400">
          // Campaign Mode
        </p>
        <h2 className="font-display mt-3 text-2xl font-black uppercase text-white min-[420px]:text-3xl md:text-4xl">
          Main <span className="text-neon-yellow">Quest Line</span>
        </h2>
      </Reveal>

      <ol className="relative grid gap-6 md:grid-cols-3 md:gap-4">
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-12 hidden h-0.5 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-yellow-400 md:block"
        />

        {QUESTS.map((quest, index) => (
          <Reveal key={quest.level} as="li" delay={index * 120}>
            <HudFrame glow={glowMap[quest.color]} title={quest.level}>
              <div className="p-5">
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
                  {quest.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{quest.objective}</p>
                <p
                  className={cn(
                    "mt-4 font-display text-[10px] font-bold uppercase tracking-widest",
                    quest.color === "cyan" && "text-neon-cyan",
                    quest.color === "magenta" && "text-neon-magenta",
                    quest.color === "yellow" && "text-neon-yellow",
                  )}
                >
                  Reward: {quest.reward}
                </p>
              </div>
            </HudFrame>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);
