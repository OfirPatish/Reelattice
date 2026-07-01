import { ExternalLink, Scale } from "lucide-react";
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from "@/lib/website";

type LegalLinksProps = {
  variant?: "card" | "inline";
};

export const LegalLinks = ({ variant = "card" }: LegalLinksProps) => {
  if (variant === "inline") {
    return (
      <nav
        aria-label="Legal"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
      >
        <span className="flex items-center gap-1.5 text-zinc-600">
          <Scale className="h-3 w-3" aria-hidden />
          Legal
        </span>
        <a
          href={LEGAL_PRIVACY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-200"
        >
          Privacy Policy
          <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
        </a>
        <a
          href={LEGAL_TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-200"
        >
          Terms of Use
          <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
        </a>
      </nav>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/30 px-4 py-3">
      <div className="flex gap-3">
        <Scale className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-300">Legal</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Privacy policy, terms of use, and liability disclaimers for the app and website.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <a
              href={LEGAL_PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Privacy Policy
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
            </a>
            <span className="text-zinc-700" aria-hidden>
              ·
            </span>
            <a
              href={LEGAL_TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Terms of Use
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
