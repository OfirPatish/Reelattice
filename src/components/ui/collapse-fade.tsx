import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CollapseFadeProps = {
  show: boolean;
  children: ReactNode;
  className?: string;
  durationMs?: number;
};

export const CollapseFade = ({
  show,
  children,
  className,
  durationMs = 200,
}: CollapseFadeProps) => (
  <div
    className={cn(
      "grid ease-out",
      show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      className,
    )}
    style={{ transitionProperty: "grid-template-rows, opacity", transitionDuration: `${durationMs}ms` }}
    aria-hidden={!show}
  >
    <div className="overflow-hidden">{children}</div>
  </div>
);
