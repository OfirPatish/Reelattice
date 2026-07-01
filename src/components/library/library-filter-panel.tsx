import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATE_RANGE_OPTIONS,
  LIST_WIDTH_OPTIONS,
  MIN_CAMERAS_OPTIONS,
  SORT_OPTIONS,
  SOURCE_PILL_OPTIONS,
} from "@/lib/library-filters";
import type {
  LibraryDateRange,
  LibraryMinCameras,
  LibraryPreferences,
  LibrarySort,
} from "@/lib/library-preferences";
import type { TagInfo } from "@/lib/types";
import { sourceFilterPillClass } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FilterField } from "./filter-field";

const SELECT_CLOSE_GUARD_MS = 400;

type LibraryFilterPanelProps = {
  open: boolean;
  isInitialLoad: boolean;
  sourceFilter?: string;
  tagFilter?: string;
  tags: TagInfo[];
  prefs: LibraryPreferences;
  onSourceFilterChange: (value: string | undefined) => void;
  onTagFilterChange: (value: string | undefined) => void;
  onPrefsChange: (patch: Partial<LibraryPreferences>) => void;
};

export const LibraryFilterPanel = ({
  open,
  isInitialLoad,
  sourceFilter,
  tagFilter,
  tags,
  prefs,
  onSourceFilterChange,
  onTagFilterChange,
  onPrefsChange,
}: LibraryFilterPanelProps) => {
  const suppressCloseRef = useRef(false);

  const handleSelectOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    suppressCloseRef.current = true;
    window.setTimeout(() => {
      suppressCloseRef.current = false;
    }, SELECT_CLOSE_GUARD_MS);
  };

  if (!open) return null;

  return (
    <div
      className="space-y-3 rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3"
    >
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
                "rounded-full px-2.5 py-1 text-xs font-medium transition",
                sourceFilterPillClass(option.value, isActive),
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FilterField label="Tag">
          <Select
            value={tagFilter ?? "all"}
            onValueChange={(value) => onTagFilterChange(value === "all" ? undefined : value)}
            onOpenChange={handleSelectOpenChange}
            disabled={isInitialLoad}
          >
            <SelectTrigger aria-label="Filter by tag" className="h-9 min-w-0 text-sm">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.name}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Sort">
          <Select
            value={prefs.sort}
            onValueChange={(value) => onPrefsChange({ sort: value as LibrarySort })}
            onOpenChange={handleSelectOpenChange}
            disabled={isInitialLoad}
          >
            <SelectTrigger aria-label="Sort events" className="h-9 min-w-0 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Date">
          <Select
            value={prefs.dateRange}
            onValueChange={(value) =>
              onPrefsChange({ dateRange: value as LibraryDateRange })
            }
            onOpenChange={handleSelectOpenChange}
            disabled={isInitialLoad}
          >
            <SelectTrigger aria-label="Filter by date" className="h-9 min-w-0 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Cameras">
          <Select
            value={prefs.minCameras}
            onValueChange={(value) =>
              onPrefsChange({ minCameras: value as LibraryMinCameras })
            }
            onOpenChange={handleSelectOpenChange}
            disabled={isInitialLoad}
          >
            <SelectTrigger aria-label="Minimum cameras" className="h-9 min-w-0 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MIN_CAMERAS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-900/60">
          <input
            type="checkbox"
            checked={prefs.showNotesInList}
            onChange={(e) => onPrefsChange({ showNotesInList: e.target.checked })}
            className="size-3.5 shrink-0 rounded border-zinc-700 bg-zinc-950 text-sky-500 focus:ring-0 focus:ring-offset-0"
          />
          Note previews
        </label>

        <Select
          value={prefs.listWidth}
          onValueChange={(value) =>
            onPrefsChange({ listWidth: value as LibraryPreferences["listWidth"] })
          }
          onOpenChange={handleSelectOpenChange}
          disabled={isInitialLoad}
        >
          <SelectTrigger
            aria-label="List panel width"
            className="h-8 w-auto min-w-0 gap-1 border-0 bg-transparent px-2 text-xs text-zinc-500 shadow-none ring-0 hover:bg-zinc-900/60 hover:text-zinc-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIST_WIDTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
