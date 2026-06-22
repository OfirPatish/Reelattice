import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppUpdateOverlay } from "@/components/app-update-overlay";
import { UpdateInstallDialog } from "@/components/settings/update-install-dialog";
import { useAppUpdate } from "@/hooks/use-app-update";
import { getAppSettings } from "@/lib/api";
import { getChangelogHighlights } from "@/lib/changelog";
import type { AppUpdateState } from "@/lib/app-update";

type AppUpdateContextValue = {
  ready: boolean;
  state: AppUpdateState;
  checkForUpdate: () => Promise<unknown>;
  installUpdate: () => Promise<void>;
};

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

type AppUpdateProviderProps = {
  children: ReactNode;
};

export const AppUpdateProvider = ({ children }: AppUpdateProviderProps) => {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    void getAppSettings()
      .then((settings) => setCurrentVersion(settings.version))
      .catch(() => setCurrentVersion(null));
  }, []);

  const {
    state,
    checkForUpdate,
    installUpdate,
    installPrompt,
    confirmInstall,
    dismissInstall,
  } = useAppUpdate({
    currentVersion: currentVersion ?? "0.0.0",
    checkOnStartup: currentVersion !== null,
  });

  return (
    <AppUpdateContext.Provider
      value={{
        ready: currentVersion !== null,
        state,
        checkForUpdate,
        installUpdate,
      }}
    >
      {children}
      {installPrompt && currentVersion ? (
        <UpdateInstallDialog
          open
          currentVersion={currentVersion}
          availableVersion={installPrompt.availableVersion}
          highlights={getChangelogHighlights(installPrompt.availableVersion)}
          releaseNotes={installPrompt.releaseNotes}
          onInstall={confirmInstall}
          onLater={dismissInstall}
        />
      ) : null}
      <AppUpdateOverlay state={state} />
    </AppUpdateContext.Provider>
  );
};

export const useAppUpdateContext = () => {
  const context = useContext(AppUpdateContext);
  if (!context) {
    throw new Error("useAppUpdateContext must be used within AppUpdateProvider");
  }

  return context;
};
