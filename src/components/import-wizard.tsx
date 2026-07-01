import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { showConfirm } from "@/lib/show-confirm";
import {
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ImportPickPanel } from "@/components/import-pick-panel";
import { ImportPreviewPanel } from "@/components/import-preview-panel";
import { EncryptedClipsBanner } from "@/components/encrypted-clips-banner";
import {
  cancelImport,
  scanImportPaths,
  startImportTeslaEvents,
  waitForImportCompletion,
} from "@/lib/api";
import type { ImportJobStatus } from "@/lib/types";
import {
  applyBulkUnrecognizedSource,
  applyImportSources,
  getSharedUnrecognizedSource,
  hasUnrecognizedImportSource,
  syncUnrecognizedSourceOverrides,
} from "@/lib/import-source";
import type { DetectedEvent, EventSource } from "@/lib/types";
import { hasEncryptedScanHits, type EncryptedScanInfo } from "@/lib/tesla-encrypted";
import { Button } from "@/components/ui/button";

type ImportWizardProps = {
  active?: boolean;
  onImportComplete: () => void;
  seedPaths?: string[] | null;
  onSeedPathsConsumed?: () => void;
};

type Step = "pick" | "preview";

const normalizeImportPaths = (paths: string[]) =>
  [...new Set(paths.map((path) => path.trim()).filter(Boolean))];

const filterMp4Paths = (paths: string[]) =>
  normalizeImportPaths(paths).filter((path) => path.toLowerCase().endsWith(".mp4"));

export const ImportWizard = ({
  active = true,
  onImportComplete,
  seedPaths,
  onSeedPathsConsumed,
}: ImportWizardProps) => {
  const [step, setStep] = useState<Step>("pick");
  const [detected, setDetected] = useState<DetectedEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportJobStatus | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [scanPaths, setScanPaths] = useState<string[]>([]);
  const [sourceOverrides, setSourceOverrides] = useState<Record<string, EventSource>>({});
  const [encryptedScan, setEncryptedScan] = useState<EncryptedScanInfo | null>(null);
  const scanGenerationRef = useRef(0);
  const scanPathsRef = useRef<string[]>([]);
  const handleImportPathsRef = useRef<
    (paths: string[], merge?: boolean) => Promise<void>
  >(async () => undefined);
  const seedScanKeyRef = useRef<string | null>(null);

  useEffect(() => {
    scanPathsRef.current = scanPaths;
  }, [scanPaths]);

  const showPreview = step === "preview" && detected.length > 0;

  const newEventCount = useMemo(
    () => detected.filter((event) => !event.alreadyImported).length,
    [detected],
  );

  const importedEventCount = detected.length - newEventCount;

  const allAlreadyInLibrary = detected.length > 0 && newEventCount === 0;
  const hasMixedImportResults = importedEventCount > 0 && newEventCount > 0;

  const selectionSummary = useMemo(() => {
    const selected = detected.filter((event) => selectedEvents.has(event.folderPath));
    const cameraCount = selected.reduce((total, event) => total + event.clips.length, 0);
    return { events: selected.length, cameras: cameraCount };
  }, [detected, selectedEvents]);

  const showSourcePicker = useMemo(
    () => hasUnrecognizedImportSource(detected),
    [detected],
  );

  const bulkUnrecognizedSource = useMemo(
    () => getSharedUnrecognizedSource(detected, sourceOverrides),
    [detected, sourceOverrides],
  );

  useEffect(() => {
    setSourceOverrides((prev) => syncUnrecognizedSourceOverrides(detected, prev));
  }, [detected]);

  const handleBulkUnrecognizedSourceChange = (source: EventSource) => {
    setSourceOverrides((prev) => applyBulkUnrecognizedSource(detected, prev, source));
  };

  const applyDetected = useCallback((events: DetectedEvent[], merge = false) => {
    setDetected(events);
    setSelectedEvents((prev) => {
      if (!merge) {
        return new Set(
          events.filter((event) => !event.alreadyImported).map((event) => event.folderPath),
        );
      }

      const eventKeys = new Set(events.map((event) => event.folderPath));
      const next = new Set([...prev].filter((folderPath) => eventKeys.has(folderPath)));

      for (const event of events) {
        if (!event.alreadyImported) {
          next.add(event.folderPath);
        }
      }

      return next;
    });
    setStep("preview");
  }, []);

  const handleImportPaths = useCallback(
    async (paths: string[], merge = false) => {
      const normalizedPaths = normalizeImportPaths(paths);

      if (normalizedPaths.length === 0) {
        setError("Select Tesla clip files or folders to continue.");
        return;
      }

      const nextScanPaths = merge
        ? normalizeImportPaths([...scanPathsRef.current, ...normalizedPaths])
        : normalizedPaths;

      const scanGeneration = ++scanGenerationRef.current;

      if (!merge) {
        setStep("pick");
        setDetected([]);
        setSelectedEvents(new Set());
        setScanPaths([]);
      }

      setLoading(true);

      try {
        const scanResult = await scanImportPaths(nextScanPaths);
        if (scanGeneration !== scanGenerationRef.current) return;

        const events = scanResult.events;

        setEncryptedScan({
          encryptedClipsFound: scanResult.encryptedClipsFound,
          encryptedFolderDetected: scanResult.encryptedFolderDetected,
        });

        if (events.length === 0) {
          if (
            hasEncryptedScanHits({
              encryptedClipsFound: scanResult.encryptedClipsFound,
              encryptedFolderDetected: scanResult.encryptedFolderDetected,
            })
          ) {
            setError(
              "Only encrypted or unreadable Tesla clips were found. Decrypt at dashcam.tesla.com first, then import the downloaded files.",
            );
          } else if (merge) {
            setError("No Tesla clips found in the folder you added. Previous scan results are unchanged.");
          } else {
            setError(
              "No Tesla clips found. Filenames should look like 2026-06-16_02-11-07-front.mp4.",
            );
          }

          if (!merge) {
            setScanPaths([]);
            setDetected([]);
            setSelectedEvents(new Set());
            setStep("pick");
            if (
              !hasEncryptedScanHits({
                encryptedClipsFound: scanResult.encryptedClipsFound,
                encryptedFolderDetected: scanResult.encryptedFolderDetected,
              })
            ) {
              setEncryptedScan(null);
            }
          }
          return;
        }

        setScanPaths(nextScanPaths);
        scanPathsRef.current = nextScanPaths;
        setError("");
        applyDetected(events, merge);
      } catch (err) {
        if (scanGeneration !== scanGenerationRef.current) return;
        setError(String(err));
        if (!merge) {
          setStep("pick");
        }
      } finally {
        if (scanGeneration === scanGenerationRef.current) {
          setLoading(false);
          setDragOver(false);
        }
      }
    },
    [applyDetected],
  );

  useEffect(() => {
    handleImportPathsRef.current = handleImportPaths;
  }, [handleImportPaths]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void getCurrentWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setDragOver(true);
          return;
        }

        if (event.payload.type === "leave") {
          setDragOver(false);
          return;
        }

        if (event.payload.type === "drop") {
          void handleImportPaths(
            event.payload.paths,
            step === "preview",
          );
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, [handleImportPaths, step]);

  useEffect(() => {
    if (!active || !seedPaths?.length) return;

    const key = seedPaths.join("\0");
    if (seedScanKeyRef.current === key) return;
    seedScanKeyRef.current = key;

    void handleImportPathsRef.current(seedPaths, false).finally(() => {
      seedScanKeyRef.current = null;
      onSeedPathsConsumed?.();
    });
  }, [active, onSeedPathsConsumed, seedPaths]);

  const handlePickFolders = async () => {
    setError("");
    const picked = await open({
      directory: true,
      multiple: true,
      title: "Select folders containing Tesla clips",
    });

    if (!picked) return;

    const paths = Array.isArray(picked) ? picked : [picked];
    await handleImportPaths(paths, step === "preview");
  };

  const handlePickFiles = async () => {
    setError("");
    const picked = await open({
      directory: false,
      multiple: true,
      title: "Select Tesla clip files",
      filters: [{ name: "Tesla clips", extensions: ["mp4"] }],
    });

    if (!picked) return;

    const paths = Array.isArray(picked) ? picked : [picked];
    await handleImportPaths(filterMp4Paths(paths), step === "preview");
  };

  const handleToggleEvent = (folderPath: string, checked: boolean) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(folderPath);
      } else {
        next.delete(folderPath);
      }
      return next;
    });
  };

  const handleSelectAllNew = () => {
    setSelectedEvents(
      new Set(detected.filter((event) => !event.alreadyImported).map((event) => event.folderPath)),
    );
  };

  const handleSourceOverride = (folderPath: string, source: EventSource) => {
    setSourceOverrides((prev) => ({ ...prev, [folderPath]: source }));
  };

  const handleImport = async () => {
    if (selectedEvents.size === 0 || importing) return;

    setImporting(true);
    setImportProgress(null);
    setError("");

    try {
      const eventsToImport = applyImportSources(
        detected.filter((event) => selectedEvents.has(event.folderPath)),
        sourceOverrides,
      );
      await startImportTeslaEvents(eventsToImport);
      const result = await waitForImportCompletion(setImportProgress);

      if (result.cancelled) {
        setError("Import cancelled. Events already copied remain in your library.");
        return;
      }

      if (result.errors.length > 0) {
        setError(result.errors.join(" · "));
      }

      if (result.importedCount > 0) {
        handleReset();
        onImportComplete();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const handleCancelActiveImport = useCallback(async () => {
    if (!importing) return;
    try {
      await cancelImport();
    } catch (err) {
      setError(String(err));
    }
  }, [importing]);

  const handleReset = useCallback(() => {
    scanGenerationRef.current += 1;
    seedScanKeyRef.current = null;
    scanPathsRef.current = [];
    setStep("pick");
    setDetected([]);
    setSelectedEvents(new Set());
    setError("");
    setDragOver(false);
    setLoading(false);
    setImporting(false);
    setImportProgress(null);
    setScanPaths([]);
    setSourceOverrides({});
    setEncryptedScan(null);
  }, []);

  useEffect(() => {
    if (!active) {
      handleReset();
    }
  }, [active, handleReset]);

  const handleCancelImport = useCallback(async () => {
    if (importing) {
      await handleCancelActiveImport();
      return;
    }

    if (loading) return;

    if (detected.length > 0 && showPreview) {
      const confirmed = await showConfirm({
        title: "Discard import",
        description: "Discard the scanned events and start over?",
        confirmLabel: "Discard",
        variant: "warning",
      });
      if (!confirmed) return;
    }

    handleReset();
  }, [detected.length, handleCancelActiveImport, handleReset, importing, loading, showPreview]);

  const canCancel = (showPreview && !loading && !importing) || importing;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!canCancel) return;
      if (loading) return;

      event.preventDefault();
      void handleCancelImport();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canCancel, handleCancelImport, loading]);

  return (
    <div data-scroll-root className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-5">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            {showPreview ? "Review import" : "Import"}
          </h1>
          {canCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleCancelImport()}
              disabled={loading}
              className="h-7 text-[11px] text-zinc-500 hover:text-zinc-300"
              aria-label={showPreview ? "Start over" : "Cancel"}
            >
              {showPreview ? "Start over" : "Cancel"}
            </Button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {hasEncryptedScanHits(encryptedScan) && encryptedScan && (
          <EncryptedClipsBanner
            encryptedClipsFound={encryptedScan.encryptedClipsFound}
            encryptedFolderDetected={encryptedScan.encryptedFolderDetected}
          />
        )}

        {loading && showPreview && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5 text-sm text-zinc-500"
          >
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
            Scanning for additional clips…
          </div>
        )}

        {!showPreview && (
          <ImportPickPanel
            dragOver={dragOver}
            loading={loading}
            onPickFolders={() => void handlePickFolders()}
            onPickFiles={() => void handlePickFiles()}
          />
        )}

        {showPreview && (
          <ImportPreviewPanel
            detected={detected}
            selectedEvents={selectedEvents}
            loading={loading}
            importing={importing}
            importProgress={importProgress}
            dragOver={dragOver}
            newEventCount={newEventCount}
            importedEventCount={importedEventCount}
            allAlreadyInLibrary={allAlreadyInLibrary}
            hasMixedImportResults={hasMixedImportResults}
            showSourcePicker={showSourcePicker}
            bulkUnrecognizedSource={bulkUnrecognizedSource}
            sourceOverrides={sourceOverrides}
            selectionSummary={selectionSummary}
            onToggleEvent={handleToggleEvent}
            onSelectAllNew={handleSelectAllNew}
            onBulkSourceChange={handleBulkUnrecognizedSourceChange}
            onSourceOverride={handleSourceOverride}
            onPickFolders={() => void handlePickFolders()}
            onPickFiles={() => void handlePickFiles()}
            onImport={() => void handleImport()}
            onCancelImport={() => void handleCancelActiveImport()}
          />
        )}
      </div>
    </div>
  );
};
