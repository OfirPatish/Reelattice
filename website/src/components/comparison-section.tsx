import { Check, X } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { COMPARISON } from "@/lib/site-content";

export const ComparisonSection = () => (
  <section id="compare" className="safe-x px-4 py-16 md:px-6 md:py-20">
    <div className="mx-auto max-w-6xl">
      <Reveal className="mb-10 text-center md:mb-12">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">
          // Class Select
        </p>
        <h2 className="font-display mt-3 text-2xl font-black uppercase text-white min-[420px]:text-3xl md:text-4xl">
          Know Your <span className="text-neon-cyan">Build</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
          Reelattice is a local archive for Tesla footage — not a one-off viewer or a full NLE.
        </p>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-2">
        <Reveal delay={80}>
          <div className="h-full border border-cyan-500/25 bg-cyan-500/[0.04] p-5 md:p-6">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-neon-cyan">
              Good for
            </p>
            <ul className="mt-4 space-y-3">
              {COMPARISON.goodFor.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                  <Check className="mt-0.5 size-4 shrink-0 text-cyan-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="h-full border border-slate-700/80 bg-slate-900/20 p-5 md:p-6">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Not designed for
            </p>
            <ul className="mt-4 space-y-3">
              {COMPARISON.notFor.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-400">
                  <X className="mt-0.5 size-4 shrink-0 text-slate-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);
