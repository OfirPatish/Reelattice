import { describe, expect, it } from "vitest";
import { formatDownloadProgressDetail, initialAppUpdateState } from "@/lib/app-update";

describe("app-update progress formatting", () => {
  it("shows downloaded and total sizes when known", () => {
    const state = {
      ...initialAppUpdateState("1.13"),
      status: "downloading" as const,
      downloadedBytes: 21 * 1024 * 1024,
      totalBytes: 30 * 1024 * 1024,
      etaSeconds: 45,
    };

    expect(formatDownloadProgressDetail(state)).toContain("21.0 MB / 30.0 MB");
    expect(formatDownloadProgressDetail(state)).toContain("left");
  });

  it("shows downloaded-only fallback without total", () => {
    const state = {
      ...initialAppUpdateState("1.13"),
      status: "downloading" as const,
      downloadedBytes: 5 * 1024 * 1024,
      totalBytes: null,
      etaSeconds: null,
    };

    expect(formatDownloadProgressDetail(state)).toBe("5.0 MB downloaded");
  });
});
