import { APP_VERSION } from "@/lib/constants";

export const SiteFooter = () => (
  <footer className="border-t border-cyan-500/10 px-4 py-10 md:px-6">
    <div className="mx-auto max-w-6xl text-center sm:text-left">
      <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/70">
        Credits
      </p>
      <p className="mt-1 text-sm text-slate-500">
        REELATTICE v{APP_VERSION} · Local-first Tesla archive
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Not affiliated with Tesla, Inc. Tesla and TeslaCam are trademarks of Tesla, Inc.
      </p>
    </div>
  </footer>
);
