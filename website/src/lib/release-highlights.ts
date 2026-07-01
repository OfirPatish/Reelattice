import { APP_VERSION } from "@/lib/constants";

/**
 * Latest release bullets for the marketing site.
 * Keep in sync with the top entry in `src/lib/changelog.ts` when shipping an app release.
 */
export const RELEASE_HIGHLIGHTS: readonly string[] = [
  "Library toolbar simplified — Filters button opens source, tag, sort, and more in one panel",
  "Import and Cases refreshed — tighter import flow and cleaner incident bundles",
  "Calmer layout across Help, Settings, and Changelog with subtle color for quick scanning",
];

export const releaseHighlightsHeading = () => `What's new in v${APP_VERSION}`;

/** Shipped capabilities referenced on the site — spot-check against changelog when editing copy. */
export const MARKETED_CAPABILITIES = {
  import: "TeslaCam USB folders, loose MP4s, drag-and-drop, optional import guide",
  playback: "Single + synced grid for all cameras, segment trim (scissors)",
  organize: "Search, Filters panel, tags, notes, archive, bulk select",
  cases: "Incident bundles — group related events for review and export",
  export: "ZIP per camera or one grid MP4 with quality presets and FFmpeg progress",
  privacy: "100% local — no account, no cloud upload",
  updates: "Signed Windows installer · in-app updates from Settings → About",
} as const;
