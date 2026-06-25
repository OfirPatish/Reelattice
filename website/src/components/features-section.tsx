import type { CSSProperties } from "react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

type Skill = {
  name: string;
  desc: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  hotkey: string;
  span?: string;
};

const SKILLS: Skill[] = [
  {
    name: "Event Radar",
    desc: "Search, filter, archive, and scroll huge libraries without lag.",
    rarity: "rare",
    hotkey: "Q",
    span: "md:col-span-2",
  },
  {
    name: "Grid Sync",
    desc: "All cameras. One timeline. Same view you export.",
    rarity: "legendary",
    hotkey: "G",
  },
  {
    name: "USB Drop",
    desc: "Plug in TeslaCam USB for an import prompt, or drop folders and MP4s manually.",
    rarity: "epic",
    hotkey: "I",
  },
  {
    name: "Tag & Case",
    desc: "Tag events, add notes, and bundle incidents into Cases.",
    rarity: "rare",
    hotkey: "T",
  },
  {
    name: "Export Burst",
    desc: "ZIP all cams or render one grid MP4. Trim a 30s segment.",
    rarity: "epic",
    hotkey: "E",
  },
  {
    name: "Offline Shield",
    desc: "Zero cloud. Zero account. Help, changelog, and files stay on your PC.",
    rarity: "legendary",
    hotkey: "∞",
    span: "md:col-span-2",
  },
  {
    name: "Live Patch",
    desc: "Signed installer and in-app updates from Settings — no manual reinstall hunts.",
    rarity: "rare",
    hotkey: "U",
  },
];

const RARITY_LABEL: Record<Skill["rarity"], string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export const FeaturesSection = () => (
  <section id="features" className="safe-x px-4 py-16 md:px-6 md:py-28">
    <div className="mx-auto max-w-6xl">
      <Reveal className="mb-12 text-center md:mb-16">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-fuchsia-400">
          // Ability Tree
        </p>
        <h2 className="font-display mt-3 text-2xl font-black uppercase text-white min-[420px]:text-3xl md:text-4xl">
          Unlock Your <span className="text-neon-cyan">Loadout</span>
        </h2>
      </Reveal>

      <ul className="grid gap-4 md:grid-cols-3">
        {SKILLS.map((skill, index) => (
          <Reveal key={skill.name} as="li" delay={index * 70} className={cn("h-full", skill.span)}>
            <article
              className={cn(
                "group relative h-full border-2 bg-[#0a0e17]/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_var(--rarity-glow)]",
                `rarity-${skill.rarity}`,
              )}
              style={
                {
                  borderColor: "var(--rarity)",
                  "--rarity-glow": `color-mix(in srgb, var(--rarity) 25%, transparent)`,
                } as CSSProperties
              }
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="font-display text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--rarity)" }}
                >
                  {RARITY_LABEL[skill.rarity]}
                </span>
                <kbd className="border border-slate-700 bg-slate-900 px-2 py-0.5 font-display text-[10px] text-slate-400">
                  [{skill.hotkey}]
                </kbd>
              </div>
              <h3
                className="font-display mt-3 text-lg font-bold uppercase tracking-wide text-white"
              >
                {skill.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{skill.desc}</p>
              <div
                className="mt-4 h-1 w-0 transition-all duration-500 group-hover:w-full"
                style={{ backgroundColor: "var(--rarity)" }}
                aria-hidden
              />
            </article>
          </Reveal>
        ))}
      </ul>
    </div>
  </section>
);
