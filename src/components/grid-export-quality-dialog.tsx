import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GridExportQuality } from "@/lib/grid-export-quality";
import {
  GRID_EXPORT_QUALITY_DESCRIPTIONS,
  GRID_EXPORT_QUALITY_LABELS,
  GRID_EXPORT_QUALITY_OPTIONS,
} from "@/lib/grid-export-quality";
import { cn } from "@/lib/utils";

type GridExportQualityDialogProps = {
  open: boolean;
  initialQuality: GridExportQuality;
  onConfirm: (quality: GridExportQuality) => void;
  onCancel: () => void;
};

export const GridExportQualityDialog = ({
  open,
  initialQuality,
  onConfirm,
  onCancel,
}: GridExportQualityDialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const [selected, setSelected] = useState(initialQuality);

  useEffect(() => {
    if (open) {
      setSelected(initialQuality);
    }
  }, [initialQuality, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-base font-semibold text-zinc-100">
          Grid export quality
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-zinc-400">
          Choose resolution and compression for the multi-camera grid MP4. ZIP exports are
          ZIP exports are unchanged (full camera files only).
        </p>

        <ul className="mt-4 space-y-2" role="listbox" aria-label="Grid export quality">
          {GRID_EXPORT_QUALITY_OPTIONS.map((quality) => {
            const isSelected = selected === quality;

            return (
              <li key={quality}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition",
                    isSelected
                      ? "border-violet-500/50 bg-violet-500/10 ring-1 ring-inset ring-violet-500/30"
                      : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/80",
                  )}
                  onClick={() => setSelected(quality)}
                >
                  <span className="text-sm font-medium text-zinc-100">
                    {GRID_EXPORT_QUALITY_LABELS[quality]}
                  </span>
                  <span className="mt-0.5 text-xs text-zinc-500">
                    {GRID_EXPORT_QUALITY_DESCRIPTIONS[quality]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-violet-600 text-white hover:bg-violet-500"
            onClick={() => onConfirm(selected)}
          >
            Choose save location
          </Button>
        </div>
      </div>
    </div>
  );
};
