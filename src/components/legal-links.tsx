import { ExternalLink, Scale } from "lucide-react";
import { accentSoftCardClass } from "@/lib/accent-tones";
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from "@/lib/website";
import { cn } from "@/lib/utils";

export const LegalLinks = () => (
  <div className={cn("px-4 py-3", accentSoftCardClass("sky"))}>
    <div className="flex gap-3">
      <Scale className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
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
            className="inline-flex items-center gap-1 text-sky-300/90 transition-colors hover:text-sky-200"
          >
            Privacy Policy
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
          </a>
          <span className="text-zinc-700" aria-hidden>·</span>
          <a
            href={LEGAL_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-300/90 transition-colors hover:text-sky-200"
          >
            Terms of Use
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  </div>
);
