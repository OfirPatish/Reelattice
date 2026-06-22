import { describe, expect, it } from "vitest";
import { clampEventNote, MAX_EVENT_NOTE_LENGTH } from "@/lib/event-notes";

describe("event-notes", () => {
  it("clamps notes to the max length", () => {
    const longNote = "a".repeat(MAX_EVENT_NOTE_LENGTH + 50);
    expect(clampEventNote(longNote)).toHaveLength(MAX_EVENT_NOTE_LENGTH);
  });
});
