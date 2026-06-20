import { ScrollText } from "lucide-react";
import { CHANGELOG } from "@/lib/changelog";
import { WebsiteLink } from "@/components/website-link";
import {
  accentBulletClass,
  accentPageBannerClass,
  accentSectionClass,
  accentSectionHeaderClass,
  accentSoftCardClass,
  changelogToneForVersion,
} from "@/lib/accent-tones";
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
}: ChangelogSectionProps) => {
  const tone = changelogToneForVersion(version, isLatest);

  return (
    <section
      className={cn(
        accentSectionClass(tone),
        isLatest && "ring-1 ring-inset ring-violet-500/20",
      )}
    >
      <div className={accentSectionHeaderClass(tone)}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">v{version}</h2>
            {isLatest && (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200 ring-1 ring-inset ring-violet-500/30">
                Latest
              </span>
            )}
          </div>
          <time className="text-[11px] text-zinc-500" dateTime={date}>
            {date}
          </time>
        </div>
      </div>
      <ul className="space-y-2 px-5 py-4">
        {highlights.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-relaxed text-zinc-400"
          >
            <span
              className={cn(
                "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                accentBulletClass(tone),
              )}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const ChangelogView = () => (
  <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 lg:p-6">
      <header className={accentPageBannerClass("violet")}>
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-violet-300" aria-hidden />
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Changelog</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
          What changed in each release. Updates install in-app from Settings → About with a
          full-screen progress overlay — no need to download installers manually after your first
          install.
        </p>
        <WebsiteLink className="mt-2" />
      </header>

      <div className={cn("rounded-xl border px-4 py-3 text-xs leading-relaxed text-zinc-500", accentSoftCardClass("sky"))}>
        Tip: open <span className="text-sky-300/90">Settings → About</span> to check for updates or
        install the latest build.
      </div>

      <div className="flex flex-col gap-3">
        {CHANGELOG.map((entry, index) => (
          <ChangelogSection key={entry.version} {...entry} isLatest={index === 0} />
        ))}
      </div>
    </div>
  </div>
);
