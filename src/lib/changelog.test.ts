import { describe, expect, it } from "vitest";
import { getChangelogHighlights, normalizeChangelogVersion } from "@/lib/changelog";

describe("changelog helpers", () => {
  it("normalizes patch versions to major.minor", () => {
    expect(normalizeChangelogVersion("1.14.0")).toBe("1.14");
    expect(normalizeChangelogVersion("v1.13.0")).toBe("1.13");
  });

  it("returns highlights for a known release", () => {
    const highlights = getChangelogHighlights("1.17.0");
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0]).toContain("Library");
  });

  it("returns empty highlights for unknown versions", () => {
    expect(getChangelogHighlights("0.0.1")).toEqual([]);
  });
});
