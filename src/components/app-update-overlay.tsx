import { Loader2 } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { isUpdateOverlayVisible, type AppUpdateState } from "@/lib/app-update";

type AppUpdateOverlayProps = {
  state: AppUpdateState;
};

const overlayTitle = (state: AppUpdateState) => {
  if (state.status === "installing") {
    return "Installing update…";
  }

  if (state.downloadPercent === null) {
    return "Downloading update…";
  }

  return `Downloading update… ${state.downloadPercent}%`;
};

const overlayDetail = (state: AppUpdateState) => {
  if (state.status === "installing") {
    return "Reelattice will restart automatically when the update is ready.";
  }

  if (state.availableVersion) {
    return `Updating to version ${state.availableVersion}`;
  }

  return "Fetching the latest release…";
};

export const AppUpdateOverlay = ({ state }: AppUpdateOverlayProps) => {
  if (!isUpdateOverlayVisible(state.status)) {
    return null;
  }

  const showDeterminateProgress =
    state.status === "downloading" && state.downloadPercent !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-update-overlay-title"
      aria-describedby="app-update-overlay-detail"
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/90 px-6 py-8 shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center text-center">
          <AppLogo size={48} className="mb-4" />
          <p id="app-update-overlay-title" className="text-base font-medium text-zinc-100">
            {overlayTitle(state)}
          </p>
          <p id="app-update-overlay-detail" className="mt-1.5 text-sm text-zinc-500">
            {overlayDetail(state)}
          </p>
        </div>

        <div className="mt-6">
          {showDeterminateProgress ? (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
              role="progressbar"
              aria-valuenow={state.downloadPercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Download progress"
            >
              <div
                className="h-full rounded-full bg-sky-400 transition-[width] duration-200"
                style={{ width: `${state.downloadPercent}%` }}
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-2 text-sm text-zinc-400"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" aria-hidden />
              <span>{state.status === "installing" ? "Applying update" : "Preparing download"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
