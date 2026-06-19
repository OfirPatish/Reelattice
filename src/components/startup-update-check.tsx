import { useEffect, useState } from "react";
import { getAppSettings } from "@/lib/api";
import { useAppUpdate } from "@/hooks/use-app-update";

type StartupUpdateCheckInnerProps = {
  currentVersion: string;
};

const StartupUpdateCheckInner = ({ currentVersion }: StartupUpdateCheckInnerProps) => {
  useAppUpdate({ currentVersion, checkOnStartup: true });
  return null;
};

export const StartupUpdateCheck = () => {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    void getAppSettings()
      .then((settings) => setCurrentVersion(settings.version))
      .catch(() => setCurrentVersion(null));
  }, []);

  if (!currentVersion) {
    return null;
  }

  return <StartupUpdateCheckInner currentVersion={currentVersion} />;
};
