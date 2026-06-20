import { useMemo, type ReactNode } from "react";
import {
  Archive,
  Briefcase,
  CheckSquare,
  Download,
  FolderOpen,
  Grid2x2,
  Keyboard,
  Library,
  Play,
  Scissors,
  Sparkles,
  Tag,
  Upload,
} from "lucide-react";
import { KeyboardShortcutRow } from "@/components/ui/keyboard-shortcut-row";
import { WebsiteLink } from "@/components/website-link";
import {
  accentIconBox,
  accentPageBannerClass,
  accentSectionClass,
  accentSectionHeaderClass,
  accentSoftCardClass,
  type AccentTone,
} from "@/lib/accent-tones";
import { getPlaybackShortcuts, LIBRARY_SHORTCUTS } from "@/lib/keyboard-shortcuts";
import { loadLibraryPreferences } from "@/lib/library-preferences";
import { cn } from "@/lib/utils";

type HelpSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  accent?: AccentTone;
};

type HelpTopicProps = {
  icon: ReactNode;
  iconTone: AccentTone;
  title: string;
  summary: string;
  examples: string[];
};

const quickStartTones: AccentTone[] = ["sky", "violet", "emerald"];

const buildQuickStart = (exportSegmentSecs: number) => [
  {
    step: "1",
    title: "Import footage",
    body: "Go to Import and choose your TeslaCam USB folder, or drop clips onto the Library.",
    example: "RecentClips · SentryClips · SavedClips — or loose MP4 files",
  },
  {
    step: "2",
    title: "Review an event",
    body: "Pick an event in the list. Scrub the timeline, switch cameras, or open Grid to see every angle synced.",
    example: "Front · Back · Left Fender — click a pill to switch angle",
  },
  {
    step: "3",
    title: "Export or organize",
    body: `Use header icons to ZIP, grid-export, tag, or archive. Toggle scissors first to trim a ${exportSegmentSecs}s moment.`,
    example: "Scrub to impact → scissors on → grid export icon",
  },
];

const buildHelpTopics = (
  seekStepSecs: number,
  exportSegmentSecs: number,
): HelpTopicProps[] => [
  {
    icon: <Library className="h-4 w-4" aria-hidden />,
    iconTone: "sky",
    title: "Library",
    summary:
      "Search, filter by source or tag, and switch Active vs Archived. Collapse the list when events are visible (animated width, cards stay fixed size); the details rail appears only after you open an event.",
    examples: [
      "Search “sentry” to narrow events by note or filename",
      "Change source badge (Recent / Sentry / Saved) after import if needed",
      "Chevron in the library header hides the event panel when the list has events",
      "Empty library: Dashcam REC on the right, animated timeline on the left",
      "No filter matches: filter animation in both panels",
    ],
  },
  {
    icon: <Play className="h-4 w-4" aria-hidden />,
    iconTone: "teal",
    title: "Playback",
    summary:
      "Single shows one camera; Grid shows all angles in the same layout as export. Camera pills sit centered under the timeline.",
    examples: [
      "Grid mode clears the active camera pill — click Front to return to Single",
      "Fullscreen keeps the same player — no flash when switching layout",
      "Inspector rail (right) holds tags, notes, and camera summary",
    ],
  },
  {
    icon: <Scissors className="h-4 w-4" aria-hidden />,
    iconTone: "fuchsia",
    title: "Segment export",
    summary: `Scissors sets a ${exportSegmentSecs}-second window around the playhead. The fuchsia Export rail shows the range before you export.`,
    examples: [
      "Scrub to the moment → click scissors → export rail appears",
      `← / → skip ${seekStepSecs} seconds · Space toggles play/pause`,
      "ZIP and grid MP4 both respect the segment while scissors is on",
      "Turn scissors off to export the full ~1 minute clip again",
    ],
  },
  {
    icon: <Grid2x2 className="h-4 w-4" aria-hidden />,
    iconTone: "amber",
    title: "Export options",
    summary:
      "ZIP gives separate per-camera files. Grid MP4 stitches one 1920×960 video matching the in-app grid (needs 2+ cameras).",
    examples: [
      `Share evidence → grid MP4 with scissors on the key ${exportSegmentSecs} seconds`,
      "Archive originals → ZIP with full-length clips per camera",
      "Progress bar shows while FFmpeg encodes grid video",
    ],
  },
  {
    icon: <Upload className="h-4 w-4" aria-hidden />,
    iconTone: "emerald",
    title: "Import",
    summary:
      "Reelattice only accepts Tesla dashcam MP4s with the standard filename pattern. Source auto-tags when you import a TeslaCam root or a folder named RecentClips, SentryClips, or SavedClips. Timestamp folders, loose files, and generic folders ask you to pick Recent, Sentry, or Saved.",
    examples: [
      "Valid name: 2026-06-16_02-11-07-front.mp4 (timestamp + camera)",
      "USB: RecentClips = flat MP4s; SentryClips & SavedClips = timestamp subfolders",
      "Import the whole TeslaCam folder, or just RecentClips / SentryClips / SavedClips",
      "Picking a timestamp folder directly (e.g. 2024-01-15_14-30-22/) → choose source manually",
      "Loose MP4s or generic folders → choose Recent or Saved (default Recent)",
      "Encrypted clips (2026.20+): decrypt at dashcam.tesla.com first, then import",
      "Drag folders onto Library or use Import → Browse",
    ],
  },
  {
    icon: <CheckSquare className="h-4 w-4" aria-hidden />,
    iconTone: "rose",
    title: "Bulk select",
    summary:
      "Use Select next to Events in the list, check rows, then archive, export, delete, tag, or add to a case from the panel on the right.",
    examples: [
      "Shift+click two rows to select a range",
      "Press a to select all visible (filtered) events",
      "Add to case opens a picker — choose a bundle or create one inline",
      "Esc exits selection without changing events",
    ],
  },
  {
    icon: <Briefcase className="h-4 w-4" aria-hidden />,
    iconTone: "violet",
    title: "Cases",
    summary:
      "Group related events into incident bundles for review and export planning. Edit title and notes in view/edit mode; link footage from Library bulk select.",
    examples: [
      "Cases tab → New case (or create your first case from the detail panel when empty)",
      "Pick a quick label (parking lot, sentry alert, …) or type a custom title",
      "Click Edit to change details; Save applies, Cancel discards edits",
      "Bulk select in Library → Add to case → pick which bundle to link",
    ],
  },
  {
    icon: <Tag className="h-4 w-4" aria-hidden />,
    iconTone: "amber",
    title: "Tags & notes",
    summary:
      "Tags save instantly in the inspector. Notes use a short save indicator — no full-page refresh.",
    examples: [
      "Tag “insurance” on one event, then filter the library by that tag",
      "Bulk tag from the selection bar applies to every checked event",
    ],
  },
  {
    icon: <Archive className="h-4 w-4" aria-hidden />,
    iconTone: "teal",
    title: "Archive & delete",
    summary:
      "Archive moves events out of Active (reversible). Delete removes library files and metadata — you can re-import later.",
    examples: [
      "Archive old commutes; switch to Archived tab to restore",
      "Delete clears disk space — originals on USB are untouched if never imported",
    ],
  },
];

const HelpSection = ({ title, description, children, className, accent }: HelpSectionProps) => (
  <section className={cn(accentSectionClass(accent), className)}>
    <div className={accentSectionHeaderClass(accent)}>
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">{title}</h2>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
      )}
    </div>
    {children}
  </section>
);

const HelpTopic = ({ icon, iconTone, title, summary, examples }: HelpTopicProps) => (
  <div className="p-5 transition-colors hover:bg-zinc-950/20">
    <div className="flex gap-3">
      <div className={accentIconBox(iconTone, "h-9 w-9 shrink-0 rounded-lg")}>{icon}</div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{summary}</p>
        <ul className="mt-3 space-y-2">
          {examples.map((example) => (
            <li
              key={example}
              className="flex gap-2 text-xs leading-relaxed text-zinc-500 before:shrink-0 before:text-zinc-600 before:content-['→']"
            >
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export const HelpView = () => {
  const prefs = loadLibraryPreferences();
  const quickStart = useMemo(
    () => buildQuickStart(prefs.exportSegmentSecs),
    [prefs.exportSegmentSecs],
  );
  const helpTopics = useMemo(
    () => buildHelpTopics(prefs.seekStepSecs, prefs.exportSegmentSecs),
    [prefs.seekStepSecs, prefs.exportSegmentSecs],
  );
  const playbackShortcuts = useMemo(
    () => getPlaybackShortcuts(prefs.seekStepSecs),
    [prefs.seekStepSecs],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-5 lg:p-6">
        <header className={accentPageBannerClass("sky")}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-300" aria-hidden />
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Help</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Quick guides for importing Tesla footage, reviewing multi-camera events, and exporting
            clips. Everything stays on your machine — no account or cloud required.
          </p>
          <WebsiteLink className="mt-2" />
        </header>

        <HelpSection
          title="Quick start"
          description="Three steps from USB stick to a shareable clip."
          accent="sky"
          className="lg:col-span-2"
        >
          <div className="grid gap-3 p-5 md:grid-cols-3">
            {quickStart.map((item, index) => {
              const tone = quickStartTones[index] ?? "sky";
              return (
                <div key={item.step} className={cn("rounded-xl border p-4", accentSoftCardClass(tone))}>
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset",
                      accentIconBox(tone, "h-6 w-6 rounded-full text-[11px]"),
                    )}
                  >
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-sm font-medium text-zinc-100">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.body}</p>
                  <p className="mt-3 rounded-lg border border-zinc-800/50 bg-zinc-950/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-400">
                    {item.example}
                  </p>
                </div>
              );
            })}
          </div>
        </HelpSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <HelpSection
            title="Guides"
            description="Concise how-tos with real workflows."
            accent="violet"
            className="lg:col-span-2"
          >
            <div className="divide-y divide-zinc-800/50">
              {helpTopics.map((topic) => (
                <HelpTopic key={topic.title} {...topic} />
              ))}
            </div>
          </HelpSection>

          <HelpSection
            title="Keyboard shortcuts"
            description="Library and playback — ignored while typing in search or notes."
            accent="teal"
          >
            <div className="divide-y divide-zinc-800/50 px-5">
              <div className="flex items-center gap-2 py-3 text-teal-400/80">
                <Keyboard className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[11px] font-medium uppercase tracking-wider">Library</span>
              </div>
              {LIBRARY_SHORTCUTS.map((shortcut) => (
                <KeyboardShortcutRow key={shortcut.description} {...shortcut} />
              ))}
              <div className="flex items-center gap-2 py-3 text-fuchsia-400/80">
                <Keyboard className="h-3.5 w-3.5" aria-hidden />
                <span className="text-[11px] font-medium uppercase tracking-wider">Playback</span>
              </div>
              {playbackShortcuts.map((shortcut) => (
                <KeyboardShortcutRow key={shortcut.description} {...shortcut} />
              ))}
            </div>
          </HelpSection>

          <HelpSection
            title="Good to know"
            description="Storage, privacy, and where files live."
            accent="emerald"
          >
            <div className="space-y-3 p-5">
              <div className={cn("flex gap-3 px-4 py-3", accentSoftCardClass("emerald"))}>
                <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Library copies</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Import copies MP4s into Documents/Reelattice/library. Playback and export always
                    use that copy — open folder on an event shows the library path, not your USB.
                  </p>
                </div>
              </div>
              <div className={cn("flex gap-3 px-4 py-3", accentSoftCardClass("violet"))}>
                <Grid2x2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-zinc-200">When FFmpeg runs</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Grid MP4 export and first-time list thumbnails (cached as JPEGs under
                    library/.thumbnails). ZIP export, import copy, and playback do not spawn
                    background encodes.
                  </p>
                </div>
              </div>
              <div className={cn("flex gap-3 px-4 py-3", accentSoftCardClass("sky"))}>
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Software updates</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Reelattice checks for updates when you open the app and when you click Check for
                    updates in Settings → About. New versions download and install inside the app with
                    a full-screen progress overlay — no separate installer window after your first
                    install.
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                On disk, events live under{" "}
                <span className="font-mono text-zinc-400">library/2026-06-19_10-46-00/a70bcd61/</span>{" "}
                — timestamp folder plus a short event ID. Paths and storage usage are in{" "}
                <span className="text-teal-300/90">Settings</span>.
              </p>
            </div>
          </HelpSection>
        </div>
      </div>
    </div>
  );
};
