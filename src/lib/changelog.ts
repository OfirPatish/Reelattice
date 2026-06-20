export type ChangelogEntry = {
  version: string;
  date: string;
  highlights: string[];
};

/** Newest first — user-facing release notes (major.minor). */
export const CHANGELOG: ChangelogEntry[] = [
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
      "Cases tab redesign — sidebar list, view/edit modes, quick title labels",
      "Bulk Add to case opens a picker (choose existing case or create one)",
      "Smoother case editing — no list flicker or button layout shift on save",
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
      "Cases tab — group related events into incident bundles",
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
