import { CASE_TITLE_PRESETS } from "@/lib/case-presets";
import { cn } from "@/lib/utils";

type CaseTitlePresetsProps = {
  value: string;
  onSelect: (title: string) => void;
};

export const CaseTitlePresets = ({ value, onSelect }: CaseTitlePresetsProps) => (
  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Quick labels</p>
    <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
      Choose a preset or type your own title below.
    </p>
    <div
      className="mt-3 flex flex-wrap gap-1.5"
      role="list"
      aria-label="Case title presets"
    >
      {CASE_TITLE_PRESETS.map((preset) => {
        const isSelected = value === preset;
        return (
          <button
            key={preset}
            type="button"
            role="listitem"
            aria-pressed={isSelected}
            onClick={() => onSelect(preset)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition ring-1 ring-inset",
              isSelected
                ? "bg-violet-500/15 text-violet-200 ring-violet-500/30"
                : "bg-zinc-900/80 text-zinc-400 ring-zinc-800 hover:bg-zinc-800 hover:text-zinc-200",
            )}
          >
            {preset}
          </button>
        );
      })}
    </div>
  </div>
);
