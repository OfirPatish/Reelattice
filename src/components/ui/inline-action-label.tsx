import { useCallback, useState, type FocusEvent } from "react";

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

type InlineActionHintRowProps = {
  label: string | null;
  className?: string;
};

export const InlineActionHintRow = ({ label, className }: InlineActionHintRowProps) => (
  <div
    className={className ?? "h-4 text-center text-sm font-medium text-zinc-300"}
    aria-live="polite"
  >
    {label ?? ""}
  </div>
);
