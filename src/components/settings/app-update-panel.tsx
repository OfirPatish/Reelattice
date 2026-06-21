import { Download, Loader2, RefreshCw } from "lucide-react";
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
      return `Version ${state.availableVersion} is available`;
    case "up-to-date":
      return "You're on the latest version";
    case "downloading":
      return state.downloadPercent === null
        ? "Downloading update…"
        : `Downloading… ${state.downloadPercent}%`;
    case "installing":
      return "Installing update…";
    case "error":
      return state.errorMessage ?? "Update check failed";
    default:
      return "Check for new releases anytime";
  }
};

export const AppUpdatePanel = ({ state, onCheck, onInstall }: AppUpdatePanelProps) => {
  const busy =
    state.status === "checking" ||
    state.status === "downloading" ||
    state.status === "installing";

  const canInstall = state.status === "available" && !busy;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 px-4 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-zinc-200">Software updates</p>
          <p
            className={cn(
              "text-xs leading-relaxed",
              state.status === "error" ? "text-rose-400" : "text-zinc-500",
            )}
          >
            {statusLabel(state)}
          </p>
          {state.releaseNotes && state.status === "available" && (
            <p className="text-xs leading-relaxed text-zinc-600">{state.releaseNotes}</p>
          )}
          {(state.status === "downloading" || state.status === "installing") && (
            <p className="text-[11px] text-zinc-600">
              Progress appears in the full-screen update overlay.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
        </div>
      </div>
    </div>
  );
};
