import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { DashcamRecEmpty } from "@/components/dashcam-rec-empty";
import {
  ArchiveEmptyIllustration,
  FilterEmptyIllustration,
} from "@/components/empty-illustrations";
import type { LibraryView } from "@/lib/library-filters";
import { Button } from "@/components/ui/button";

export type EventDetailPlaceholderReason =
  | "pick-event"
  | "empty-library"
  | "no-matches"
  | "archived-empty";

type EventDetailPlaceholderProps = {
  reason: EventDetailPlaceholderReason;
  libraryView: LibraryView;
  listOpen: boolean;
  canBrowseEvents: boolean;
  onShowLibrary: () => void;
  onImport?: () => void;
  onClearFilters?: () => void;
};

const PLACEHOLDER_COPY: Record<
  EventDetailPlaceholderReason,
  { title: string; subtitle: string }
> = {
  "pick-event": {
    title: "Select an event",
    subtitle: "Pick one from the library to review footage.",
  },
  "empty-library": {
    title: "No footage yet",
    subtitle: "Import Tesla clips to get started.",
  },
  "no-matches": {
    title: "No matches",
    subtitle: "Try clearing a filter or widening your search.",
  },
  "archived-empty": {
    title: "Archive is empty",
    subtitle: "Archived events appear here.",
  },
};

const PLACEHOLDER_ILLUSTRATION: Record<EventDetailPlaceholderReason, ReactNode> = {
  "pick-event": <DashcamRecEmpty />,
  "empty-library": <DashcamRecEmpty />,
  "no-matches": <FilterEmptyIllustration size="compact" />,
  "archived-empty": <ArchiveEmptyIllustration size="compact" />,
};

export const EventDetailPlaceholder = ({
  reason,
  libraryView,
  listOpen,
  canBrowseEvents,
  onShowLibrary,
  onImport,
  onClearFilters,
}: EventDetailPlaceholderProps) => {
  const copy = PLACEHOLDER_COPY[reason];
  const showIllustration = reason === "pick-event" || reason === "empty-library";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-hidden bg-black p-6 text-center">
      {showIllustration && (
        <div className="relative z-[1] scale-90 opacity-90">{PLACEHOLDER_ILLUSTRATION[reason]}</div>
      )}

      {!showIllustration && (
        <div className="relative z-[1]">{PLACEHOLDER_ILLUSTRATION[reason]}</div>
      )}

      <div className="relative z-[1] max-w-xs space-y-1">
        <p className="text-sm font-medium text-zinc-300">{copy.title}</p>
        <p className="text-sm leading-relaxed text-zinc-500">{copy.subtitle}</p>
      </div>

      <div className="relative z-[1] flex flex-wrap items-center justify-center gap-2">
        {!listOpen && (
          <Button type="button" variant="outline" size="sm" onClick={onShowLibrary}>
            Show library
          </Button>
        )}

        {reason === "empty-library" && libraryView === "active" && onImport && (
          <Button type="button" size="sm" onClick={onImport}>
            <FolderOpen className="h-3.5 w-3.5" aria-hidden />
            Import
          </Button>
        )}

        {reason === "no-matches" && onClearFilters && (
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {canBrowseEvents && reason === "pick-event" && (
        <p className="relative z-[1] text-[11px] text-zinc-700">
          <kbd className="rounded bg-zinc-900 px-1 py-px text-zinc-500">j</kbd>
          {" / "}
          <kbd className="rounded bg-zinc-900 px-1 py-px text-zinc-500">k</kbd>
          {" to browse"}
        </p>
      )}
    </div>
  );
};
