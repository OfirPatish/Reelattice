import { Reveal } from "@/components/reveal";
import { FAQ_ITEMS } from "@/lib/site-content";

export const FaqSection = () => (
  <section id="faq" className="safe-x px-4 py-16 md:px-6 md:py-20">
    <div className="mx-auto max-w-3xl">
      <Reveal className="mb-10 text-center">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-fuchsia-400">
          // Mission Briefing
        </p>
        <h2 className="font-display mt-3 text-2xl font-black uppercase text-white min-[420px]:text-3xl md:text-4xl">
          Good to <span className="text-neon-magenta">Know</span>
        </h2>
      </Reveal>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => (
          <Reveal key={item.question} delay={index * 60}>
            <details className="group border border-slate-800 bg-[#0a0e17]/60 open:border-fuchsia-500/30 open:bg-fuchsia-500/[0.03]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-display text-sm font-bold uppercase tracking-wide text-slate-200 marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span
                  className="shrink-0 font-display text-lg text-fuchsia-400/70 transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <div className="border-t border-slate-800/80 px-4 py-4 text-sm leading-relaxed text-slate-400">
                {item.answer}
              </div>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
