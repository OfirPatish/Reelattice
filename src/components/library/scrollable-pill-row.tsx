import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScrollablePillRowProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

const ARROW_SLOT_CLASS =
  "absolute top-1/2 z-[2] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/90 text-zinc-400 shadow-sm transition-opacity duration-150 hover:text-zinc-200";

export const ScrollablePillRow = ({
  children,
  className,
  ariaLabel,
}: ScrollablePillRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollLeft, scrollWidth, clientWidth } = element;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateScrollState();

    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, children]);

  const handleScrollBy = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    const amount = Math.max(120, element.clientWidth * 0.6);
    element.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-zinc-900/95 to-transparent transition-opacity duration-150",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <button
        type="button"
        onClick={() => handleScrollBy("left")}
        tabIndex={canScrollLeft ? 0 : -1}
        aria-hidden={!canScrollLeft}
        className={cn(
          ARROW_SLOT_CLASS,
          "left-0",
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Scroll tags left"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      <div
        ref={scrollRef}
        role={ariaLabel ? "group" : undefined}
        aria-label={ariaLabel}
        className="flex gap-1.5 overflow-x-auto scroll-smooth px-8 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-zinc-900/95 to-transparent transition-opacity duration-150",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
      <button
        type="button"
        onClick={() => handleScrollBy("right")}
        tabIndex={canScrollRight ? 0 : -1}
        aria-hidden={!canScrollRight}
        className={cn(
          ARROW_SLOT_CLASS,
          "right-0",
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="Scroll tags for more options"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
};
