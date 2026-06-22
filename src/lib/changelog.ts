export type ChangelogEntry = {
  version: string;
  date: string;
  highlights: string[];
};

/** Newest first. User-facing release notes (major.minor). */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.14",
    date: "June 2026",
    highlights: [
      "Meet Reel — a tiny dashcam buddy patrolling the header; click for contextual tips",
      "Reel pauses where you click, shows hints below the navbar, then keeps walking",
    ],
  },
  {
    version: "1.13",
    date: "June 2026",
    highlights: [
      "Grid export quality: choose Full, Standard, HD, or Web before picking a save location",
      "Custom in-app confirm dialogs for delete, archive, bulk actions, settings, and more",
      "Library list: note previews, cleaner toolbar, fixed selection highlight overlapping rows",
      "Front camera playback loads faster in single mode with smoother poster transitions",
      "Update overlay shows downloaded size, total size, and estimated time remaining",
      "Single-instance launch focuses the existing window when you open Reelattice again",
      "Help, Settings, and Cases refreshed with a cleaner, more consistent layout",
    ],
  },
  {
    version: "1.12",
    date: "June 2026",
    highlights: [
      "TeslaCam USB detection: plug in a drive while Reelattice is open for an opt-in Import prompt (never auto-imports)",
      "Settings → Import: toggle drive detection on or off (on by default); dismiss per drive for this session",
      "Branded confirm dialogs: drive import prompt uses the new in-app dialog style (more flows coming)",
    ],
  },
  {
    version: "1.11",
    date: "June 2026",
    highlights: [
      "Import tab simplified: drop zone first, optional “What can I import?” guide collapsed by default",
      "Settings About: full-width layout with updates beside app info, compact legal footer",
    ],
  },
  {
    version: "1.10",
    date: "June 2026",
    highlights: [
      "Library opens with no event selected. Pick one when you're ready; per-event camera memory still applies",
      "Active / Archived and returning from other tabs no longer restore the last event",
      "Each tab scrolls back to the top when you switch views",
      "Show notes in list displays a “No note” placeholder when an event has no note",
    ],
  },
  {
    version: "1.9",
    date: "June 2026",
    highlights: [
      "Public website at reelattice.vercel.app: product overview and Windows download",
      "Privacy Policy and Terms of Use in Settings → About → Legal, and on the website",
      "Website link chip in the bottom-right corner on every screen",
    ],
  },
  {
    version: "1.8",
    date: "June 2026",
    highlights: [
      "Cases linked-events list scrolls inside the panel so large bundles no longer stretch the layout",
      "Fixed linked events sometimes missing from case detail",
      "Cases tab loading matches Library: skeleton placeholders instead of hidden spinner text",
    ],
  },
  {
    version: "1.7",
    date: "June 2026",
    highlights: [
      "Custom full-screen update overlay with download progress",
      "In-app updates no longer show the NSIS installer window",
      "App restarts automatically when the update finishes",
    ],
  },
  {
    version: "1.5",
    date: "June 2026",
    highlights: [
      "Cases tab redesign: sidebar list, view/edit modes, quick title labels",
      "Bulk Add to case opens a picker (choose existing case or create one)",
      "Smoother case editing with no list flicker or button layout shift on save",
      "Software updates in Settings → About only (removed header update badge)",
      "Help, Changelog, and Settings refreshed with subtle accent colors",
      "New Tesla multi-cam app icon across desktop, installer, and website",
    ],
  },
  {
    version: "1.4",
    date: "June 2026",
    highlights: [
      "Cancel import mid-copy with live progress in the Import wizard",
      "Custom video library location in Settings (new imports only)",
      "Cases tab: group related events into incident bundles",
      "Bulk select → Add to case from Library",
    ],
  },
  {
    version: "1.3",
    date: "June 2026",
    highlights: [
      "New Changelog tab with concise release notes per version",
      "Help guide: how in-app software updates work (Settings → About)",
    ],
  },
  {
    version: "1.2",
    date: "June 2026",
    highlights: [
      "New circular transparent app icon (multi-cam reel motif)",
      "Round AppLogo in title bar and Settings",
      "Refreshed installer and platform icon assets",
    ],
  },
  {
    version: "1.1",
    date: "June 2026",
    highlights: [
      "Maintenance release validating the signed auto-update pipeline",
    ],
  },
  {
    version: "1.0",
    date: "June 2026",
    highlights: [
      "First public Windows release with signed in-app auto-updates",
      "Branded NSIS installer and in-app auto-updates (check on startup, install from Settings)",
      "Header update status indicator and custom frameless window",
      "TeslaCam import: Recent, Sentry, Saved folders, drag-and-drop, async copy",
      "Event library: search, filters, tags, notes, archive, bulk select & export",
      "Single + Grid multi-camera playback, 30s segment export (scissors mode)",
      "ZIP and grid MP4 export with live FFmpeg progress",
      "Collapsible library list and details inspector, virtualized event list",
      "FFmpeg thumbnails, Help tab, and keyboard shortcuts",
    ],
  },
];
