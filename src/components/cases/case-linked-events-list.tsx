import { Trash2, Video } from "lucide-react";
import { formatEventTime } from "@/lib/format";
import type { DashEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";

type CaseLinkedEventsListProps = {
  events: DashEvent[];
  saving: boolean;
  onOpenEvent?: (eventId: string) => void;
  onRemoveEvent: (eventId: string) => void;
};

export const CaseLinkedEventsList = ({
  events,
  saving,
  onOpenEvent,
  onRemoveEvent,
}: CaseLinkedEventsListProps) => {
  if (events.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-4">
        <div className="mx-2 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 px-4 py-8 text-center">
          <Video className="mx-auto h-8 w-8 text-zinc-700" aria-hidden />
          <p className="mt-3 text-sm text-zinc-400">No events linked yet</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            In Library, bulk-select footage and choose Add to case.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <ul className="space-y-2 px-2" aria-label="Linked events">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3 transition hover:border-zinc-700/80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-500">
              <Video className="h-4 w-4" aria-hidden />
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onOpenEvent?.(event.id)}
            >
              <p className="truncate text-sm font-medium text-zinc-100">
                {formatEventTime(event.eventTime)}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {event.clips.length} cameras · {event.tags.join(", ") || "No tags"}
              </p>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-zinc-500 hover:text-red-300"
              aria-label={`Remove ${formatEventTime(event.eventTime)} from case`}
              onClick={() => onRemoveEvent(event.id)}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
