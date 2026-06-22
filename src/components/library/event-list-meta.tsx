import { formatEventTime, sourceBadgeClass, sourceLabel } from "@/lib/format";
import type { DashEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventListMetaProps = {
  event: DashEvent;
  showNotes: boolean;
};

export const EventListMeta = ({ event, showNotes }: EventListMetaProps) => {
  const noteText = event.note.trim();
  const displayNote = noteText || "No note yet";

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-snug text-zinc-100">
            {formatEventTime(event.eventTime)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ring-1 ring-inset",
            sourceBadgeClass(event.source),
          )}
        >
          {sourceLabel(event.source)}
        </span>
      </div>

      {event.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {event.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="max-w-[5.5rem] truncate rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400"
            >
              {tag}
            </span>
          ))}
          {event.tags.length > 3 && (
            <span className="text-[10px] text-zinc-600">+{event.tags.length - 3}</span>
          )}
        </div>
      )}

      {showNotes && (
        <p
          title={noteText.length > 0 ? noteText : undefined}
          className={cn(
            "mt-1.5 line-clamp-2 break-words text-xs leading-relaxed [overflow-wrap:anywhere]",
            noteText ? "text-zinc-400" : "italic text-zinc-600",
          )}
        >
          {displayNote}
        </p>
      )}
    </div>
  );
};
