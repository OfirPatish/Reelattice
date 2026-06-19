import { formatEventTime, sourceBadgeClass, sourceLabel } from "@/lib/format";
import type { DashEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventListMetaProps = {
  event: DashEvent;
  showNotes: boolean;
};

export const EventListMeta = ({ event, showNotes }: EventListMetaProps) => (
  <div className="min-w-0 flex-1">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-medium leading-snug text-zinc-100">
        {formatEventTime(event.eventTime)}
      </p>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ring-1 ring-inset",
          sourceBadgeClass(event.source),
        )}
      >
        {sourceLabel(event.source)}
      </span>
    </div>
    <p className="mt-1 text-xs text-zinc-500">
      {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
      {event.tags.length > 0 && (
        <>
          {" · "}
          {event.tags.slice(0, 2).join(", ")}
          {event.tags.length > 2 && ` +${event.tags.length - 2}`}
        </>
      )}
    </p>
    {showNotes && (
      <p
        className={cn(
          "mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-zinc-400",
          !event.note.trim() && "opacity-0",
        )}
        aria-hidden={!event.note.trim()}
      >
        {event.note.trim() || "No note"}
      </p>
    )}
  </div>
);
