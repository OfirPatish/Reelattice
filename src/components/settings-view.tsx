import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { confirm } from "@tauri-apps/plugin-dialog";
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
  Keyboard,
  Loader2,
  RefreshCw,
  RotateCcw,
  Shield,
  Tag,
  Video,
} from "lucide-react";
import { getAppSettings, openDataFolder, openLibraryFolder } from "@/lib/api";
import { AppLogo } from "@/components/app-logo";
import { AppUpdatePanel } from "@/components/settings/app-update-panel";
import { useAppUpdate } from "@/hooks/use-app-update";
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
import { KeyboardShortcutRow } from "@/components/ui/keyboard-shortcut-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPlaybackShortcuts, LIBRARY_SHORTCUTS } from "@/lib/keyboard-shortcuts";
import { cn } from "@/lib/utils";

type SettingsViewProps = {
  active: boolean;
  refreshKey: number;
};

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

type StatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  loading?: boolean;
  hint?: string;
};

const SettingsSection = ({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) => (
  <section
    className={cn("overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30", className)}
  >
    <div className="border-b border-zinc-800/80 px-5 py-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</h2>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const StatCard = ({ label, value, icon, loading, hint }: StatCardProps) => (
  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-4 py-3.5">
    <div className="flex items-center gap-2 text-zinc-500">
      {icon}
      <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-zinc-100">
      {loading ? "…" : value}
    </p>
    {hint && !loading && (
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{hint}</p>
    )}
  </div>
);

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
}: StorageLocationCardProps) => (
  <div className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-5">
    <div className="flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-sky-400">
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

    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3">
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

    <Button
      type="button"
      variant="outline"
      className="mt-4 h-10 shrink-0 self-start px-4"
      onClick={onAction}
      disabled={loading}
    >
      <ExternalLink className="h-4 w-4" aria-hidden />
      {actionLabel}
    </Button>
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
  const { state: updateState, checkForUpdate, installUpdate } = useAppUpdate({
    currentVersion: settings?.version ?? "0.0.0",
  });

  const preferenceRows = useMemo(
    () => describeLibraryPreferences(libraryPrefs),
    [libraryPrefs],
  );

  const playbackShortcuts = useMemo(
    () => getPlaybackShortcuts(libraryPrefs.seekStepSecs),
    [libraryPrefs.seekStepSecs],
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

  const handleOpenData = async () => {
    setError("");
    try {
      await openDataFolder();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleResetLibraryPreferences = async () => {
    const confirmed = await confirm(
      "Resets sort, filters, list width, playback layout, seek step, export segment length, and panel state to their defaults. Your events, tags, and footage are not affected.",
      { title: "Reset library preferences", kind: "warning", okLabel: "Reset" },
    );

    if (!confirmed) return;

    resetLibraryPreferences();
    setLibraryPrefs(loadLibraryPreferences());
    setPrefsReset(true);
    window.setTimeout(() => setPrefsReset(false), 2500);
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
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-5 lg:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              Storage, library stats, display preferences, export, and shortcuts.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
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

        {prefsReset && (
          <div
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            Library preferences reset. Open Library to see the defaults.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12">
          <SettingsSection
            title="Library overview"
            description="Active events, archived items, and storage used on this device."
            className="lg:col-span-2 xl:col-span-8"
          >
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
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
              <StatCard
                label="Archived"
                value={String(stats?.archivedCount ?? 0)}
                icon={<Archive className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
                hint={!loading && totalEvents > 0 ? `${totalEvents} total events` : undefined}
              />
              <StatCard
                label="Clips"
                value={String(stats?.clipCount ?? 0)}
                icon={<Camera className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
              />
              <StatCard
                label="Tags"
                value={String(stats?.tagCount ?? 0)}
                icon={<Tag className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
              />
              <StatCard
                label="Video storage"
                value={formatFileSize(stats?.libraryBytes)}
                icon={<HardDrive className="h-3.5 w-3.5" aria-hidden />}
                loading={loading}
              />
              <StatCard
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
          </SettingsSection>

          <SettingsSection title="About" className="lg:col-span-2 xl:col-span-4">
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <AppLogo size={40} className="rounded-xl" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Reelattice</p>
                  <p className="text-xs text-zinc-500">
                    Version {loading ? "…" : settings?.version}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Local-first Tesla Dashcam & Sentry organizer
                  </p>
                </div>
              </div>

              <AppUpdatePanel
                state={updateState}
                onCheck={() => void checkForUpdate()}
                onInstall={() => void installUpdate()}
              />

              <div className="flex items-start gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-zinc-300">Local-first & private</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                    All footage and metadata stay on your machine. Nothing is uploaded or synced to
                    the cloud.
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Storage"
            description="Imported clips are copied here. Playback always uses the library copy."
            className="lg:col-span-2 xl:col-span-6"
          >
            <div className="flex flex-col gap-4 p-5">
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
            </div>
          </SettingsSection>

          <SettingsSection
            title="Library display"
            description="Filter, sort, layout, and playback preferences saved locally."
            className="lg:col-span-2 xl:col-span-6"
          >
            <div className="divide-y divide-zinc-800/80">
              <div className="p-5">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Current preferences
                </p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {preferenceRows.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2"
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-sky-400">
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
            </div>
          </SettingsSection>

          <SettingsSection
            title="Playback"
            description="Keyboard seek distance and export segment length. Saved locally on this device."
            className="lg:col-span-2 xl:col-span-6"
          >
            <div className="grid gap-4 p-5 sm:grid-cols-2">
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
            </div>
          </SettingsSection>

          <SettingsSection
            title="Export & processes"
            description="What runs on your machine beyond normal browsing and playback."
            className="lg:col-span-1 xl:col-span-6"
          >
            <div className="divide-y divide-zinc-800/80">
              <div className="flex gap-3 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-violet-400">
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-emerald-400">
                  <Clapperboard className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-zinc-100">When FFmpeg runs</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                    Only during grid MP4 export. Import, ZIP export, and playback do not use FFmpeg.
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Keyboard shortcuts"
            description="Library shortcuts when focus is not in a text field. Playback shortcuts when an event is open."
            className="lg:col-span-1 xl:col-span-6"
          >
            <div className="divide-y divide-zinc-800/80 px-5">
              <div className="flex items-center gap-2 py-3 text-zinc-500">
                <Keyboard className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[11px] font-medium uppercase tracking-wider">Library</span>
              </div>
              {LIBRARY_SHORTCUTS.map((shortcut) => (
                <KeyboardShortcutRow key={shortcut.description} {...shortcut} />
              ))}
              <div className="flex items-center gap-2 py-3 text-zinc-500">
                <Keyboard className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[11px] font-medium uppercase tracking-wider">Playback</span>
              </div>
              {playbackShortcuts.map((shortcut) => (
                <KeyboardShortcutRow key={shortcut.description} {...shortcut} />
              ))}
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};
