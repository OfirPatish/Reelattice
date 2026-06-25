import { Reveal } from "@/components/reveal";
import { HudFrame } from "@/components/hud-frame";
import { cn } from "@/lib/utils";

const QUESTS = [
  {
    level: "LVL 1",
    title: "Import Run",
    objective: "Drop TeslaCam USB, browse folders, or pick MP4s — clips copy locally",
    reward: "+500 XP",
    color: "cyan" as const,
  },
  {
    level: "LVL 2",
    title: "Grid Review",
    objective: "Open an event · scrub all cameras · tag, note, or add to a Case",
    reward: "+750 XP",
    color: "magenta" as const,
  },
  {
    level: "LVL 3",
    title: "Export Boss",
    objective: "ZIP or grid MP4 · scissors trim · share proof with others",
    reward: "Trophy",
    color: "yellow" as const,
  },
] as const;

const glowMap = { cyan: "cyan", magenta: "magenta", yellow: "yellow" } as const;

const stepAccent = {
  cyan: "border-cyan-400 text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.2)]",
  magenta: "border-fuchsia-400 text-neon-magenta shadow-[0_0_12px_rgba(255,0,170,0.2)]",
  yellow: "border-yellow-400 text-neon-yellow shadow-[0_0_12px_rgba(255,230,0,0.2)]",
} as const;

export const WorkflowSection = () => (
  <section id="workflow" className="safe-x px-4 py-16 md:px-6 md:py-28">
    <div className="mx-auto max-w-6xl">
      <Reveal className="mb-10 text-center md:mb-12">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-400">
          // Campaign Mode
        </p>
        <h2 className="font-display mt-3 text-2xl font-black uppercase text-white min-[420px]:text-3xl md:text-4xl">
          Main <span className="text-neon-yellow">Quest Line</span>
        </h2>
      </Reveal>

      <ol className="relative grid list-none gap-8 md:grid-cols-3 md:items-stretch md:gap-4">
        <div
          aria-hidden
          className="absolute bottom-10 left-[1.125rem] top-10 w-0.5 bg-gradient-to-b from-cyan-500 via-fuchsia-500 to-yellow-400 md:hidden"
        />

        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-12 hidden h-0.5 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-yellow-400 md:block"
        />

        {QUESTS.map((quest, index) => (
          <Reveal key={quest.level} as="li" delay={index * 120} className="relative h-full md:pl-0">
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-6 z-10 flex size-9 items-center justify-center border-2 bg-[#06080f] font-display text-xs font-black md:hidden",
                stepAccent[quest.color],
              )}
            >
              {index + 1}
            </span>

            <div className="pl-12 md:pl-0">
              <HudFrame glow={glowMap[quest.color]} title={quest.level} className="flex h-full flex-col">
                <div className="flex min-h-[10rem] flex-1 flex-col p-5 sm:min-h-[11.5rem]">
                  <h3 className="font-display text-base font-bold uppercase tracking-wide text-white">
                    {quest.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{quest.objective}</p>
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
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);
