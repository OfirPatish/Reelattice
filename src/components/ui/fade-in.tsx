import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Re-run the fade when this value changes. */
  refreshKey?: string | number;
  durationMs?: number;
};

export const FadeIn = ({
  children,
  className,
  refreshKey,
  durationMs = 200,
}: FadeInProps) => {
  const [visible, setVisible] = useState(true);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [refreshKey]);

  return (
    <div
      className={cn("ease-out", visible ? "opacity-100" : "opacity-0", className)}
      style={{ transitionProperty: "opacity", transitionDuration: `${durationMs}ms` }}
    >
      {children}
    </div>
  );
};
