import type { ReactNode } from "react";
import { Archive, ArchiveRestore, Download, Loader2, Tag, Trash2, X } from "lucide-react";
import { BulkSelectIllustration } from "@/components/empty-illustrations";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  formatBulkCount,
  getSelectAllState,
  getTagCoverage,
  type BulkBusyAction,
  type SelectAllState,
} from "@/lib/bulk-selection";
import { ScrollablePillRow } from "@/components/library/scrollable-pill-row";
import type { DashEvent, TagInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type LibraryBulkPanelProps = {
  selectedEvents: DashEvent[];
  filteredEvents: DashEvent[];
  selectedIds: Set<string>;
  tags: TagInfo[];
  busyAction: BulkBusyAction | null;
  filteredCount: number;
  viewingArchived: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExitSelection: () => void;
  onDelete: () => void;
  onExport: () => void;
  onArchive: () => void;
  onToggleTag: (tagName: string) => void;
};

const selectAllLabel: Record<SelectAllState, string> = {
  none: "Select all visible",
  some: "Select all visible",
  all: "Deselect all",
};

type ActionCardProps = {
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: "default" | "danger";
};

const ActionCard = ({
  label,
  description,
  icon,
  onClick,
  disabled = false,
  busy = false,
  tone = "default",
}: ActionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "group flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition",
      "disabled:pointer-events-none disabled:opacity-50",
      tone === "danger"
        ? "border-red-500/20 bg-red-500/[0.04] hover:border-red-500/35 hover:bg-red-500/[0.08]"
        : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70",
    )}
  >
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset transition",
        tone === "danger"
          ? "bg-red-500/10 text-red-300 ring-red-500/25 group-hover:bg-red-500/15"
          : "bg-zinc-800/80 text-zinc-300 ring-zinc-700/80 group-hover:bg-zinc-800",
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
    </span>
    <span className="min-w-0">
      <span
        className={cn(
          "block text-sm font-medium",
          tone === "danger" ? "text-red-200" : "text-zinc-100",
        )}
      >
        {label}
      </span>
      <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{description}</span>
    </span>
  </button>
);

export const LibraryBulkPanel = ({
  selectedEvents,
  filteredEvents,
  selectedIds,
  tags,
  busyAction = null,
  filteredCount,
  viewingArchived,
  onSelectAll,
  onClearSelection,
  onExitSelection,
  onDelete,
  onExport,
  onArchive,
  onToggleTag,
}: LibraryBulkPanelProps) => {
  const selectedCount = selectedEvents.length;
  const visibleCount = filteredEvents.length;
  const selectAllState = getSelectAllState(filteredEvents, selectedIds);
  const hasSelection = selectedCount > 0;
  const isBusy = Boolean(busyAction);
  const selectionRatio = visibleCount > 0 ? selectedCount / visibleCount : 0;

  const sharedTags = selectedEvents.reduce<string[] | null>((common, event, index) => {
    if (index === 0) return [...event.tags];
    return common?.filter((tag) => event.tags.includes(tag)) ?? [];
  }, null);

  const handleSelectAllClick = () => {
    if (selectAllState === "all") {
      onClearSelection();
      return;
    }
    onSelectAll();
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.07),transparent_55%)]"
        aria-hidden
      />

      <header className="relative z-[1] flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800/80 px-6 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-zinc-100">Bulk select</h2>
            {hasSelection && (
              <span className="inline-flex rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300 ring-1 ring-sky-500/25">
                {selectedCount} selected
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500" role="status" aria-live="polite">
            {hasSelection ? (
              <>
                <span className="font-medium text-zinc-300">{selectedCount}</span>
                {" of "}
                <span className="font-medium text-zinc-300">{visibleCount}</span>
                {" visible"}
                <span className="text-zinc-600">
                  {" "}
                  · {formatBulkCount(selectedCount, filteredCount)}
                </span>
              </>
            ) : (
              "Check events in the list to apply actions here"
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExitSelection}
          disabled={isBusy}
          className="shrink-0 border-zinc-700/80 bg-zinc-950/60"
          aria-label="Exit selection mode"
        >
          <X className="h-4 w-4" aria-hidden />
          Done
        </Button>
      </header>

      {hasSelection && visibleCount > 0 && (
        <div className="relative z-[1] px-6 pt-3">
          <div className="h-1 overflow-hidden rounded-full bg-zinc-800/80">
            <div
              className="h-full rounded-full bg-sky-500/70 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(selectionRatio * 100, 6)}%` }}
            />
          </div>
        </div>
      )}

      <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
          <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
              <Checkbox
                checked={
                  selectAllState === "all"
                    ? true
                    : selectAllState === "some"
                      ? "indeterminate"
                      : false
                }
                disabled={isBusy || visibleCount === 0}
                onCheckedChange={handleSelectAllClick}
                aria-label={selectAllLabel[selectAllState]}
              />
              <span>
                {selectAllLabel[selectAllState]}
                {visibleCount > 0 && (
                  <span className="text-zinc-500">{` (${visibleCount})`}</span>
                )}
              </span>
            </label>
            {!hasSelection && (
              <p className="mt-3 border-t border-zinc-800/60 pt-3 text-xs leading-relaxed text-zinc-500">
                Click rows to check them, or Shift+click for a range. Press{" "}
                <kbd className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-zinc-400">
                  a
                </kbd>{" "}
                to select all visible events.
              </p>
            )}
          </section>

          {hasSelection && (
            <>
              <section>
                <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Actions
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ActionCard
                    label={viewingArchived ? "Restore" : "Archive"}
                    description={
                      viewingArchived
                        ? "Move back to the active library"
                        : "Hide from the active timeline"
                    }
                    icon={
                      viewingArchived ? (
                        <ArchiveRestore className="h-4 w-4" aria-hidden />
                      ) : (
                        <Archive className="h-4 w-4" aria-hidden />
                      )
                    }
                    onClick={onArchive}
                    disabled={isBusy}
                    busy={busyAction === "archive"}
                  />
                  <ActionCard
                    label="Export ZIP"
                    description="Download clips for all selected events"
                    icon={<Download className="h-4 w-4" aria-hidden />}
                    onClick={onExport}
                    disabled={isBusy}
                    busy={busyAction === "export"}
                  />
                  <ActionCard
                    label="Delete"
                    description="Remove footage from your library"
                    icon={<Trash2 className="h-4 w-4" aria-hidden />}
                    onClick={onDelete}
                    disabled={isBusy}
                    busy={busyAction === "delete"}
                    tone="danger"
                  />
                </div>
              </section>

              {tags.length > 0 && (
                <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    <Tag className="h-3 w-3" aria-hidden />
                    Apply tags
                  </p>
                  <ScrollablePillRow ariaLabel="Apply tags to selected events">
                    {tags.map((tag) => {
                      const coverage = getTagCoverage(selectedEvents, tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => onToggleTag(tag.name)}
                          disabled={isBusy}
                          aria-pressed={coverage === "all"}
                          aria-label={
                            coverage === "all"
                              ? `${tag.name} on all selected — click to remove`
                              : coverage === "some"
                                ? `${tag.name} on some selected — click to apply to all`
                                : `Add ${tag.name} to all selected`
                          }
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50",
                            coverage === "all" &&
                              "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40",
                            coverage === "some" &&
                              "bg-sky-500/10 text-sky-400/80 ring-1 ring-dashed ring-sky-500/25",
                            coverage === "none" &&
                              "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                          )}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </ScrollablePillRow>
                </section>
              )}

              {sharedTags && sharedTags.length > 0 && (
                <section className="rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Shared by every selection
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sharedTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-800/90 px-2.5 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-zinc-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {!hasSelection && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <BulkSelectIllustration />
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-medium text-zinc-300">Nothing selected yet</p>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Archive, export, delete, and tag controls unlock once you pick at least one
                  event from the list.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
