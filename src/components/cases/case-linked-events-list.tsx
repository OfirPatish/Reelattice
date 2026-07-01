import { Trash2 } from "lucide-react";
import { formatEventTime, getSourceDotClass, sourceLabel } from "@/lib/format";
import type { DashEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <div className="mx-1 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">No events linked yet</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            In Library, bulk-select footage and choose Add to case.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-scroll-root className="min-h-0 flex-1 overflow-y-auto">
      <ul className="divide-y divide-zinc-800/80" aria-label="Linked events">
        {events.map((event) => (
          <li key={event.id}>
            <div className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-zinc-900/40">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onOpenEvent?.(event.id)}
              >
                <p className="truncate text-sm font-medium text-zinc-100">
                  {formatEventTime(event.eventTime)}
                </p>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", getSourceDotClass(event.source))}
                    aria-hidden
                  />
                  <span className="truncate">{sourceLabel(event.source)}</span>
                  <span className="text-zinc-700" aria-hidden>
                    ·
                  </span>
                  <span className="shrink-0">
                    {event.clips.length} cam{event.clips.length === 1 ? "" : "s"}
                  </span>
                  {event.tags.length > 0 && (
                    <>
                      <span className="text-zinc-700" aria-hidden>
                        ·
                      </span>
                      <span className="truncate">{event.tags.join(", ")}</span>
                    </>
                  )}
                </div>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-zinc-500 hover:text-red-300"
                aria-label={`Remove ${formatEventTime(event.eventTime)} from case`}
                onClick={() => onRemoveEvent(event.id)}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
