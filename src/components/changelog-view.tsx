import { CHANGELOG } from "@/lib/changelog";
import {
  SecondarySection,
  SecondaryViewHeader,
  SecondaryViewRoot,
} from "@/components/layout/secondary-view-layout";
import { accentBulletClass, accentSoftCardClass } from "@/lib/accent-tones";
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
  <SecondarySection
    className={cn(isLatest && "ring-1 ring-inset ring-violet-500/15")}
    title={
      <span className="flex flex-wrap items-center gap-2">
        <span>v{version}</span>
        {isLatest && (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200 ring-1 ring-inset ring-violet-500/30">
            Latest
          </span>
        )}
      </span>
    }
    description={date}
    bodyClassName="px-5 py-4"
  >
    <ul className="space-y-2">
      {highlights.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-zinc-400">
          <span
            className={cn(
              "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
              isLatest ? accentBulletClass("violet") : "bg-zinc-600",
            )}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </SecondarySection>
);

export const ChangelogView = () => (
  <SecondaryViewRoot className="max-w-3xl gap-5">
    <SecondaryViewHeader
      title="Changelog"
      description="What changed in each release. Updates install in-app from Settings → About with a full-screen progress overlay. No need to download installers manually after your first install."
    />

    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-xs leading-relaxed text-zinc-500",
        accentSoftCardClass("sky"),
      )}
    >
      Tip: open <span className="text-sky-300/90">Settings → About</span> to check for updates or
      install the latest build.
    </div>

    <div className="flex flex-col gap-4">
      {CHANGELOG.map((entry, index) => (
        <ChangelogSection key={entry.version} {...entry} isLatest={index === 0} />
      ))}
    </div>
  </SecondaryViewRoot>
);
