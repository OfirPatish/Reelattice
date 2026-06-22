import { describe, expect, it } from "vitest";
import {
  applyRangeSelection,
  formatBulkCount,
  getSelectAllState,
  getTagCoverage,
} from "@/lib/bulk-selection";
import type { DashEvent } from "@/lib/types";

const makeEvent = (id: string, tags: string[] = []): DashEvent => ({
  id,
  eventTime: "2026-06-16T02:20:11",
  source: "recent",
  note: "",
  tags,
  archived: false,
  clips: [],
  createdAt: "2026-06-16T02:20:11",
  updatedAt: "2026-06-16T02:20:11",
});

describe("bulk-selection", () => {
  it("computes tag coverage", () => {
    const events = [makeEvent("a", ["hit"]), makeEvent("b", []), makeEvent("c", ["hit"])];

    expect(getTagCoverage(events, "hit")).toBe("some");
    expect(getTagCoverage(events, "miss")).toBe("none");
    expect(getTagCoverage([makeEvent("a", ["hit"]), makeEvent("b", ["hit"])], "hit")).toBe("all");
  });

  it("applies shift range selection", () => {
    const events = ["a", "b", "c", "d"].map((id) => makeEvent(id));
    const next = applyRangeSelection(events, "b", "d", new Set(["a"]), true);

    expect([...next]).toEqual(["a", "b", "c", "d"]);
  });

  it("reports select-all state for visible rows", () => {
    const events = [makeEvent("a"), makeEvent("b")];

    expect(getSelectAllState(events, new Set())).toBe("none");
    expect(getSelectAllState(events, new Set(["a", "b"]))).toBe("all");
    expect(getSelectAllState(events, new Set(["a"]))).toBe("some");
  });

  it("formats bulk counts", () => {
    expect(formatBulkCount(2, 5)).toBe("2 of 5 selected");
  });
});
