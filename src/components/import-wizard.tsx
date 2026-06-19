import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { confirm, open } from "@tauri-apps/plugin-dialog";
import {
  AlertCircle,
  CheckCircle2,
  FileVideo,
  FolderOpen,
  Info,
  Loader2,
  Plus,
} from "lucide-react";
import { ImportSourceSelect } from "@/components/import-source-select";
import { ImportDropIllustration } from "@/components/empty-illustrations";
import { EncryptedClipsBanner } from "@/components/encrypted-clips-banner";
import { importTeslaEvents, scanImportPaths } from "@/lib/api";
import { formatEventTime, sourceBadgeClass, sourceLabel } from "@/lib/format";
import {
  applyBulkUnrecognizedSource,
  applyImportSources,
  DEFAULT_LOOSE_IMPORT_SOURCE,
  getSharedUnrecognizedSource,
  getUnrecognizedSource,
  hasUnrecognizedImportSource,
  syncUnrecognizedSourceOverrides,
} from "@/lib/import-source";
import type { DetectedEvent, EventSource } from "@/lib/types";
import { hasEncryptedScanHits, type EncryptedScanInfo } from "@/lib/tesla-encrypted";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

  const handleImport = async () => {
    if (selectedEvents.size === 0) return;

    setLoading(true);
    setError("");

    try {
      const eventsToImport = applyImportSources(
        detected.filter((event) => selectedEvents.has(event.folderPath)),
        sourceOverrides,
      );
      await importTeslaEvents(eventsToImport);
      handleReset();
      onImportComplete();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

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
    if (loading) return;

    if (detected.length > 0 && showPreview) {
      const confirmed = await confirm(
        "Discard the scanned events and start over?",
        { title: "Discard import", kind: "warning", okLabel: "Discard" },
      );
      if (!confirmed) return;
    }

    handleReset();
  }, [detected.length, handleReset, loading, showPreview]);

  const canCancel = showPreview && !loading;

  const pageTitle = showPreview ? "Review" : "Import footage";

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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
            {!showPreview && (
              <p className="mt-0.5 text-sm text-zinc-400">
                Copies clips into your Reelattice library — safe to remove the source afterward.
              </p>
            )}
          </div>
          {canCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleCancelImport()}
              disabled={loading}
              className="text-zinc-500 hover:text-zinc-300"
              aria-label="Cancel import"
            >
              Cancel
            </Button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {hasEncryptedScanHits(encryptedScan) && encryptedScan && (
          <EncryptedClipsBanner
            encryptedClipsFound={encryptedScan.encryptedClipsFound}
            encryptedFolderDetected={encryptedScan.encryptedFolderDetected}
          />
        )}

        {!showPreview && (
          <div
            className={cn(
              "relative flex min-h-[17.5rem] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center",
              dragOver
                ? "border-sky-400 bg-sky-500/10"
                : "border-zinc-700/80 bg-zinc-950",
            )}
            aria-label="Drop Tesla clip files or folders here"
            aria-busy={loading}
          >
            <div className="relative flex h-28 w-full max-w-[11rem] items-center justify-center">
              {!loading && (
                <ImportDropIllustration
                  size="compact"
                  className={cn(
                    "transition-opacity duration-150",
                    dragOver ? "opacity-100" : "opacity-90",
                  )}
                />
              )}
              <Loader2
                className={cn(
                  "absolute h-10 w-10 animate-spin text-sky-400 transition-opacity duration-150",
                  loading ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
            </div>
            <p className="mt-4 min-h-[1.25rem] text-sm font-medium text-zinc-200">
              {loading
                ? step === "preview"
                  ? "Copying footage…"
                  : "Scanning…"
                : dragOver
                  ? "Drop to scan"
                  : "Drop files or folders here"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">or</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={handlePickFolders} disabled={loading}>
                <FolderOpen className="h-4 w-4" aria-hidden />
                Browse folders
              </Button>
              <Button type="button" variant="outline" onClick={handlePickFiles} disabled={loading}>
                <FileVideo className="h-4 w-4" aria-hidden />
                Browse files
              </Button>
            </div>
          </div>
        )}

        {showPreview && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-sm text-zinc-400">
                {detected.length} event{detected.length === 1 ? "" : "s"} found
                {newEventCount > 0 && (
                  <span className="text-emerald-400/90">
                    {" "}
                    · {newEventCount} new
                  </span>
                )}
                {importedEventCount > 0 && (
                  <span className="text-zinc-500">
                    {" "}
                    · {importedEventCount} already in library
                  </span>
                )}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllNew}
                disabled={loading || newEventCount === 0}
                className="h-8 text-zinc-400"
              >
                Select all new
              </Button>
            </div>

            {allAlreadyInLibrary && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-sky-500/25 bg-sky-500/5 px-4 py-3"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                <div className="min-w-0 text-sm leading-relaxed text-sky-100/90">
                  <p className="font-medium text-sky-100">
                    Nothing new to import — this footage is already in your library.
                  </p>
                  <p className="mt-1 text-xs text-sky-200/70">
                    Reelattice matches events by timestamp, so the same recording from another
                    folder or USB drive is treated as a duplicate. Delete the event in the library
                    first if you need to import it again.
                  </p>
                </div>
              </div>
            )}

            {hasMixedImportResults && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-4 py-3"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                <p className="text-sm leading-relaxed text-zinc-400">
                  Events marked{" "}
                  <span className="font-medium text-zinc-300">Already in library</span> match a
                  timestamp you imported before and cannot be selected again.
                </p>
              </div>
            )}

            {showSourcePicker && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
                <p className="text-sm text-amber-100/90">
                  These clips are not from a TeslaCam USB folder. Choose Recent, Sentry, or Saved
                  for each event below.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500">Set all to:</span>
                  <ImportSourceSelect
                    value={bulkUnrecognizedSource ?? DEFAULT_LOOSE_IMPORT_SOURCE}
                    onChange={handleBulkUnrecognizedSourceChange}
                    disabled={loading}
                    aria-label="Set source for all unrecognized events"
                  />
                  {!bulkUnrecognizedSource && (
                    <span className="text-[11px] text-zinc-600">Events differ — picks one for all</span>
                  )}
                </div>
              </div>
            )}

            <div
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40",
                dragOver && "border-zinc-600",
              )}
            >
              <ul className="max-h-[min(420px,50vh)] divide-y divide-zinc-800/80 overflow-y-auto">
                {detected.map((event) => {
                  const isSelected = selectedEvents.has(event.folderPath);
                  const isImported = event.alreadyImported;

                  return (
                    <li key={event.folderPath}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 transition-colors",
                          isImported && "opacity-45",
                          !isImported && !isSelected && "hover:bg-zinc-800/30",
                          isSelected && !isImported && "bg-zinc-800/70",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isImported || loading}
                          onCheckedChange={(checked) =>
                            handleToggleEvent(event.folderPath, checked === true)
                          }
                          aria-label={`Import ${formatEventTime(event.eventTime)}`}
                        />
                        <span className="min-w-0 flex-1 text-sm text-zinc-200">
                          {formatEventTime(event.eventTime)}
                        </span>
                        {event.sourceInferred ? (
                          <span
                            className={cn(
                              "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                              sourceBadgeClass(event.source),
                            )}
                          >
                            {sourceLabel(event.source)}
                          </span>
                        ) : (
                          <ImportSourceSelect
                            value={getUnrecognizedSource(event, sourceOverrides)}
                            onChange={(source) =>
                              setSourceOverrides((prev) => ({
                                ...prev,
                                [event.folderPath]: source,
                              }))
                            }
                            disabled={isImported || loading}
                            aria-label={`Source for ${formatEventTime(event.eventTime)}`}
                          />
                        )}
                        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                          {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
                        </span>
                        {isImported && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700"
                            title="This timestamp is already in your library"
                          >
                            <CheckCircle2 className="h-3 w-3" aria-hidden />
                            Already in library
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex border-t border-zinc-800/80 px-2 py-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePickFolders}
                  disabled={loading}
                  className="text-zinc-500"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add folders
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePickFiles}
                  disabled={loading}
                  className="text-zinc-500"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add files
                </Button>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-3"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm leading-snug text-zinc-400">
                  {allAlreadyInLibrary ? (
                    <span className="text-zinc-500">
                      No events selected — everything scanned is already in your library.
                    </span>
                  ) : selectionSummary.events > 0 ? (
                    <>
                      Import{" "}
                      <span className="font-semibold text-zinc-100">
                        {selectionSummary.events} event{selectionSummary.events === 1 ? "" : "s"}
                      </span>
                      {" · "}
                      <span className="font-semibold text-zinc-100">
                        {selectionSummary.cameras} camera{selectionSummary.cameras === 1 ? "" : "s"}
                      </span>
                    </>
                  ) : (
                    "Check the events you want to import"
                  )}
                </p>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || selectionSummary.events === 0}
                  className="shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Copying…
                    </>
                  ) : (
                    <>
                      Import
                      {selectionSummary.events > 0 ? ` (${selectionSummary.events})` : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
