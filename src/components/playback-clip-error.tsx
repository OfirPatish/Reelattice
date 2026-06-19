import { ExternalLink, Lock } from "lucide-react";
import { TESLA_DASHCAM_URL } from "@/lib/tesla-encrypted";
import { cn } from "@/lib/utils";

type PlaybackClipErrorProps = {
  className?: string;
};

export const PlaybackClipError = ({ className }: PlaybackClipErrorProps) => (
  <div
    className={cn(
      "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center",
      className,
    )}
    role="status"
  >
    <Lock className="h-8 w-8 text-amber-400/90" aria-hidden />
    <div className="max-w-sm space-y-2">
      <p className="text-sm font-medium text-zinc-200">This clip cannot be played</p>
      <p className="text-xs leading-relaxed text-zinc-500">
        It may still be Tesla-encrypted (2026.20+). Decrypt at{" "}
        <a
          href={TESLA_DASHCAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sky-300 hover:text-sky-200"
        >
          dashcam.tesla.com
        </a>
        , then re-import the decrypted files.
      </p>
      <a
        href={TESLA_DASHCAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 transition hover:text-sky-200"
      >
        Open Tesla Dashcam viewer
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  </div>
);
