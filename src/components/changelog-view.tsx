import { ScrollText } from "lucide-react";
import { CHANGELOG } from "@/lib/changelog";
import { cn } from "@/lib/utils";

type ChangelogSectionProps = {
  version: string;
  date: string;
  highlights: string[];
  isLatest?: boolean;
};

const ChangelogSection = ({
  version,
  date,
  highlights,
  isLatest = false,
}: ChangelogSectionProps) => (
  <section
    className={cn(
      "overflow-hidden rounded-xl border bg-zinc-900/30",
      isLatest ? "border-sky-500/30 ring-1 ring-sky-500/10" : "border-zinc-800",
    )}
  >
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800/80 px-5 py-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-zinc-100">v{version}</h2>
        {isLatest && (
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-300 ring-1 ring-sky-500/30">
            Latest
          </span>
        )}
      </div>
      <time className="text-[11px] text-zinc-600" dateTime={date}>
        {date}
      </time>
    </div>
    <ul className="space-y-2 px-5 py-4">
      {highlights.map((item) => (
        <li
          key={item}
          className="flex gap-2 text-sm leading-relaxed text-zinc-400 before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-zinc-600 before:content-['']"
        >
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </section>
);

export const ChangelogView = () => (
  <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 lg:p-6">
      <header>
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-sky-400" aria-hidden />
          <h1 className="text-lg font-semibold tracking-tight">Changelog</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
          What changed in each release. Updates install in-app from Settings → About — no need to
          download installers manually after your first install.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {CHANGELOG.map((entry, index) => (
          <ChangelogSection key={entry.version} {...entry} isLatest={index === 0} />
        ))}
      </div>
    </div>
  </div>
);
