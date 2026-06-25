import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { DOWNLOAD_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const StickyMobileCta = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const download = document.getElementById("download");
    if (!download) return;

    const onScroll = () => {
      const pastHero = window.scrollY > 420;
      const downloadTop = download.getBoundingClientRect().top;
      const downloadNear = downloadTop < window.innerHeight * 0.85;
      setVisible(pastHero && !downloadNear);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 border-t border-cyan-500/20 bg-[#06080f]/95 p-3 backdrop-blur-md transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <a
        href={DOWNLOAD_URL}
        tabIndex={visible ? 0 : -1}
        className="game-btn flex min-h-12 w-full items-center justify-center gap-2 border border-cyan-400/60 bg-cyan-400/10 font-display text-xs font-bold uppercase tracking-wider text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
        aria-label="Download Reelattice for Windows"
      >
        <Download className="size-4" aria-hidden />
        Download for Windows
      </a>
    </div>
  );
};
