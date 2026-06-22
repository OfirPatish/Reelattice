import { ExternalLink, Lock } from "lucide-react";
import { TESLA_DASHCAM_URL } from "@/lib/tesla-encrypted";
import { cn } from "@/lib/utils";

type EncryptedClipsBannerProps = {
  encryptedClipsFound: number;
  encryptedFolderDetected: boolean;
  className?: string;
};

export const EncryptedClipsBanner = ({
  encryptedClipsFound,
  encryptedFolderDetected,
  className,
}: EncryptedClipsBannerProps) => {
  if (encryptedClipsFound === 0 && !encryptedFolderDetected) {
    return null;
  }

  const clipLabel =
    encryptedClipsFound === 1
      ? "1 encrypted clip"
      : `${encryptedClipsFound} encrypted clips`;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3",
        className,
      )}
    >
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <div className="min-w-0 text-sm leading-relaxed text-amber-100/90">
        <p className="font-medium text-amber-100">
          {encryptedClipsFound > 0
            ? `${clipLabel} need decryption first`
            : "Encrypted Tesla footage detected"}
        </p>
        <p className="mt-1 text-xs text-amber-200/75">
          Since Tesla update 2026.20, encrypted clips cannot play in Reelattice until decrypted.
          Reelattice detects files in an <span className="font-medium text-amber-100/90">EncryptedClips</span>{" "}
          folder, and also flags loose MP4s that are not valid video containers. Copy clips to your
          computer, then open Tesla&apos;s official viewer. Decryption runs locally in your browser.
        </p>
        <a
          href={TESLA_DASHCAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 transition hover:text-sky-200"
        >
          Open dashcam.tesla.com
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <p className="mt-2 text-[11px] text-amber-200/60">
          Or disable encryption in the car: Controls → Safety → Encrypt Dashcam Recordings.
        </p>
      </div>
    </div>
  );
};
