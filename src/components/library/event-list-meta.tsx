import { formatEventTime, getSourceDotClass, sourceLabel } from "@/lib/format";
import type { DashEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventListMetaProps = {
  event: DashEvent;
  showNotes: boolean;
};

export const EventListMeta = ({ event, showNotes }: EventListMetaProps) => {
  const noteText = event.note.trim();
  const displayNote = noteText || "No note yet";
  const dotClass = getSourceDotClass(event.source);

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium leading-snug text-zinc-100">
        {formatEventTime(event.eventTime)}
      </p>

      <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
          aria-hidden
        />
        <span className="truncate">{sourceLabel(event.source)}</span>
        <span className="text-zinc-700" aria-hidden>
          ·
        </span>
        <span className="shrink-0">
          {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
        </span>
      </div>

      {event.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {event.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="max-w-[5rem] truncate rounded bg-zinc-800/60 px-1.5 py-px text-[10px] text-zinc-500"
            >
              {tag}
            </span>
          ))}
          {event.tags.length > 2 && (
            <span className="text-[10px] text-zinc-600">+{event.tags.length - 2}</span>
          )}
        </div>
      )}

      {showNotes && (
        <p
          title={noteText.length > 0 ? noteText : undefined}
          className={cn(
            "mt-1 line-clamp-2 break-words text-xs leading-relaxed [overflow-wrap:anywhere]",
            noteText ? "text-zinc-500" : "italic text-zinc-600",
          )}
        >
          {displayNote}
        </p>
      )}
    </div>
  );
};
