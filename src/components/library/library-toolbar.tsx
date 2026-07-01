import { CheckSquare, ChevronLeft, ListFilter, Search, X } from "lucide-react";
import {
  ArchiveEmptyIllustration,
  TimelineIdleIllustration,
} from "@/components/empty-illustrations";
import { Input } from "@/components/ui/input";
import { countActiveLibraryFilters, LIBRARY_VIEW_OPTIONS, type LibraryView } from "@/lib/library-filters";
import type { LibraryPreferences } from "@/lib/library-preferences";
import { cn } from "@/lib/utils";

type LibraryToolbarProps = {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  isInitialLoad: boolean;
  searchInput: string;
  libraryView: LibraryView;
  sourceFilter?: string;
  tagFilter?: string;
  prefs: LibraryPreferences;
  filtersOpen: boolean;
  selectionMode: boolean;
  selectedCount: number;
  isBulkBusy: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onLibraryViewChange: (view: LibraryView) => void;
  onToggleFilters: () => void;
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
  tagFilter,
  prefs,
  filtersOpen,
  selectionMode,
  selectedCount,
  isBulkBusy,
  onSearchChange,
  onClearSearch,
  onLibraryViewChange,
  onToggleFilters,
  onToggleSelectionMode,
  canCollapse = false,
  onCollapse,
}: LibraryToolbarProps) => {
  const countLabel = (() => {
    if (isInitialLoad) return "…";
    if (hasActiveFilters) return `${filteredCount}/${totalCount}`;
    return String(totalCount);
  })();

  const filterCount = countActiveLibraryFilters(prefs, {
    source: sourceFilter,
    tag: tagFilter,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="relative flex min-w-0 flex-1 rounded-lg bg-zinc-900/50 p-0.5 ring-1 ring-zinc-800"
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
                "relative z-[1] flex-1 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-200 ease-out outline-none focus:outline-none focus-visible:outline-none",
                libraryView === option.value
                  ? "text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span
          className="shrink-0 tabular-nums text-xs text-zinc-500"
          aria-label={
            isInitialLoad
              ? "Loading events"
              : hasActiveFilters
                ? `${filteredCount} of ${totalCount} events shown`
                : `${totalCount} events`
          }
        >
          {countLabel}
        </span>

        {canCollapse && onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Hide library"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <Input
            id="library-search"
            type="search"
            placeholder="Search…"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search events"
            disabled={isInitialLoad}
            className="h-9 pl-9 pr-9 text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-label={
            filterCount > 0 ? `Filters (${filterCount} active)` : "Filters"
          }
          disabled={isInitialLoad}
          onClick={onToggleFilters}
          className={cn(
            "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
            filtersOpen
              ? "bg-zinc-800 text-zinc-100 ring-1 ring-inset ring-zinc-700"
              : "text-zinc-500 ring-1 ring-inset ring-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-300",
          )}
        >
          <ListFilter className="h-4 w-4" aria-hidden />
          {filterCount > 0 && !filtersOpen && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-sky-500 px-0.5 text-[9px] font-semibold text-zinc-950"
              aria-hidden
            >
              {filterCount > 9 ? "9+" : filterCount}
            </span>
          )}
        </button>

        {!isInitialLoad && filteredCount > 0 && (
          <button
            type="button"
            disabled={isBulkBusy}
            aria-pressed={selectionMode}
            aria-label={
              selectionMode
                ? selectedCount > 0
                  ? `${selectedCount} selected, exit selection`
                  : "Exit selection mode"
                : "Select events"
            }
            onClick={onToggleSelectionMode}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition ring-1 ring-inset",
              selectionMode
                ? "bg-sky-500/15 text-sky-200 ring-sky-500/25"
                : "text-zinc-500 ring-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-300",
            )}
          >
            <CheckSquare className="h-4 w-4 shrink-0" aria-hidden />
            {selectionMode ? (selectedCount > 0 ? selectedCount : "Done") : null}
          </button>
        )}
      </div>
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
