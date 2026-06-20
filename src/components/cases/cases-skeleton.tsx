const CASE_LIST_SKELETON_ROWS = 5;
const CASE_LINKED_EVENT_SKELETON_ROWS = 3;

export const CaseListSkeleton = () => (
  <ul className="space-y-1 px-2" aria-hidden>
    {Array.from({ length: CASE_LIST_SKELETON_ROWS }, (_, index) => (
      <li key={index} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-zinc-800" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-800/60" />
        </div>
      </li>
    ))}
  </ul>
);

export const CaseDetailSkeleton = () => (
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-hidden>
    <div className="shrink-0 border-b border-zinc-800/80 px-5 py-4">
      <div className="h-3 w-20 animate-pulse rounded bg-zinc-800/60" />
      <div className="mt-3 h-5 w-48 animate-pulse rounded bg-zinc-800" />
      <div className="mt-2 h-3 w-36 animate-pulse rounded bg-zinc-800/60" />
    </div>

    <div className="space-y-4 px-5 py-4">
      <div className="h-3 w-12 animate-pulse rounded bg-zinc-800/60" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-800/80" />
      <div className="h-3 w-24 animate-pulse rounded bg-zinc-800/60" />
      <div className="h-20 w-full animate-pulse rounded-lg bg-zinc-800/80" />
      <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-950/40" />
    </div>

    <div className="flex min-h-36 flex-1 flex-col border-t border-zinc-800/80">
      <div className="px-5 py-3">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-800/60" />
      </div>
      <div className="flex-1 space-y-2 px-5 pb-4">
        {Array.from({ length: CASE_LINKED_EVENT_SKELETON_ROWS }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-zinc-800/80" />
        ))}
      </div>
    </div>
  </div>
);
