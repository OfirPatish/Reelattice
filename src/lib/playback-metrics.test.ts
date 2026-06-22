import { describe, expect, it } from "vitest";
import {
  computeExportSegment,
  segmentExportLabel,
  segmentFileSuffix,
} from "@/lib/playback-metrics";

describe("playback-metrics", () => {
  it("centers export segment around current time", () => {
    expect(computeExportSegment(20, 60, 30)).toEqual({
      startSecs: 5,
      durationSecs: 30,
    });
  });

  it("clamps export segment to footage duration", () => {
    expect(computeExportSegment(55, 60, 30)).toEqual({
      startSecs: 30,
      durationSecs: 30,
    });
  });

  it("builds segment file suffix and label", () => {
    const segment = { startSecs: 12, durationSecs: 30 };

    expect(segmentFileSuffix(segment)).toBe("30s-at-12s");
    expect(segmentExportLabel(segment)).toBe("30s segment");
  });
});
