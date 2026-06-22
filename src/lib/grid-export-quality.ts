export type GridExportQuality = "full" | "standard" | "hd" | "web";

export const GRID_EXPORT_QUALITY_OPTIONS: GridExportQuality[] = [
  "standard",
  "full",
  "hd",
  "web",
];

export const GRID_EXPORT_QUALITY_LABELS: Record<GridExportQuality, string> = {
  full: "Full",
  standard: "Standard",
  hd: "HD",
  web: "Web",
};

export const GRID_EXPORT_QUALITY_DESCRIPTIONS: Record<GridExportQuality, string> = {
  full: "1920×960 · best detail",
  standard: "1920×960 · balanced (default)",
  hd: "1280×640 · smaller file",
  web: "960×480 · light compression",
};

export const isGridExportQuality = (value: unknown): value is GridExportQuality =>
  value === "full" ||
  value === "standard" ||
  value === "hd" ||
  value === "web";
