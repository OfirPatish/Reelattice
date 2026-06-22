import { describe, expect, it } from "vitest";
import {
  GRID_EXPORT_QUALITY_LABELS,
  GRID_EXPORT_QUALITY_OPTIONS,
  isGridExportQuality,
} from "@/lib/grid-export-quality";

describe("grid-export-quality", () => {
  it("accepts known presets", () => {
    for (const quality of GRID_EXPORT_QUALITY_OPTIONS) {
      expect(isGridExportQuality(quality)).toBe(true);
      expect(GRID_EXPORT_QUALITY_LABELS[quality].length).toBeGreaterThan(0);
    }
  });

  it("rejects unknown values", () => {
    expect(isGridExportQuality("4k")).toBe(false);
  });
});
