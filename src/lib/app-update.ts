import { relaunch } from "@tauri-apps/plugin-process";
import { formatFileSize } from "@/lib/format";
import { showConfirm } from "@/lib/show-confirm";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";

/** How long transient statuses stay visible in the header before hiding. */
export const UPDATE_STATUS_VISIBLE_MS = 8_000;

const DISMISSED_VERSION_KEY = "reelattice.dismissed-update-version";

export type AppUpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "up-to-date"
  | "downloading"
  | "installing"
  | "error";

export type AppDownloadProgress = {
  percent: number | null;
  downloadedBytes: number;
  totalBytes: number | null;
  etaSeconds: number | null;
};

export type AppUpdateState = {
  status: AppUpdateStatus;
  currentVersion: string;
  availableVersion: string | null;
  releaseNotes: string | null;
  downloadPercent: number | null;
  downloadedBytes: number;
  totalBytes: number | null;
  etaSeconds: number | null;
  errorMessage: string | null;
};

export const initialAppUpdateState = (currentVersion: string): AppUpdateState => ({
  status: "idle",
  currentVersion,
  availableVersion: null,
  releaseNotes: null,
  downloadPercent: null,
  downloadedBytes: 0,
  totalBytes: null,
  etaSeconds: null,
  errorMessage: null,
});

export const isUpdaterEnabled = () => import.meta.env.PROD;

const getDismissedVersion = () => localStorage.getItem(DISMISSED_VERSION_KEY);

export const dismissUpdateVersion = (version: string) => {
  localStorage.setItem(DISMISSED_VERSION_KEY, version);
};

export const clearDismissedUpdateVersion = () => {
  localStorage.removeItem(DISMISSED_VERSION_KEY);
};

const formatDownloadPercent = (downloaded: number, total: number | undefined) => {
  if (!total || total <= 0) {
    return null;
  }

  return Math.min(100, Math.round((downloaded / total) * 100));
};

const estimateEtaSeconds = (
  downloaded: number,
  total: number | undefined,
  startedAt: number,
) => {
  if (!total || total <= 0 || downloaded <= 0) return null;

  const elapsedSecs = (Date.now() - startedAt) / 1000;
  if (elapsedSecs < 1) return null;

  const bytesPerSec = downloaded / elapsedSecs;
  if (bytesPerSec <= 0) return null;

  return Math.max(0, Math.round((total - downloaded) / bytesPerSec));
};

const createDownloadHandler = (onProgress: (progress: AppDownloadProgress) => void) => {
  let downloaded = 0;
  let total: number | undefined;
  let startedAt = Date.now();

  const emit = () => {
    onProgress({
      percent: formatDownloadPercent(downloaded, total),
      downloadedBytes: downloaded,
      totalBytes: total ?? null,
      etaSeconds: estimateEtaSeconds(downloaded, total, startedAt),
    });
  };

  return (event: DownloadEvent) => {
    if (event.event === "Started") {
      downloaded = 0;
      total = event.data.contentLength;
      startedAt = Date.now();
      emit();
      return;
    }

    if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
      emit();
      return;
    }

    if (event.event === "Finished") {
      onProgress({
        percent: 100,
        downloadedBytes: total ?? downloaded,
        totalBytes: total ?? downloaded,
        etaSeconds: 0,
      });
    }
  };
};

export const formatDownloadProgressDetail = (state: AppUpdateState) => {
  if (state.totalBytes && state.totalBytes > 0) {
    const sizeLine = `${formatFileSize(state.downloadedBytes)} / ${formatFileSize(state.totalBytes)}`;
    if (state.etaSeconds !== null && state.etaSeconds > 0) {
      const minutes = Math.floor(state.etaSeconds / 60);
      const seconds = state.etaSeconds % 60;
      const etaLabel =
        minutes > 0 ? `~${minutes}m ${seconds}s left` : `~${seconds}s left`;
      return `${sizeLine} · ${etaLabel}`;
    }

    return sizeLine;
  }

  if (state.downloadedBytes > 0) {
    return `${formatFileSize(state.downloadedBytes)} downloaded`;
  }

  return null;
};

export const checkForAppUpdate = async (): Promise<Update | null> => {
  if (!isUpdaterEnabled()) {
    return null;
  }

  return check();
};

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

export type AppUpdateInstallPhase = "downloading" | "installing";

export const isUpdateOverlayVisible = (status: AppUpdateStatus) =>
  status === "downloading" || status === "installing";

export const installAppUpdate = async (
  update: Update,
  onProgress: (progress: AppDownloadProgress) => void,
  onPhaseChange?: (phase: AppUpdateInstallPhase) => void,
) => {
  onPhaseChange?.("downloading");
  await update.download(createDownloadHandler(onProgress));

  onProgress({
    percent: 100,
    downloadedBytes: 0,
    totalBytes: null,
    etaSeconds: 0,
  });
  onPhaseChange?.("installing");
  await waitForNextPaint();

  await update.install();
  await update.close();
  await relaunch();
};

export const promptStartupUpdate = async (
  update: Update,
  currentVersion: string,
): Promise<boolean> => {
  if (getDismissedVersion() === update.version) {
    return false;
  }

  const notes = update.body?.trim();
  const description = notes
    ? `Reelattice ${update.version} is available (you have ${currentVersion}).\n\n${notes}`
    : `Reelattice ${update.version} is available (you have ${currentVersion}). Install now?`;

  const accepted = await showConfirm({
    title: "Update available",
    description,
    confirmLabel: "Install",
    cancelLabel: "Later",
    variant: "accent",
  });

  if (!accepted) {
    dismissUpdateVersion(update.version);
  }

  return accepted;
};

export const formatUpdateError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not check for updates. Try again from Settings.";
};
