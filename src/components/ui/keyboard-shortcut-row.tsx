import type { KeyboardShortcut } from "@/lib/keyboard-shortcuts";

export const KeyboardShortcutRow = ({
  description,
  keyGroups,
}: KeyboardShortcut) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <span className="text-sm text-zinc-300">{description}</span>
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {keyGroups.map((group, groupIndex) => (
        <span key={`${description}-group-${groupIndex}`} className="flex items-center gap-2">
          {groupIndex > 0 && <span className="text-[10px] text-zinc-600">or</span>}
          <span className="flex items-center gap-1">
            {group.map((key, keyIndex) => (
              <span key={`${description}-${key}-${keyIndex}`} className="flex items-center gap-1">
                {keyIndex > 0 && <span className="text-[10px] text-zinc-600">+</span>}
                <kbd className="rounded-md border border-zinc-700/60 bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">
                  {key}
                </kbd>
              </span>
            ))}
          </span>
        </span>
      ))}
    </div>
  </div>
);
