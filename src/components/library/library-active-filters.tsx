import { X } from "lucide-react";
import {
  DATE_RANGE_OPTIONS,
  MIN_CAMERAS_OPTIONS,
  SOURCE_OPTIONS,
} from "@/lib/library-filters";
import type { LibraryDateRange, LibraryMinCameras } from "@/lib/library-preferences";
import { sourceBadgeClass } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

type LibraryActiveFiltersProps = {
  searchInput: string;
  sourceFilter?: string;
  tagFilter?: string;
  dateRange: LibraryDateRange;
  minCameras: LibraryMinCameras;
  onClearSearch: () => void;
  onSourceFilterChange: (value: string | undefined) => void;
  onTagFilterChange: (value: string | undefined) => void;
  onDateRangeChange: (value: LibraryDateRange) => void;
  onMinCamerasChange: (value: LibraryMinCameras) => void;
  onClearAll: () => void;
};

const labelForOption = <T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
) => options.find((option) => option.value === value)?.label ?? value;

export const LibraryActiveFilters = ({
  searchInput,
  sourceFilter,
  tagFilter,
  dateRange,
  minCameras,
  onClearSearch,
  onSourceFilterChange,
  onTagFilterChange,
  onDateRangeChange,
  onMinCamerasChange,
  onClearAll,
}: LibraryActiveFiltersProps) => {
  const chips: FilterChip[] = [];

  const trimmedSearch = searchInput.trim();
  if (trimmedSearch) {
    chips.push({
      id: "search",
      label: `Search: ${trimmedSearch}`,
      onRemove: onClearSearch,
    });
  }

  if (sourceFilter) {
    chips.push({
      id: "source",
      label: labelForOption(SOURCE_OPTIONS, sourceFilter),
      onRemove: () => onSourceFilterChange(undefined),
    });
  }

  if (tagFilter) {
    chips.push({
      id: "tag",
      label: `Tag: ${tagFilter}`,
      onRemove: () => onTagFilterChange(undefined),
    });
  }

  if (dateRange !== "all") {
    chips.push({
      id: "date",
      label: labelForOption(DATE_RANGE_OPTIONS, dateRange),
      onRemove: () => onDateRangeChange("all"),
    });
  }

  if (minCameras !== "any") {
    chips.push({
      id: "cameras",
      label: labelForOption(MIN_CAMERAS_OPTIONS, minCameras),
      onRemove: () => onMinCamerasChange("any"),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className={cn(
            "inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition hover:opacity-90",
            chip.id === "source" && sourceFilter
              ? sourceBadgeClass(sourceFilter)
              : "bg-zinc-900 text-zinc-400 ring-zinc-800 hover:bg-zinc-800/80 hover:text-zinc-300",
          )}
          aria-label={`Remove filter: ${chip.label}`}
        >
          <span className="truncate">{chip.label}</span>
          <X className="h-2.5 w-2.5 shrink-0 opacity-60" aria-hidden />
        </button>
      ))}
      {chips.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-5 px-1.5 text-[10px] text-zinc-600 hover:text-zinc-400"
        >
          Clear
        </Button>
      )}
    </div>
  );
};
