import { Download, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { GITHUB_RELEASES_URL } from "@/lib/app-update";
import type { AppUpdateState } from "@/lib/app-update";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppUpdatePanelProps = {
  state: AppUpdateState;
  onCheck: () => void;
  onInstall: () => void;
};

const statusLabel = (state: AppUpdateState) => {
  switch (state.status) {
    case "checking":
      return "Checking for updates…";
    case "available":
      return `Update ${state.availableVersion} is available`;
    case "up-to-date":
      return "You're on the latest version";
    case "downloading":
      return state.downloadPercent === null
        ? "Downloading update…"
        : `Downloading update… ${state.downloadPercent}%`;
    case "installing":
      return "Installing update…";
    case "error":
      return state.errorMessage ?? "Update check failed";
    default:
      return "Check GitHub for new releases";
  }
};

export const AppUpdatePanel = ({ state, onCheck, onInstall }: AppUpdatePanelProps) => {
  const busy =
    state.status === "checking" ||
    state.status === "downloading" ||
    state.status === "installing";

  const canInstall = state.status === "available" && !busy;

  const handleOpenReleases = () => {
    void openUrl(GITHUB_RELEASES_URL);
  };

  return (
    <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-zinc-300">Software updates</p>
          <p
            className={cn(
              "text-xs",
              state.status === "error" ? "text-rose-400" : "text-zinc-500",
            )}
          >
            {statusLabel(state)}
          </p>
          {state.releaseNotes && state.status === "available" && (
            <p className="pt-1 text-xs leading-relaxed text-zinc-500">{state.releaseNotes}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCheck}
            disabled={busy}
            aria-label="Check for updates"
          >
            {state.status === "checking" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Check for updates
          </Button>

          {canInstall && (
            <Button type="button" size="sm" onClick={onInstall} aria-label="Install update">
              <Download className="h-4 w-4" aria-hidden />
              Install {state.availableVersion}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenReleases}
            aria-label="Open GitHub releases page"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            GitHub
          </Button>
        </div>
      </div>

      {state.status === "downloading" && state.downloadPercent !== null && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800"
          role="progressbar"
          aria-valuenow={state.downloadPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Download progress"
        >
          <div
            className="h-full rounded-full bg-sky-400 transition-[width] duration-200"
            style={{ width: `${state.downloadPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
