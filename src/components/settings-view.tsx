import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { showConfirm } from "@/lib/show-confirm";
import {
  AlertCircle,
  Archive,
  Camera,
  Check,
  Clapperboard,
  Copy,
  Database,
  ExternalLink,
  Film,
  FolderOpen,
  HardDrive,
  Loader2,
  RefreshCw,
  RotateCcw,
  Tag,
  Upload,
  Video,
} from "lucide-react";
import { getAppSettings, openDataFolder, openLibraryFolder, setLibraryLocation, setNotifyTeslacamDrive } from "@/lib/api";
import {
  SecondarySection,
  SecondaryStat,
  SecondaryViewHeader,
  SecondaryViewRoot,
} from "@/components/layout/secondary-view-layout";
import { SettingsAboutSection } from "@/components/settings/settings-about-section";
import { useAppUpdateContext } from "@/contexts/app-update-context";
import { formatFileSize, sourceBadgeClass, sourceLabel } from "@/lib/format";
import {
  describeLibraryPreferences,
  EXPORT_SEGMENT_OPTIONS,
  loadLibraryPreferences,
  resetLibraryPreferences,
  saveLibraryPreferences,
  SEEK_STEP_OPTIONS,
  type ExportSegmentSecs,
  type LibraryPreferences,
  type SeekStepSecs,
} from "@/lib/library-preferences";
import type { AppSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SettingsViewProps = {
  active: boolean;
  refreshKey: number;
};

type StorageLocationCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  path?: string;
  sizeLabel?: string;
  loading?: boolean;
  copied?: boolean;
  actionLabel: string;
  onAction: () => void;
  onCopy?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

const StorageLocationCard = ({
  icon,
  title,
  description,
  path,
  sizeLabel,
  loading,
  copied = false,
  actionLabel,
  onAction,
  onCopy,
  secondaryActionLabel,
  onSecondaryAction,
}: StorageLocationCardProps) => (
  <div className="flex flex-col rounded-lg border border-zinc-800/70 bg-zinc-950/30 p-5">
    <div className="flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800/80">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-base font-medium text-zinc-100">{title}</h3>
          {sizeLabel && !loading && (
            <span className="rounded-full bg-zinc-800/80 px-2.5 py-1 text-xs font-medium tabular-nums text-zinc-300 ring-1 ring-zinc-700/80 ring-inset">
              {sizeLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
    </div>

    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-950/30 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <p className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-zinc-300">
          {loading ? "Loading…" : path}
        </p>
        {onCopy && path && !loading && (
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
              copied
                ? "bg-emerald-500/15 text-emerald-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
            )}
            aria-label={copied ? `${title} path copied` : `Copy ${title} path`}
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
          </button>
        )}
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 shrink-0 px-4"
        onClick={onAction}
        disabled={loading}
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        {actionLabel}
      </Button>
      {secondaryActionLabel && onSecondaryAction ? (
        <Button
          type="button"
          variant="ghost"
          className="h-10 shrink-0 px-4 text-zinc-300"
          onClick={onSecondaryAction}
          disabled={loading}
        >
          {secondaryActionLabel}
        </Button>
      ) : null}
    </div>
  </div>
);

export const SettingsView = ({ active, refreshKey }: SettingsViewProps) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [prefsReset, setPrefsReset] = useState(false);
  const [copiedPathKey, setCopiedPathKey] = useState<string | null>(null);
  const [libraryPrefs, setLibraryPrefs] = useState(loadLibraryPreferences);
  const hasLoadedOnceRef = useRef(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const { state: updateState, checkForUpdate, installUpdate } = useAppUpdateContext();

  const preferenceRows = useMemo(
    () => describeLibraryPreferences(libraryPrefs),
    [libraryPrefs],
  );

  const handlePlaybackPrefChange = useCallback((patch: Partial<LibraryPreferences>) => {
    const next = { ...loadLibraryPreferences(), ...patch };
    saveLibraryPreferences(next);
    setLibraryPrefs(next);
  }, []);

  const loadSettings = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = await getAppSettings();
      setSettings(data);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    setLibraryPrefs(loadLibraryPreferences());
    void loadSettings({ silent: hasLoadedOnceRef.current });
  }, [active, loadSettings, refreshKey]);

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const handleCopyPath = async (key: string, path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      setCopiedPathKey(key);
      copyTimeoutRef.current = window.setTimeout(() => setCopiedPathKey(null), 1600);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleOpenLibrary = async () => {
    setError("");
    try {
      await openLibraryFolder();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleChangeLibraryLocation = async () => {
    const picked = await open({
      directory: true,
      multiple: false,
      title: "Choose video library folder",
    });
    if (!picked || Array.isArray(picked)) return;

    const confirmed = await showConfirm({
      title: "Change library location",
      description:
        "New imports will copy footage into this folder. Events already in your library stay at their current paths.",
      confirmLabel: "Use folder",
      variant: "warning",
    });
    if (!confirmed) return;

    setError("");
    try {
      await setLibraryLocation(picked);
      await loadSettings({ silent: true });
    } catch (err) {
      setError(String(err));
    }
  };

  const handleOpenData = async () => {
    setError("");
    try {
      await openDataFolder();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleResetLibraryPreferences = async () => {
    const confirmed = await showConfirm({
      title: "Reset library preferences",
      description:
        "Resets sort, filters, list width, playback layout, seek step, export segment length, and panel state to their defaults. Your events, tags, and footage are not affected.",
      confirmLabel: "Reset",
      variant: "warning",
    });

    if (!confirmed) return;

    resetLibraryPreferences();
    setLibraryPrefs(loadLibraryPreferences());
    setPrefsReset(true);
    window.setTimeout(() => setPrefsReset(false), 2500);
  };

  const handleNotifyTeslacamDriveChange = async (enabled: boolean) => {
    setError("");
    try {
      await setNotifyTeslacamDrive(enabled);
      setSettings((current) =>
        current ? { ...current, notifyTeslacamDrive: enabled } : current,
      );
    } catch (err) {
      setError(String(err));
    }
  };

  const stats = settings?.stats;
  const isBusy = loading || refreshing;

  const sourceBreakdown = [
    { source: "sentry", count: stats?.sentryCount ?? 0 },
    { source: "saved", count: stats?.savedCount ?? 0 },
    { source: "recent", count: stats?.recentCount ?? 0 },
  ].filter((entry) => entry.count > 0);

  const totalEvents = (stats?.eventCount ?? 0) + (stats?.archivedCount ?? 0);

  return (
    <SecondaryViewRoot>
      <SecondaryViewHeader
        title="Settings"
        description="Storage, library stats, display preferences, export, and shortcuts."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLibraryPrefs(loadLibraryPreferences());
              void loadSettings({ silent: true });
            }}
            disabled={isBusy}
            className="shrink-0 text-zinc-400"
            aria-label="Refresh settings"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Refresh
          </Button>
        }
      />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {prefsReset && (
          <div
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            Library preferences reset. Open Library to see the defaults.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-12">
          <SecondarySection
            title="Library overview"
            description="Active events, archived items, and storage used on this device."
            className="xl:col-span-12"
          >
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <SecondaryStat
                label="Active events"
                value={String(stats?.eventCount ?? 0)}
                icon={<Video className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
                hint={
                  !loading && (stats?.archivedCount ?? 0) > 0
                    ? `${stats?.archivedCount} archived`
                    : undefined
                }
              />
              <SecondaryStat
                label="Archived"
                value={String(stats?.archivedCount ?? 0)}
                icon={<Archive className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
                hint={!loading && totalEvents > 0 ? `${totalEvents} total events` : undefined}
              />
              <SecondaryStat
                label="Clips"
                value={String(stats?.clipCount ?? 0)}
                icon={<Camera className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
              />
              <SecondaryStat
                label="Tags"
                value={String(stats?.tagCount ?? 0)}
                icon={<Tag className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
              />
              <SecondaryStat
                label="Video storage"
                value={formatFileSize(stats?.libraryBytes)}
                icon={<HardDrive className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
              />
              <SecondaryStat
                label="Database"
                value={formatFileSize(stats?.dbBytes)}
                icon={<Database className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
              />
            </div>

            {!loading && sourceBreakdown.length > 0 && (
              <div className="border-t border-zinc-800/80 px-5 py-4">
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Active events by source
                </p>
                <div className="flex flex-wrap gap-2">
                  {sourceBreakdown.map(({ source, count }) => (
                    <span
                      key={source}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        sourceBadgeClass(source),
                      )}
                    >
                      {sourceLabel(source)}
                      <span className="tabular-nums text-zinc-300">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SecondarySection>

          <SecondarySection title="About" className="xl:col-span-12">
            <SettingsAboutSection
              version={settings?.version}
              loading={loading}
              updateState={updateState}
              onCheck={() => void checkForUpdate()}
              onInstall={() => void installUpdate()}
            />
          </SecondarySection>

          <SecondarySection
            title="Storage"
            description="Imported clips are copied here. New imports use the folder below; existing events keep their original paths."
            className="xl:col-span-6"
            bodyClassName="flex flex-col gap-4 p-5"
          >
              <StorageLocationCard
                icon={<FolderOpen className="h-5 w-5" aria-hidden />}
                title="Video library"
                description="MP4 files organized by event timestamp and camera angle."
                path={settings?.libraryPath}
                sizeLabel={formatFileSize(stats?.libraryBytes)}
                loading={loading}
                copied={copiedPathKey === "library"}
                actionLabel="Open folder"
                onAction={() => void handleOpenLibrary()}
                onCopy={() => void handleCopyPath("library", settings?.libraryPath ?? "")}
                secondaryActionLabel="Change location"
                onSecondaryAction={() => void handleChangeLibraryLocation()}
              />
              <StorageLocationCard
                icon={<Database className="h-5 w-5" aria-hidden />}
                title="Database"
                description="Events, tags, notes, archive state, and import history."
                path={settings?.dbPath}
                sizeLabel={formatFileSize(stats?.dbBytes)}
                loading={loading}
                copied={copiedPathKey === "database"}
                actionLabel="Open folder"
                onAction={() => void handleOpenData()}
                onCopy={() => void handleCopyPath("database", settings?.dbPath ?? "")}
              />
          </SecondarySection>

          <SecondarySection
            title="Library display"
            description="Filter, sort, layout, and playback preferences saved locally."
            className="xl:col-span-6"
            bodyClassName="divide-y divide-zinc-800/60"
          >
              <div className="p-5">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Current preferences
                </p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {preferenceRows.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/40 bg-zinc-950/25 px-3 py-2"
                    >
                      <dt className="text-xs text-zinc-500">{label}</dt>
                      <dd className="text-xs font-medium text-zinc-200">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
                  Change sort, filters, and layout from the Library panel and playback bar. Collapse
                  rails beside the list or details panel to save space.
                </p>
              </div>

              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800/80">
                    <Clapperboard className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100">Reset preferences</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                      Restore defaults for sort, filters, list width, playback layout, seek step,
                      export segment, and panel state.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 self-start"
                  onClick={() => void handleResetLibraryPreferences()}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Reset
                </Button>
              </div>
          </SecondarySection>

          <SecondarySection
            title="Playback"
            description="Keyboard seek distance and export segment length. Saved locally on this device. Full shortcut list is in Help."
            className="xl:col-span-6"
            bodyClassName="grid gap-4 p-5 sm:grid-cols-2"
          >
              <div className="space-y-2">
                <label
                  htmlFor="seek-step-select"
                  className="text-xs font-medium text-zinc-400"
                >
                  Arrow key seek step
                </label>
                <Select
                  value={String(libraryPrefs.seekStepSecs)}
                  onValueChange={(value) =>
                    handlePlaybackPrefChange({ seekStepSecs: Number(value) as SeekStepSecs })
                  }
                >
                  <SelectTrigger id="seek-step-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEEK_STEP_OPTIONS.map((seconds) => (
                      <SelectItem key={seconds} value={String(seconds)}>
                        {seconds} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  ← and → skip this amount while reviewing an event.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="export-segment-select"
                  className="text-xs font-medium text-zinc-400"
                >
                  Export segment length
                </label>
                <Select
                  value={String(libraryPrefs.exportSegmentSecs)}
                  onValueChange={(value) =>
                    handlePlaybackPrefChange({
                      exportSegmentSecs: Number(value) as ExportSegmentSecs,
                    })
                  }
                >
                  <SelectTrigger id="export-segment-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_SEGMENT_OPTIONS.map((seconds) => (
                      <SelectItem key={seconds} value={String(seconds)}>
                        {seconds} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  Scissors on the playback bar centers this window on the playhead.
                </p>
              </div>
          </SecondarySection>

          <SecondarySection
            title="Import"
            description="USB detection while Reelattice is open. Nothing is scanned until you confirm."
            className="xl:col-span-6"
            bodyClassName="p-5"
          >
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800/80">
                <Upload className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="notify-teslacam-drive"
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    id="notify-teslacam-drive"
                    checked={settings?.notifyTeslacamDrive ?? true}
                    disabled={loading}
                    onCheckedChange={(checked) =>
                      void handleNotifyTeslacamDriveChange(checked === true)
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-zinc-100">
                      Notify when TeslaCam drive is connected
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                      Shows a prompt when a removable drive with TeslaCam folders is detected.
                      Choose Import to open the wizard. Clips are never imported automatically.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </SecondarySection>

          <SecondarySection
            title="Export & processes"
            description="What runs on your machine beyond normal browsing and playback."
            className="xl:col-span-6"
            bodyClassName="divide-y divide-zinc-800/60"
          >
              <div className="flex gap-3 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800/80">
                  <Film className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-zinc-100">Grid video export</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                    Export a single MP4 matching the in-app Grid layout (1920×960). Use scissors on
                    the playback bar for a ZIP or grid segment (length set under Playback).
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800/80">
                  <Clapperboard className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-zinc-100">When FFmpeg runs</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                    Only during grid MP4 export. Import, ZIP export, and playback do not use FFmpeg.
                  </p>
                </div>
              </div>
          </SecondarySection>
        </div>
    </SecondaryViewRoot>
  );
};
