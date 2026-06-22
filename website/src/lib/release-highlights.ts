import { APP_VERSION } from "@/lib/constants";

/**
 * Latest release bullets for the marketing site.
 * Keep in sync with the top entry in `src/lib/changelog.ts` when shipping an app release.
 */
export const RELEASE_HIGHLIGHTS: readonly string[] = [
  "Grid export quality — Full, Standard, HD, or Web before you pick a save location",
  "In-app confirm dialogs replace system prompts for delete, archive, and bulk actions",
  "Library polish — note previews, cleaner toolbar, smoother selection in the event list",
  "Help, Settings, and Cases — refreshed layout for a more consistent experience",
];

export const releaseHighlightsHeading = () => `What's new in v${APP_VERSION}`;

/** Shipped capabilities referenced on the site — spot-check against changelog when editing copy. */
export const MARKETED_CAPABILITIES = {
  import: "TeslaCam USB folders, loose MP4s, drag-and-drop, optional import guide",
  playback: "Single + synced grid for all cameras, segment trim (scissors)",
  organize: "Search, filters, tags, notes, archive, bulk select",
  cases: "Incident bundles — group related events for review and export",
  export: "ZIP per camera or one grid MP4 with quality presets and FFmpeg progress",
  privacy: "100% local — no account, no cloud upload",
  updates: "Signed Windows installer · in-app updates from Settings → About",
} as const;
