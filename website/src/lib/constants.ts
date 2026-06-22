export const APP_VERSION = "1.15";

/** Branded download entry on this site (resolves to the latest installer). */
export const DOWNLOAD_URL = import.meta.env.VITE_DOWNLOAD_URL ?? "/download";

export const NAV_LINKS = [
  { label: "Abilities", href: "#features" },
  { label: "Quest Line", href: "#workflow" },
  { label: "Final Stage", href: "#download" },
] as const;
