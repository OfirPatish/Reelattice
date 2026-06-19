import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AppView } from "@/lib/types";
import { AppShell } from "@/components/layout/app-shell";
import { AppUpdateProvider } from "@/contexts/app-update-context";
import { EventList } from "@/components/event-list";
import { ImportWizard } from "@/components/import-wizard";
import { SettingsView } from "@/components/settings-view";
import { HelpView } from "@/components/help-view";

const App = () => {
  const [view, setView] = useState<AppView>("library");
  const [refreshKey, setRefreshKey] = useState(0);
  const [importSeedPaths, setImportSeedPaths] = useState<string[] | null>(null);

  const handleImportComplete = () => {
    setRefreshKey((k) => k + 1);
    setView("library");
    setImportSeedPaths(null);
  };

  const handleReviewImport = (paths: string[]) => {
    setImportSeedPaths(paths);
    setView("import");
  };

  return (
    <AppUpdateProvider>
      <AppShell activeView={view} onNavigate={setView}>
      <div
        className={cn(
          "min-h-0 flex-1 flex-col",
          view === "library" ? "flex" : "hidden",
        )}
      >
        <EventList
          refreshKey={refreshKey}
          active={view === "library"}
          onNavigate={setView}
          onReviewImport={handleReviewImport}
        />
      </div>
      <div
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
        className={cn(
          "min-h-0 flex-1 flex-col",
          view === "help" ? "flex" : "hidden",
        )}
      >
        <HelpView />
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 flex-col",
          view === "settings" ? "flex" : "hidden",
        )}
      >
        <SettingsView active={view === "settings"} refreshKey={refreshKey} />
      </div>
      </AppShell>
    </AppUpdateProvider>
  );
};

export default App;
