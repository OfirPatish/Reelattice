import { Download, Menu, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { MobileNav } from "@/components/mobile-nav";
import { DOWNLOAD_URL, NAV_LINKS } from "@/lib/constants";
import { StatBar } from "@/components/stat-bar";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";

export const SiteHeader = () => {
  const scrolled = useScrolled(20);
  const { open, close, toggle } = useMobileMenu();

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          open || scrolled
            ? "border-cyan-500/20 bg-[#06080f]/95 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-4 md:px-6">
          <a
            href="#"
            className="group flex min-w-0 shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
            aria-label="Reelattice home"
          >
            <AppLogo size={32} className="ring-2 ring-cyan-400/40 transition-transform group-hover:scale-110" />
            <span className="font-display truncate text-sm font-bold tracking-wider text-cyan-300">
              REELATTICE
            </span>
          </a>

          <div className="hidden min-w-0 flex-1 gap-3 lg:flex">
            <StatBar label="Storage" value={100} color="green" className="max-w-[140px]" />
            <StatBar label="Sync" value={100} color="cyan" className="max-w-[140px]" />
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex size-10 items-center justify-center border border-slate-700 bg-slate-900/50 text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>

            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="game-btn inline-flex shrink-0 items-center gap-2 border border-cyan-400/60 bg-cyan-400/10 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
              aria-label="Download Reelattice"
            >
              <Download className="size-3.5" aria-hidden />
              <span className="hidden min-[420px]:inline">Download</span>
            </a>
          </div>
        </div>
      </header>

      <MobileNav open={open} onClose={close} />
    </>
  );
};
