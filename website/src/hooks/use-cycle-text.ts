import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const useCycleText = (lines: readonly string[], intervalMs = 2800) => {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reducedMotion || lines.length <= 1) return;

    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % lines.length);
        setVisible(true);
      }, 280);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [lines, intervalMs, reducedMotion]);

  return { text: lines[index], visible };
};
