import { APP_VERSION } from "@/lib/constants";

/**
 * Latest release bullets for the marketing site.
 * Keep in sync with the top entry in `src/lib/changelog.ts` when shipping an app release.
 */
export const RELEASE_HIGHLIGHTS: readonly string[] = [
  "TeslaCam USB detection — plug in a drive, get an opt-in Import prompt",
  "Settings → Import — toggle drive detection; dismiss per drive for this session",
  "Branded in-app confirm dialogs — starting with the drive import prompt",
];

export const releaseHighlightsHeading = () => `What's new in v${APP_VERSION}`;

/** Shipped capabilities referenced on the site — spot-check against changelog when editing copy. */
export const MARKETED_CAPABILITIES = {
  import: "TeslaCam USB folders, loose MP4s, drag-and-drop, optional import guide",
  playback: "Single + synced grid for all cameras, segment trim (scissors)",
  organize: "Search, filters, tags, notes, archive, bulk select",
  cases: "Incident bundles — group related events for review and export",
  export: "ZIP per camera or one grid MP4 with FFmpeg progress",
  privacy: "100% local — no account, no cloud upload",
  updates: "Signed Windows installer · in-app updates from Settings → About",
} as const;
