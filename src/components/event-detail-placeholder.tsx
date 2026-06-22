import type { ReactNode } from "react";
import { FolderOpen, HelpCircle } from "lucide-react";
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
  onHelp?: () => void;
  onClearFilters?: () => void;
};

const PLACEHOLDER_COPY: Record<
  EventDetailPlaceholderReason,
  { title: string; subtitle: string; footnote?: string }
> = {
  "pick-event": {
    title: "Nothing playing yet",
    subtitle: "Select an event from the library to start reviewing footage.",
    footnote: "Dashcam's ready. Pick an event when you want to review.",
  },
  "empty-library": {
    title: "No footage yet",
    subtitle: "Import your Tesla clips and this screen turns into a review bay.",
  },
  "no-matches": {
    title: "No events in this lane",
    subtitle: "Your filters hid everything. Widen the search or clear a filter.",
  },
  "archived-empty": {
    title: "Archive is empty",
    subtitle: "Archived events land here when you're done with them.",
  },
};

const PLACEHOLDER_ILLUSTRATION: Record<EventDetailPlaceholderReason, ReactNode> = {
  "pick-event": <DashcamRecEmpty />,
  "empty-library": <DashcamRecEmpty />,
  "no-matches": <FilterEmptyIllustration />,
  "archived-empty": <ArchiveEmptyIllustration />,
};

export const EventDetailPlaceholder = ({
  reason,
  libraryView,
  listOpen,
  canBrowseEvents,
  onShowLibrary,
  onImport,
  onHelp,
  onClearFilters,
}: EventDetailPlaceholderProps) => {
  const copy = PLACEHOLDER_COPY[reason];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-hidden bg-black p-8 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.08),transparent_65%)]"
        aria-hidden
      />

      <div className="relative z-[1]">{PLACEHOLDER_ILLUSTRATION[reason]}</div>

      <div className="relative z-[1] max-w-md space-y-2">
        <p className="text-base font-medium text-zinc-200">{copy.title}</p>
        <p className="text-sm leading-relaxed text-zinc-500">{copy.subtitle}</p>
        {copy.footnote && (
          <p className="text-xs italic text-zinc-600">{copy.footnote}</p>
        )}
      </div>

      <div className="relative z-[1] flex flex-wrap items-center justify-center gap-2">
        {!listOpen && (
          <Button type="button" variant="outline" size="sm" onClick={onShowLibrary}>
            Show library
          </Button>
        )}

        {reason === "empty-library" && libraryView === "active" && onImport && (
          <>
            <Button type="button" size="sm" onClick={onImport}>
              <FolderOpen className="h-4 w-4" aria-hidden />
              Import footage
            </Button>
            {onHelp && (
              <Button type="button" variant="outline" size="sm" onClick={onHelp}>
                <HelpCircle className="h-4 w-4" aria-hidden />
                View guide
              </Button>
            )}
          </>
        )}

        {reason === "no-matches" && onClearFilters && (
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {canBrowseEvents && reason === "pick-event" && (
        <p className="relative z-[1] flex items-center gap-1 text-xs text-zinc-600">
          Use <kbd className="rounded bg-zinc-800 px-1 py-0.5">j</kbd>{" "}
          <kbd className="rounded bg-zinc-800 px-1 py-0.5">k</kbd> to browse
        </p>
      )}
    </div>
  );
};
