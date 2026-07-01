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
  Tag,
  Upload,
} from "lucide-react";
import {
  SecondarySection,
  SecondaryViewHeader,
  SecondaryViewRoot,
} from "@/components/layout/secondary-view-layout";
import { KeyboardShortcutRow } from "@/components/ui/keyboard-shortcut-row";
import { accentIconBox, type AccentTone } from "@/lib/accent-tones";
import { getPlaybackShortcuts, LIBRARY_SHORTCUTS } from "@/lib/keyboard-shortcuts";
import { loadLibraryPreferences } from "@/lib/library-preferences";

type HelpTopicProps = {
  icon: ReactNode;
  title: string;
  summary: string;
  examples: string[];
  tone: AccentTone;
};

const QUICK_START_TONES: AccentTone[] = ["sky", "violet", "emerald"];

const buildQuickStart = (exportSegmentSecs: number) => [
  {
    step: "1",
    title: "Import footage",
    body: "Go to Import and choose your TeslaCam USB folder, or drop clips onto the Library.",
    example: "RecentClips · SentryClips · SavedClips, or loose MP4 files",
  },
  {
    step: "2",
    title: "Review an event",
    body: "Pick an event in the list. Scrub the timeline, switch cameras, or open Grid to see every angle synced.",
    example: "Front · Back · Left Fender. Click a pill to switch angle.",
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
    title: "Library",
    tone: "sky",
    summary:
      "Search, use the filter button for source/tag/sort options, and switch Active vs Archived. Collapse the list when you need more room for playback.",
    examples: [
      "Search “sentry” to narrow events by note or filename",
      "Filter button — source, tag, sort, date, note previews, list width",
      "Change source (Recent / Sentry / Saved) in the event header or Details panel",
      "Use Select for bulk archive, export, tag, or add to case",
    ],
  },
  {
    icon: <Play className="h-4 w-4" aria-hidden />,
    title: "Playback",
    tone: "violet",
    summary:
      "Single shows one camera; Grid shows all angles in the same layout as export. Camera pills sit centered under the timeline.",
    examples: [
      "Grid mode clears the active camera pill. Click Front to return to Single.",
      "Fullscreen keeps the same player with no flash when switching layout.",
      "Inspector panel (Details) holds tags, notes, and per-camera file sizes",
    ],
  },
  {
    icon: <Scissors className="h-4 w-4" aria-hidden />,
    title: "Segment export",
    tone: "amber",
    summary: `Scissors sets a ${exportSegmentSecs}-second window around the playhead. The export rail shows the range before you export.`,
    examples: [
      "Scrub to the moment → click scissors → export rail appears",
      `← / → skip ${seekStepSecs} seconds · Space toggles play/pause`,
      "ZIP and grid MP4 both respect the segment while scissors is on",
      "Turn scissors off to export the full ~1 minute clip again",
    ],
  },
  {
    icon: <Grid2x2 className="h-4 w-4" aria-hidden />,
    title: "Export options",
    tone: "teal",
    summary:
      "ZIP gives separate per-camera files. Grid MP4 stitches one video matching the in-app grid (needs 2+ cameras).",
    examples: [
      `Share evidence with grid MP4 and scissors on the key ${exportSegmentSecs} seconds`,
      "Archive originals with ZIP and full-length clips per camera",
      "Grid export asks for quality before save location",
      "Progress bar shows while FFmpeg encodes grid video",
    ],
  },
  {
    icon: <Upload className="h-4 w-4" aria-hidden />,
    title: "Import",
    tone: "sky",
    summary:
      "Reelattice only accepts Tesla dashcam MP4s with the standard filename pattern. Source auto-tags when you import a TeslaCam root or a folder named RecentClips, SentryClips, or SavedClips.",
    examples: [
      "Valid name: 2026-06-16_02-11-07-front.mp4 (timestamp + camera)",
      "Plug in TeslaCam USB while Reelattice is open for an Import prompt (disable in Settings)",
      "Encrypted clips (2026.20+): decrypt at dashcam.tesla.com first, then import",
      "Drag folders onto Library or use Import → Browse",
    ],
  },
  {
    icon: <CheckSquare className="h-4 w-4" aria-hidden />,
    title: "Bulk select",
    tone: "fuchsia",
    summary:
      "Use Select in the library toolbar, check rows, then archive, export, delete, tag, or add to a case from the panel on the right.",
    examples: [
      "Shift+click two rows to select a range",
      "Press a to select all visible (filtered) events",
      "Add to case opens a picker. Choose a bundle or create one inline.",
      "Esc exits selection without changing events",
    ],
  },
  {
    icon: <Briefcase className="h-4 w-4" aria-hidden />,
    title: "Cases",
    tone: "amber",
    summary:
      "Group related events into incident bundles for review and export planning. Edit title and notes in view/edit mode.",
    examples: [
      "Cases tab → New case (or create from the detail panel when empty)",
      "Pick a quick label (parking lot, sentry alert, …) or type a custom title",
      "Bulk select in Library → Add to case → pick which bundle to link",
    ],
  },
  {
    icon: <Tag className="h-4 w-4" aria-hidden />,
    title: "Tags & notes",
    tone: "rose",
    summary:
      "Tags save instantly in the inspector. Notes save when you click away from the field (500 character limit).",
    examples: [
      "Tag “insurance” on one event, then filter the library by that tag",
      "Bulk tag from the selection bar applies to every checked event",
    ],
  },
  {
    icon: <Archive className="h-4 w-4" aria-hidden />,
    title: "Archive & delete",
    tone: "emerald",
    summary:
      "Archive moves events out of Active (reversible). Delete removes library files and metadata. You can re-import later.",
    examples: [
      "Archive old commutes; switch to Archived tab to restore",
      "Delete clears disk space. Originals on USB are untouched if never imported.",
    ],
  },
];

const HelpTopic = ({ icon, title, summary, examples, tone }: HelpTopicProps) => (
  <article className="px-5 py-4">
    <div className="flex gap-3">
      <span className={accentIconBox(tone, "h-9 w-9 shrink-0 rounded-lg")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">{summary}</p>
        <ul className="mt-3 space-y-2">
          {examples.map((example) => (
            <li key={example} className="flex gap-2 text-xs leading-relaxed text-zinc-500">
              <span className="shrink-0 text-zinc-600" aria-hidden>
                ·
              </span>
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </article>
);

const InfoCard = ({
  icon,
  title,
  children,
  tone = "sky",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: AccentTone;
}) => (
  <div className="flex gap-3 rounded-lg border border-zinc-800/70 bg-zinc-950/30 px-4 py-3.5">
    <span className={accentIconBox(tone, "mt-0.5 h-8 w-8 shrink-0 rounded-md")}>{icon}</span>
    <div className="min-w-0">
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <div className="mt-1 text-xs leading-relaxed text-zinc-500">{children}</div>
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
    <SecondaryViewRoot>
      <SecondaryViewHeader
        title="Help"
        description="Import, review, organize, and export Tesla footage. Everything stays on your machine."
      />

      <SecondarySection title="Quick start" description="Three steps from USB stick to a shareable clip.">
        <div className="grid gap-px bg-zinc-800/60 md:grid-cols-3">
          {quickStart.map((item, index) => (
            <div key={item.step} className="bg-zinc-950/50 p-5">
              <span
                className={accentIconBox(
                  QUICK_START_TONES[index] ?? "sky",
                  "inline-flex h-5 w-5 rounded-full text-[10px] font-semibold",
                )}
                aria-hidden
              >
                {item.step}
              </span>
              <h3 className="mt-2 text-sm font-medium text-zinc-100">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.body}</p>
              <p className="mt-3 rounded-md border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-500">
                {item.example}
              </p>
            </div>
          ))}
        </div>
      </SecondarySection>

      <div className="grid gap-6 lg:grid-cols-2">
        <SecondarySection
          title="Guides"
          description="Workflow tips for each part of the app."
          className="lg:col-span-2"
          bodyClassName="divide-y divide-zinc-800/60"
        >
          {helpTopics.map((topic) => (
            <HelpTopic key={topic.title} {...topic} />
          ))}
        </SecondarySection>

        <SecondarySection
          title="Keyboard shortcuts"
          description="Ignored while typing in search or notes."
          bodyClassName="divide-y divide-zinc-800/60 px-5"
        >
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
        </SecondarySection>

        <SecondarySection
          title="Good to know"
          description="Storage, privacy, and where files live."
          bodyClassName="space-y-3 p-5"
        >
          <InfoCard
            icon={<FolderOpen className="h-4 w-4" aria-hidden />}
            title="Library copies"
            tone="emerald"
          >
            Import copies MP4s into Documents/Reelattice/library. Playback and export always use
            that copy. Open folder on an event shows the library path, not your USB.
          </InfoCard>
          <InfoCard icon={<Grid2x2 className="h-4 w-4" aria-hidden />} title="When FFmpeg runs" tone="teal">
            Grid MP4 export and first-time list thumbnails (cached under library/.thumbnails).
            ZIP export, import copy, and playback do not spawn background encodes.
          </InfoCard>
          <InfoCard icon={<Download className="h-4 w-4" aria-hidden />} title="Software updates" tone="sky">
            Reelattice checks for updates on startup and in Settings → About. New versions install
            inside the app with a full-screen progress overlay.
          </InfoCard>
          <p className="text-xs leading-relaxed text-zinc-500">
            On disk, events live under{" "}
            <span className="font-mono text-zinc-400">library/2026-06-19_10-46-00/a70bcd61/</span>:
            a timestamp folder plus a short event ID. Paths and storage usage are in Settings.
          </p>
        </SecondarySection>
      </div>
    </SecondaryViewRoot>
  );
};
