import { useCallback, useEffect, useRef, useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  checkForAppUpdate,
  formatUpdateError,
  initialAppUpdateState,
  installAppUpdate,
  isUpdaterEnabled,
  promptStartupUpdate,
  UPDATE_STATUS_VISIBLE_MS,
  type AppUpdateState,
} from "@/lib/app-update";

type UseAppUpdateOptions = {
  currentVersion: string;
  checkOnStartup?: boolean;
};

export const useAppUpdate = ({ currentVersion, checkOnStartup = false }: UseAppUpdateOptions) => {
  const [state, setState] = useState<AppUpdateState>(() => initialAppUpdateState(currentVersion));
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
      errorMessage: null,
    }));

    try {
      await installAppUpdate(update, (downloadPercent) => {
        setState((prev) => ({
          ...prev,
          status: downloadPercent === 100 ? "installing" : "downloading",
          downloadPercent,
        }));
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: formatUpdateError(error),
      }));
      scheduleReturnToIdle();
    }
  }, [scheduleReturnToIdle]);

  const runCheck = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!isUpdaterEnabled()) {
        setState((prev) => ({
          ...prev,
          status: "up-to-date",
          availableVersion: null,
          releaseNotes: null,
          downloadPercent: null,
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
          const shouldInstall = await promptStartupUpdate(update, currentVersion);
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
    [checkOnStartup, currentVersion, runInstall, scheduleReturnToIdle],
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
    installUpdate: () => runInstall(),
  };
};
