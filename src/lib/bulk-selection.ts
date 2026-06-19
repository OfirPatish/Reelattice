import type { DashEvent } from "@/lib/types";

export type TagCoverage = "none" | "some" | "all";

export type BulkBusyAction = "archive" | "export" | "delete";

export type SelectAllState = "none" | "some" | "all";

export const getTagCoverage = (events: DashEvent[], tagName: string): TagCoverage => {
  if (events.length === 0) return "none";

  const withTag = events.filter((event) => event.tags.includes(tagName)).length;
  if (withTag === 0) return "none";
  if (withTag === events.length) return "all";
  return "some";
};

export const getSelectAllState = (
  filteredEvents: DashEvent[],
  selectedIds: Set<string>,
): SelectAllState => {
  if (filteredEvents.length === 0 || selectedIds.size === 0) return "none";

  const selectedVisible = filteredEvents.filter((event) => selectedIds.has(event.id)).length;
  if (selectedVisible === filteredEvents.length) return "all";
  return "some";
};

export const applyRangeSelection = (
  events: DashEvent[],
  anchorId: string,
  targetId: string,
  current: Set<string>,
  select: boolean,
): Set<string> => {
  const anchorIndex = events.findIndex((event) => event.id === anchorId);
  const targetIndex = events.findIndex((event) => event.id === targetId);
  if (anchorIndex === -1 || targetIndex === -1) return current;

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  const next = new Set(current);

  for (let index = start; index <= end; index += 1) {
    const id = events[index]?.id;
    if (!id) continue;
    if (select) {
      next.add(id);
    } else {
      next.delete(id);
    }
  }

  return next;
};

export const formatBulkCount = (selected: number, total: number) =>
  `${selected} of ${total} selected`;
