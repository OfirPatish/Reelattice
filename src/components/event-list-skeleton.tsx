const SKELETON_ROWS = 8;

export const EventListSkeleton = () => (
  <ul className="divide-y divide-zinc-800/80" aria-hidden>
    {Array.from({ length: SKELETON_ROWS }, (_, i) => (
      <li key={i} className="px-3 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-800/60" />
      </li>
    ))}
  </ul>
);

export const EventDetailSkeleton = () => (
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-hidden>
    <div className="h-12 shrink-0 animate-pulse border-b border-zinc-800 bg-zinc-900/50" />
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-h-0 flex-1 animate-pulse bg-zinc-800/80" />
      <div className="w-9 shrink-0 animate-pulse border-l border-zinc-800 bg-zinc-800/40" />
    </div>
  </div>
);
