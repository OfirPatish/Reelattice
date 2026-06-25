import { APP_VERSION } from "@/lib/constants";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";
import { GITHUB_REPO_URL } from "@/lib/site-content";

export const SiteFooter = () => (
  <footer className="safe-bottom safe-x border-t border-cyan-500/10 px-4 py-10 md:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/70">
            Credits
          </p>
          <p className="mt-1 text-sm text-slate-500">
            REELATTICE v{APP_VERSION} · Local-first Tesla archive · Open source
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Not affiliated with Tesla, Inc. Tesla and TeslaCam are trademarks of Tesla, Inc.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500 sm:justify-end"
          aria-label="Footer"
        >
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          >
            GitHub
          </a>
          <a
            href="/privacy"
            className="transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          >
            Terms of Use
          </a>
        </nav>
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-600 sm:text-left">
        © {new Date().getFullYear()} Ofir Patish. Provided &quot;as is&quot; without warranty. See
        Terms of Use. Last updated {LEGAL_LAST_UPDATED}.
      </p>
    </div>
  </footer>
);
