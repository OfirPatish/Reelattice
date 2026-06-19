import { confirm } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";

export const GITHUB_REPO = "OfirPatish/Reelattice";
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;

const DISMISSED_VERSION_KEY = "reelattice.dismissed-update-version";

export type AppUpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "up-to-date"
  | "downloading"
  | "installing"
  | "error";

export type AppUpdateState = {
  status: AppUpdateStatus;
  currentVersion: string;
  availableVersion: string | null;
  releaseNotes: string | null;
  downloadPercent: number | null;
  errorMessage: string | null;
};

export const initialAppUpdateState = (currentVersion: string): AppUpdateState => ({
  status: "idle",
  currentVersion,
  availableVersion: null,
  releaseNotes: null,
  downloadPercent: null,
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

const createDownloadHandler = (onProgress: (percent: number | null) => void) => {
  let downloaded = 0;
  let total: number | undefined;

  return (event: DownloadEvent) => {
    if (event.event === "Started") {
      downloaded = 0;
      total = event.data.contentLength;
      onProgress(formatDownloadPercent(0, total));
      return;
    }

    if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
      onProgress(formatDownloadPercent(downloaded, total));
      return;
    }

    if (event.event === "Finished") {
      onProgress(100);
    }
  };
};

export const checkForAppUpdate = async (): Promise<Update | null> => {
  if (!isUpdaterEnabled()) {
    return null;
  }

  return check();
};

export const installAppUpdate = async (
  update: Update,
  onProgress: (percent: number | null) => void,
) => {
  await update.downloadAndInstall(createDownloadHandler(onProgress));
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
  const detail = notes ? `\n\n${notes}` : "";
  const accepted = await confirm(
    `Reelattice ${update.version} is available (you have ${currentVersion}). Install now?${detail}`,
    { title: "Update available", kind: "info", okLabel: "Install", cancelLabel: "Later" },
  );

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
