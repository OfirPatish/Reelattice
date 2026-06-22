import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useEffect, type RefObject } from "react";
import { secondaryListItemClass } from "@/components/layout/secondary-view-layout";
import { formatEventTime } from "@/lib/format";
import type { DashEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { EventListMeta } from "./event-list-meta";
import { EventThumbnail } from "./event-thumbnail";

const ROW_HEIGHT_DEFAULT = 72;
const ROW_HEIGHT_WITH_NOTES = 112;

type LibraryEventRowProps = {
  event: DashEvent;
  isActive: boolean;
  isChecked: boolean;
  selectionMode: boolean;
  showNotesInList: boolean;
  onSelectEvent: (eventId: string) => void;
  onToggleSelected: (
    eventId: string,
    checked: boolean,
    options?: { shiftKey?: boolean },
  ) => void;
};

const rowSurfaceClass = (isHighlighted: boolean, isArchived: boolean) =>
  cn(
    secondaryListItemClass(isHighlighted),
    "h-full gap-3",
    isArchived && !isHighlighted && "opacity-75",
  );

const LibraryEventRow = memo(
  ({
    event,
    isActive,
    isChecked,
    selectionMode,
    showNotesInList,
    onSelectEvent,
    onToggleSelected,
  }: LibraryEventRowProps) => {
    const handleRowClick = (shiftKey: boolean) => {
      onToggleSelected(event.id, !isChecked, { shiftKey });
    };

    const thumbClass = showNotesInList ? "h-12 w-[4.25rem] shrink-0" : "h-11 w-16 shrink-0";

    if (selectionMode) {
      return (
        <div
          role="button"
          tabIndex={0}
          aria-pressed={isChecked}
          aria-label={`Select ${formatEventTime(event.eventTime)}`}
          onClick={(clickEvent) => handleRowClick(clickEvent.shiftKey)}
          onKeyDown={(keydownEvent) => {
            if (keydownEvent.key !== "Enter" && keydownEvent.key !== " ") return;
            keydownEvent.preventDefault();
            handleRowClick(keydownEvent.shiftKey);
          }}
          className={rowSurfaceClass(isChecked, event.archived)}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => onToggleSelected(event.id, checked === true)}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
            aria-hidden
            tabIndex={-1}
            className="pointer-events-none mt-0.5 shrink-0"
          />
          <EventThumbnail clips={event.clips} className={thumbClass} />
          <EventListMeta event={event} showNotes={false} />
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onSelectEvent(event.id)}
        aria-current={isActive ? "true" : undefined}
        className={rowSurfaceClass(isActive, event.archived)}
      >
        <EventThumbnail clips={event.clips} className={thumbClass} />
        <EventListMeta event={event} showNotes={showNotesInList} />
      </button>
    );
  },
);

LibraryEventRow.displayName = "LibraryEventRow";

type LibraryEventRowsProps = {
  scrollElementRef: RefObject<HTMLDivElement | null>;
  events: DashEvent[];
  selectedId: string | null;
  selectionMode: boolean;
  selectedIds: Set<string>;
  showNotesInList: boolean;
  onSelectEvent: (eventId: string) => void;
  onToggleSelected: (
    eventId: string,
    checked: boolean,
    options?: { shiftKey?: boolean },
  ) => void;
};

export const LibraryEventRows = ({
  scrollElementRef,
  events,
  selectedId,
  selectionMode,
  selectedIds,
  showNotesInList,
  onSelectEvent,
  onToggleSelected,
}: LibraryEventRowsProps) => {
  const rowHeight = showNotesInList ? ROW_HEIGHT_WITH_NOTES : ROW_HEIGHT_DEFAULT;

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => scrollElementRef.current,
    getItemKey: (index) => events[index]?.id ?? index,
    estimateSize: () => rowHeight,
    overscan: 8,
    measureElement: showNotesInList
      ? (element) => element.getBoundingClientRect().height
      : undefined,
  });

  useEffect(() => {
    if (!selectedId) return;

    const index = events.findIndex((event) => event.id === selectedId);
    if (index < 0) return;

    virtualizer.scrollToIndex(index, { align: "auto" });
  }, [selectedId, events, virtualizer.scrollToIndex]);

  return (
    <div
      role="list"
      aria-label="Events"
      className="relative isolate w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const event = events[virtualRow.index];
        if (!event) return null;

        return (
          <div
            key={event.id}
            role="listitem"
            ref={showNotesInList ? virtualizer.measureElement : undefined}
            data-index={virtualRow.index}
            className="absolute left-0 top-0 w-full overflow-hidden border-b border-zinc-800/60 bg-zinc-950"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <LibraryEventRow
              event={event}
              isActive={event.id === selectedId}
              isChecked={selectedIds.has(event.id)}
              selectionMode={selectionMode}
              showNotesInList={showNotesInList}
              onSelectEvent={onSelectEvent}
              onToggleSelected={onToggleSelected}
            />
          </div>
        );
      })}
    </div>
  );
};
