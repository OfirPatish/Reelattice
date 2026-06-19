import { useCallback, useState, type FocusEvent } from "react";
import { cn } from "@/lib/utils";

export const useInlineActionLabel = () => {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const hoverProps = useCallback(
    (label: string) => ({
      onMouseEnter: () => setHoveredLabel(label),
      onFocus: () => setHoveredLabel(label),
    }),
    [],
  );

  const clearHover = useCallback(() => setHoveredLabel(null), []);

  const handleBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setHoveredLabel(null);
    }
  }, []);

  return { hoveredLabel, hoverProps, clearHover, handleBlur };
};

type InlineActionLabelProps = {
  label: string | null;
  className?: string;
};

export const InlineActionLabel = ({ label, className }: InlineActionLabelProps) => {
  if (!label) return null;

  return (
    <span
      className={cn("text-xs font-medium text-zinc-300 whitespace-nowrap", className)}
      aria-live="polite"
    >
      {label}
    </span>
  );
};

type InlineActionHintRowProps = {
  label: string | null;
  className?: string;
};

export const InlineActionHintRow = ({ label, className }: InlineActionHintRowProps) => (
  <div
    className={cn("h-4 text-center text-xs font-medium text-zinc-300", className)}
    aria-live="polite"
  >
    {label ?? ""}
  </div>
);
