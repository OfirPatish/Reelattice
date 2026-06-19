import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAppSettings } from "@/lib/api";
import { useAppUpdate } from "@/hooks/use-app-update";
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

  const { state, checkForUpdate, installUpdate } = useAppUpdate({
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
