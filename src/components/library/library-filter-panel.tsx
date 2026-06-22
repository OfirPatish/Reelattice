import { useRef } from "react";
import { ChevronDown, List } from "lucide-react";
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
} from "@/lib/library-filters";
import type {
  LibraryDateRange,
  LibraryMinCameras,
  LibraryPreferences,
  LibrarySort,
} from "@/lib/library-preferences";
import type { TagInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FilterField } from "./filter-field";

const SELECT_CLOSE_GUARD_MS = 400;

type LibraryFilterPanelProps = {
  expanded: boolean;
  isInitialLoad: boolean;
  tagFilter?: string;
  tags: TagInfo[];
  prefs: LibraryPreferences;
  onToggleExpanded: () => void;
  onTagFilterChange: (value: string | undefined) => void;
  onPrefsChange: (patch: Partial<LibraryPreferences>) => void;
};

export const LibraryFilterPanel = ({
  expanded,
  isInitialLoad,
  tagFilter,
  tags,
  prefs,
  onToggleExpanded,
  onTagFilterChange,
  onPrefsChange,
}: LibraryFilterPanelProps) => {
  const suppressToggleRef = useRef(false);

  const handleSelectOpenChange = (open: boolean) => {
    if (open) return;

    suppressToggleRef.current = true;
    window.setTimeout(() => {
      suppressToggleRef.current = false;
    }, SELECT_CLOSE_GUARD_MS);
  };

  const handleToggleExpanded = () => {
    if (suppressToggleRef.current) return;
    onToggleExpanded();
  };

  const listOptionsActive =
    prefs.dateRange !== "all" ||
    prefs.minCameras !== "any" ||
    prefs.listWidth !== "default" ||
    prefs.showNotesInList;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <FilterField label="Tag">
          <Select
            value={tagFilter ?? "all"}
            onValueChange={(value) => onTagFilterChange(value === "all" ? undefined : value)}
            onOpenChange={handleSelectOpenChange}
            disabled={isInitialLoad}
          >
            <SelectTrigger aria-label="Filter by tag" className="h-8 min-w-0 text-xs">
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
            <SelectTrigger aria-label="Sort events" className="h-8 min-w-0 text-xs">
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
      </div>

      <button
        type="button"
        onClick={handleToggleExpanded}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-900/60 hover:text-zinc-300"
      >
        <span className="flex items-center gap-2">
          <List className="h-3.5 w-3.5 shrink-0" aria-hidden />
          More filters
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              listOptionsActive
                ? "bg-zinc-800 text-zinc-300"
                : "invisible",
            )}
            aria-hidden={!listOptionsActive}
          >
            On
          </span>
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="space-y-3 rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-3">
          <div className="grid grid-cols-2 gap-2">
            <FilterField label="Date">
              <Select
                value={prefs.dateRange}
                onValueChange={(value) =>
                  onPrefsChange({ dateRange: value as LibraryDateRange })
                }
                onOpenChange={handleSelectOpenChange}
                disabled={isInitialLoad}
              >
                <SelectTrigger aria-label="Filter by date" className="h-8 min-w-0 text-xs">
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

            <FilterField label="Min cameras">
              <Select
                value={prefs.minCameras}
                onValueChange={(value) =>
                  onPrefsChange({ minCameras: value as LibraryMinCameras })
                }
                onOpenChange={handleSelectOpenChange}
                disabled={isInitialLoad}
              >
                <SelectTrigger aria-label="Minimum cameras" className="h-8 min-w-0 text-xs">
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

          <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3">
            <FilterField label="Panel width">
              <Select
                value={prefs.listWidth}
                onValueChange={(value) =>
                  onPrefsChange({ listWidth: value as LibraryPreferences["listWidth"] })
                }
                onOpenChange={handleSelectOpenChange}
                disabled={isInitialLoad}
              >
                <SelectTrigger aria-label="List panel width" className="h-8 min-w-0 text-xs">
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
            </FilterField>

            <FilterField label="Notes in list">
              <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={prefs.showNotesInList}
                  onChange={(e) => onPrefsChange({ showNotesInList: e.target.checked })}
                  className="size-3.5 shrink-0 rounded border-zinc-700 bg-zinc-950 text-sky-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="truncate">Show note previews</span>
              </label>
            </FilterField>
          </div>
        </div>
      )}
    </div>
  );
};
