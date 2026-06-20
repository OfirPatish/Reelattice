import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

type LegalDocumentLayoutProps = {
  title: string;
  children: ReactNode;
};

export const LegalDocumentLayout = ({ title, children }: LegalDocumentLayoutProps) => (
  <div className="relative min-h-screen overflow-x-hidden bg-[#06080f] text-slate-200">
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,240,255,0.06),transparent)]"
    />
    <header className="border-b border-cyan-500/10 bg-[#06080f]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <a
          href="/"
          className="group flex items-center gap-2 text-slate-400 transition-colors hover:text-cyan-300"
        >
          <AppLogo size={28} className="ring-1 ring-cyan-400/30" />
          <span className="font-display text-xs font-bold tracking-wider text-cyan-300/90">REELATTICE</span>
        </a>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 transition-colors hover:text-cyan-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Home
        </a>
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated {LEGAL_LAST_UPDATED}</p>
      <article className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-slate-400">
        {children}
      </article>
    </main>

    <SiteFooter />
  </div>
);
