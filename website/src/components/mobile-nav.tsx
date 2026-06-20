import { Download } from "lucide-react";
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
        "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden",
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
        "fixed inset-x-0 top-[57px] z-40 border-b border-cyan-500/20 bg-[#06080f]/98 px-4 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 md:hidden",
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
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

      <div className="mt-5 space-y-3 border-t border-slate-800 pt-5">
        <StatBar label="Storage" value={100} color="green" />
        <StatBar label="Sync" value={100} color="cyan" />
      </div>

      <a
        href={DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className="game-btn mt-5 flex min-h-12 w-full items-center justify-center gap-2 border border-cyan-400/60 bg-cyan-400/10 font-display text-xs font-bold uppercase tracking-wider text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
        aria-label="Download Reelattice for Windows"
      >
        <Download className="size-4" aria-hidden />
        Download for Windows
      </a>
    </nav>
  </>
);
