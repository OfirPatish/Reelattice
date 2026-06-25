import { Download, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { DOWNLOAD_URL, NAV_LINKS } from "@/lib/constants";
import { StatBar } from "@/components/stat-bar";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export const MobileNav = ({ open, onClose }: MobileNavProps) => (
  <>
    <div
      className={cn(
        "fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={onClose}
      aria-hidden={!open}
    />

    <nav
      id="mobile-nav"
      aria-label="Mobile"
      aria-hidden={!open}
      className={cn(
        "safe-x fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-cyan-500/20 bg-[#06080f] shadow-[-16px_0_48px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out md:hidden",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
    >
      <div className="safe-top flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-4">
        <div className="flex items-center gap-2">
          <AppLogo size={28} className="ring-1 ring-cyan-400/30" />
          <span className="font-display text-xs font-bold tracking-wider text-cyan-300">Menu</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className="inline-flex size-10 items-center justify-center border border-slate-700 text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          aria-label="Close menu"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-5">
        <ul className="space-y-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={onClose}
                tabIndex={open ? 0 : -1}
                className="flex min-h-12 items-center border border-transparent px-3 font-display text-sm font-bold uppercase tracking-[0.15em] text-slate-300 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3 border-t border-slate-800 pt-6">
          <StatBar label="Storage" value={100} color="green" />
          <StatBar label="Sync" value={100} color="cyan" />
        </div>
      </div>

      <div className="safe-bottom border-t border-slate-800 px-1 py-4">
        <a
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className="game-btn flex min-h-12 w-full items-center justify-center gap-2 border border-cyan-400/60 bg-cyan-400/10 font-display text-xs font-bold uppercase tracking-wider text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          aria-label="Download Reelattice for Windows"
        >
          <Download className="size-4" aria-hidden />
          Download for Windows
        </a>
      </div>
    </nav>
  </>
);
