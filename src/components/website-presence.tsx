import { ExternalLink, Globe } from "lucide-react";
import { WEBSITE_HOST, WEBSITE_URL } from "@/lib/website";
import { cn } from "@/lib/utils";

type WebsitePresenceProps = {
  className?: string;
};

/** Single persistent website entry — fixed corner chip on every view. */
export const WebsitePresence = ({ className }: WebsitePresenceProps) => (
  <a
    href={WEBSITE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "website-presence group fixed bottom-3 right-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-950/90 px-2.5 py-1.5 text-[11px] text-zinc-500 shadow-lg shadow-black/40 backdrop-blur-sm transition-colors hover:border-cyan-500/35 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40",
      className,
    )}
    aria-label={`Visit ${WEBSITE_HOST}`}
  >
    <span className="website-presence-ring pointer-events-none absolute inset-0 rounded-full" aria-hidden />
    <Globe
      className="relative z-[1] h-3.5 w-3.5 shrink-0 text-cyan-500/70 transition-colors group-hover:text-cyan-400/90"
      aria-hidden
    />
    <span className="relative z-[1] hidden max-w-[9rem] truncate sm:inline">{WEBSITE_HOST}</span>
    <ExternalLink
      className="relative z-[1] h-3 w-3 shrink-0 opacity-40 transition-opacity group-hover:opacity-70"
      aria-hidden
    />
  </a>
);
