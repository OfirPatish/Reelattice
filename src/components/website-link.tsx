import { ExternalLink, Globe } from "lucide-react";
import { WEBSITE_HOST, WEBSITE_URL } from "@/lib/website";
import { cn } from "@/lib/utils";

type WebsiteLinkProps = {
  className?: string;
  showIcon?: boolean;
};

export const WebsiteLink = ({ className, showIcon = true }: WebsiteLinkProps) => (
  <a
    href={WEBSITE_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300",
      className,
    )}
    aria-label={`Open ${WEBSITE_HOST} in your browser`}
  >
    {showIcon ? <Globe className="h-3 w-3 shrink-0 opacity-60" aria-hidden /> : null}
    <span>{WEBSITE_HOST}</span>
    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
  </a>
);
