import type { ElementType, ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  as?: ElementType;
};

const hiddenOffset: Record<NonNullable<RevealProps["direction"]>, string> = {
  up: "translate-y-8",
  down: "-translate-y-8",
  left: "translate-x-8",
  right: "-translate-x-8",
  none: "",
};

export const Reveal = ({
  children,
  className,
  delay = 0,
  direction = "up",
  as: Tag = "div",
}: RevealProps) => {
  const { ref, inView } = useInView();
  const reducedMotion = useReducedMotion();

  return (
    <Tag
      ref={ref}
      className={cn(
        reducedMotion
          ? "opacity-100"
          : cn(
              "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              inView ? "translate-x-0 translate-y-0 opacity-100" : cn("opacity-0", hiddenOffset[direction]),
            ),
        className,
      )}
      style={reducedMotion ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};
