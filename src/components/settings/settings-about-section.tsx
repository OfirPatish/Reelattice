import { Shield } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AppUpdatePanel } from "@/components/settings/app-update-panel";
import { LegalLinks } from "@/components/legal-links";
import type { AppUpdateState } from "@/lib/app-update";

type SettingsAboutSectionProps = {
  version?: string;
  loading?: boolean;
  updateState: AppUpdateState;
  onCheck: () => void;
  onInstall: () => void;
};

export const SettingsAboutSection = ({
  version,
  loading,
  updateState,
  onCheck,
  onInstall,
}: SettingsAboutSectionProps) => (
  <div className="p-5">
    <div className="grid gap-5 lg:grid-cols-[minmax(0,14rem)_1fr] lg:items-start xl:grid-cols-[minmax(0,16rem)_1fr]">
      <div className="flex items-center gap-3">
        <AppLogo size={44} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Reelattice</p>
          <p className="text-xs tabular-nums text-zinc-500">
            Version {loading ? "…" : version}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">
            Tesla dashcam & Sentry organizer
          </p>
        </div>
      </div>

      <AppUpdatePanel state={updateState} onCheck={onCheck} onInstall={onInstall} />
    </div>

    <div className="mt-5 flex flex-col gap-3 border-t border-zinc-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" aria-hidden />
        <span>Local-first. Footage and metadata stay on your machine.</span>
      </p>
      <LegalLinks variant="inline" />
    </div>
  </div>
);
