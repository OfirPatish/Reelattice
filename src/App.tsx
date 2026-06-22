import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AppView } from "@/lib/types";
import { scrollAppViewToTop } from "@/lib/scroll-app-view";
import { AppShell } from "@/components/layout/app-shell";
import { AppUpdateProvider } from "@/contexts/app-update-context";
import { ConfirmProvider } from "@/contexts/confirm-context";
import { TeslaCamDrivePrompt } from "@/components/tesla-cam-drive-prompt";
import { CasesView } from "@/components/cases-view";
import { EventList } from "@/components/event-list";
import { ImportWizard } from "@/components/import-wizard";
import { SettingsView } from "@/components/settings-view";
import { HelpView } from "@/components/help-view";
import { ChangelogView } from "@/components/changelog-view";

const App = () => {
  const [view, setView] = useState<AppView>("library");
  const [refreshKey, setRefreshKey] = useState(0);
  const [importSeedPaths, setImportSeedPaths] = useState<string[] | null>(null);
  const [openEventId, setOpenEventId] = useState<string | null>(null);

  const handleImportComplete = () => {
    setRefreshKey((k) => k + 1);
    setView("library");
    setImportSeedPaths(null);
  };

  const handleReviewImport = (paths: string[]) => {
    setImportSeedPaths(paths);
    setView("import");
  };

  const handleOpenEventFromCase = (eventId: string) => {
    setOpenEventId(eventId);
    setView("library");
  };

  useEffect(() => {
    scrollAppViewToTop(view);
  }, [view]);

  const handleImportDrive = (mountPath: string) => {
    setImportSeedPaths([mountPath]);
    setView("import");
  };

  return (
    <ConfirmProvider>
    <AppUpdateProvider>
      <TeslaCamDrivePrompt onImportDrive={handleImportDrive} />
      <AppShell activeView={view} onNavigate={setView}>
        <div
          data-app-view="library"
          className={cn(
            "min-h-0 flex-1 flex-col",
            view === "library" ? "flex" : "hidden",
          )}
        >
          <EventList
            refreshKey={refreshKey}
            active={view === "library"}
            openEventId={openEventId}
            onOpenEventConsumed={() => setOpenEventId(null)}
            onNavigate={setView}
            onReviewImport={handleReviewImport}
          />
        </div>
        <div
          data-app-view="import"
          className={cn(
            "min-h-0 flex-1 flex-col",
            view === "import" ? "flex" : "hidden",
          )}
        >
          <ImportWizard
            active={view === "import"}
            seedPaths={importSeedPaths}
            onSeedPathsConsumed={() => setImportSeedPaths(null)}
            onImportComplete={handleImportComplete}
          />
        </div>
        <div
          data-app-view="cases"
          className={cn(
            "min-h-0 flex-1 flex-col",
            view === "cases" ? "flex" : "hidden",
          )}
        >
          <CasesView
            active={view === "cases"}
            refreshKey={refreshKey}
            onOpenEvent={handleOpenEventFromCase}
          />
        </div>
        <div
          data-app-view="help"
          className={cn(
            "min-h-0 flex-1 flex-col",
            view === "help" ? "flex" : "hidden",
          )}
        >
          <HelpView />
        </div>
        <div
          data-app-view="changelog"
          className={cn(
            "min-h-0 flex-1 flex-col",
            view === "changelog" ? "flex" : "hidden",
          )}
        >
          <ChangelogView />
        </div>
        <div
          data-app-view="settings"
          className={cn(
            "min-h-0 flex-1 flex-col",
            view === "settings" ? "flex" : "hidden",
          )}
        >
          <SettingsView active={view === "settings"} refreshKey={refreshKey} />
        </div>
      </AppShell>
    </AppUpdateProvider>
    </ConfirmProvider>
  );
};

export default App;
