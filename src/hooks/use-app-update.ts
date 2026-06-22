import { useCallback, useEffect, useRef, useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  checkForAppUpdate,
  dismissUpdateVersion,
  formatUpdateError,
  initialAppUpdateState,
  installAppUpdate,
  isUpdaterEnabled,
  shouldSkipStartupUpdatePrompt,
  UPDATE_STATUS_VISIBLE_MS,
  type AppDownloadProgress,
  type AppUpdateState,
} from "@/lib/app-update";

type UseAppUpdateOptions = {
  currentVersion: string;
  checkOnStartup?: boolean;
};

type InstallPromptState = {
  update: Update;
  dismissOnLater: boolean;
  resolve: (accepted: boolean) => void;
};

export const useAppUpdate = ({ currentVersion, checkOnStartup = false }: UseAppUpdateOptions) => {
  const [state, setState] = useState<AppUpdateState>(() => initialAppUpdateState(currentVersion));
  const [installPrompt, setInstallPrompt] = useState<InstallPromptState | null>(null);

  const pendingUpdateRef = useRef<Update | null>(null);
  const startupCheckedRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setState((prev) => ({ ...prev, currentVersion }));
  }, [currentVersion]);

  useEffect(
    () => () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    },
    [],
  );

  const scheduleReturnToIdle = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = window.setTimeout(() => {
      setState((prev) => {
        if (
          prev.status !== "up-to-date" &&
          prev.status !== "error" &&
          prev.status !== "checking"
        ) {
          return prev;
        }

        return { ...prev, status: "idle" };
      });
      idleTimerRef.current = null;
    }, UPDATE_STATUS_VISIBLE_MS);
  }, []);

  const runInstall = useCallback(async (update: Update | null = pendingUpdateRef.current) => {
    if (!update) {
      return;
    }

    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      status: "downloading",
      downloadPercent: 0,
      downloadedBytes: 0,
      totalBytes: null,
      etaSeconds: null,
      errorMessage: null,
    }));

    try {
      await installAppUpdate(
        update,
        (progress: AppDownloadProgress) => {
          setState((prev) => ({
            ...prev,
            status: "downloading",
            downloadPercent: progress.percent,
            downloadedBytes: progress.downloadedBytes,
            totalBytes: progress.totalBytes,
            etaSeconds: progress.etaSeconds,
          }));
        },
        (phase) => {
          setState((prev) => ({
            ...prev,
            status: phase,
            downloadPercent: phase === "installing" ? 100 : prev.downloadPercent,
            etaSeconds: phase === "installing" ? 0 : prev.etaSeconds,
          }));
        },
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: formatUpdateError(error),
      }));
      scheduleReturnToIdle();
    }
  }, [scheduleReturnToIdle]);

  const promptInstall = useCallback(
    (update: Update, options?: { dismissOnLater?: boolean }) =>
      new Promise<boolean>((resolve) => {
        setInstallPrompt({
          update,
          dismissOnLater: options?.dismissOnLater ?? false,
          resolve,
        });
      }),
    [],
  );

  const closeInstallPrompt = useCallback((accepted: boolean) => {
    setInstallPrompt((current) => {
      if (!current) return null;

      if (!accepted && current.dismissOnLater) {
        dismissUpdateVersion(current.update.version);
      }

      current.resolve(accepted);
      return null;
    });
  }, []);

  const installUpdate = useCallback(async () => {
    const update = pendingUpdateRef.current;
    if (!update) {
      return;
    }

    const accepted = await promptInstall(update);
    if (accepted) {
      await runInstall(update);
    }
  }, [promptInstall, runInstall]);

  const runCheck = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!isUpdaterEnabled()) {
        setState((prev) => ({
          ...prev,
          status: "up-to-date",
          availableVersion: null,
          releaseNotes: null,
          downloadPercent: null,
          downloadedBytes: 0,
          totalBytes: null,
          etaSeconds: null,
          errorMessage: null,
        }));
        scheduleReturnToIdle();
        return null;
      }

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        status: "checking",
        errorMessage: null,
        downloadPercent: null,
      }));

      try {
        const update = await checkForAppUpdate();
        pendingUpdateRef.current = update;

        if (!update) {
          setState((prev) => ({
            ...prev,
            status: "up-to-date",
            availableVersion: null,
            releaseNotes: null,
          }));
          scheduleReturnToIdle();
          return null;
        }

        setState((prev) => ({
          ...prev,
          status: "available",
          availableVersion: update.version,
          releaseNotes: update.body?.trim() || null,
        }));

        if (options?.silent && checkOnStartup) {
          if (shouldSkipStartupUpdatePrompt(update.version)) {
            return update;
          }

          const shouldInstall = await promptInstall(update, { dismissOnLater: true });
          if (shouldInstall) {
            await runInstall(update);
          }
        }

        return update;
      } catch (error) {
        pendingUpdateRef.current = null;
        setState((prev) => ({
          ...prev,
          status: options?.silent ? "idle" : "error",
          availableVersion: null,
          releaseNotes: null,
          errorMessage: formatUpdateError(error),
        }));
        if (!options?.silent) {
          scheduleReturnToIdle();
        }
        return null;
      }
    },
    [checkOnStartup, promptInstall, runInstall, scheduleReturnToIdle],
  );

  useEffect(() => {
    if (!checkOnStartup || startupCheckedRef.current || !isUpdaterEnabled()) {
      return;
    }

    if (!currentVersion || currentVersion === "0.0.0") {
      return;
    }

    startupCheckedRef.current = true;
    void runCheck({ silent: true });
  }, [checkOnStartup, currentVersion, runCheck]);

  return {
    state,
    checkForUpdate: () => runCheck(),
    installUpdate,
    installPrompt: installPrompt
      ? {
          availableVersion: installPrompt.update.version,
          releaseNotes: installPrompt.update.body?.trim() || state.releaseNotes,
        }
      : null,
    confirmInstall: () => closeInstallPrompt(true),
    dismissInstall: () => closeInstallPrompt(false),
  };
};
