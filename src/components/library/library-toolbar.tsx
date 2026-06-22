import { ChevronLeft, Search, StickyNote, X } from "lucide-react";
import {
  ArchiveEmptyIllustration,
  TimelineIdleIllustration,
} from "@/components/empty-illustrations";
import { Input } from "@/components/ui/input";
import { LIBRARY_VIEW_OPTIONS, SOURCE_PILL_OPTIONS, type LibraryView } from "@/lib/library-filters";
import { sourceFilterPillClass } from "@/lib/format";
import { cn } from "@/lib/utils";

type LibraryToolbarProps = {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  isInitialLoad: boolean;
  searchInput: string;
  libraryView: LibraryView;
  sourceFilter?: string;
  showNotesInList: boolean;
  selectionMode: boolean;
  selectedCount: number;
  isBulkBusy: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onLibraryViewChange: (view: LibraryView) => void;
  onSourceFilterChange: (value: string | undefined) => void;
  onShowNotesChange: (show: boolean) => void;
  onToggleSelectionMode: () => void;
  canCollapse?: boolean;
  onCollapse?: () => void;
};

export const LibraryToolbar = ({
  filteredCount,
  totalCount,
  hasActiveFilters,
  isInitialLoad,
  searchInput,
  libraryView,
  sourceFilter,
  showNotesInList,
  selectionMode,
  selectedCount,
  isBulkBusy,
  onSearchChange,
  onClearSearch,
  onLibraryViewChange,
  onSourceFilterChange,
  onShowNotesChange,
  onToggleSelectionMode,
  canCollapse = false,
  onCollapse,
}: LibraryToolbarProps) => {
  const countLabel = (() => {
    if (isInitialLoad) return "Loading…";
    if (hasActiveFilters) {
      return `${filteredCount} of ${totalCount} shown`;
    }
    return `${totalCount} event${totalCount === 1 ? "" : "s"}`;
  })();

  const scopeLabel = libraryView === "archived" ? "Archived" : "Active";

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Library</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {countLabel}
            {!isInitialLoad && (
              <span className="text-zinc-600">
                {" "}
                · {scopeLabel}
              </span>
            )}
          </p>
        </div>
        {canCollapse && onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Hide library"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div
        className="relative flex rounded-lg bg-zinc-900/50 p-0.5 ring-1 ring-zinc-800"
        role="tablist"
        aria-label="Library scope"
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-zinc-800 shadow-sm transition-transform duration-200 ease-out",
            libraryView === "archived" && "translate-x-full",
          )}
        />
        {LIBRARY_VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={libraryView === option.value}
            onClick={() => onLibraryViewChange(option.value)}
            disabled={isInitialLoad}
            className={cn(
              "relative z-[1] flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-200 ease-out outline-none focus:outline-none focus-visible:outline-none",
              libraryView === option.value
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <Input
          id="library-search"
          type="search"
          placeholder="Search notes, tags, time…"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search events"
          disabled={isInitialLoad}
          className="h-9 pl-9 pr-9"
        />
        {searchInput && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by source">
        {SOURCE_PILL_OPTIONS.map((option) => {
          const isActive = sourceFilter === option.value;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isActive}
              disabled={isInitialLoad}
              onClick={() => onSourceFilterChange(option.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                sourceFilterPillClass(option.value, isActive),
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {!isInitialLoad && filteredCount > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              aria-pressed={showNotesInList}
              disabled={isBulkBusy}
              onClick={() => onShowNotesChange(!showNotesInList)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition",
                showNotesInList
                  ? "bg-zinc-800 text-zinc-100 ring-1 ring-inset ring-zinc-700"
                  : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300",
              )}
            >
              <StickyNote className="h-3 w-3 shrink-0" aria-hidden />
              Notes
            </button>
          </div>
          <button
            type="button"
            disabled={isBulkBusy}
            aria-pressed={selectionMode}
            onClick={onToggleSelectionMode}
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-md px-2 text-[11px] font-medium transition",
              selectionMode
                ? "bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-500/25"
                : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300",
            )}
          >
            {selectionMode
              ? selectedCount > 0
                ? `${selectedCount} selected · Done`
                : "Selecting · Done"
              : "Select"}
          </button>
        </div>
      )}
    </div>
  );
};

export const LibraryListIdleHint = ({
  libraryView,
}: {
  libraryView: LibraryView;
}) => (
  <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
    {libraryView === "archived" ? (
      <ArchiveEmptyIllustration size="compact" />
    ) : (
      <TimelineIdleIllustration size="compact" />
    )}
    <p className="max-w-[12rem] text-xs leading-relaxed text-zinc-600">
      {libraryView === "archived"
        ? "Archived events show up here."
        : "Import footage and your events will appear here."}
    </p>
  </div>
);
