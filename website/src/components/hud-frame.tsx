import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HudFrameProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  glow?: "cyan" | "magenta" | "yellow" | "green";
};

const glowStyles = {
  cyan: "shadow-[0_0_30px_rgba(0,240,255,0.12)] [--hud:#00f0ff]",
  magenta: "shadow-[0_0_30px_rgba(255,0,170,0.12)] [--hud:#ff00aa]",
  yellow: "shadow-[0_0_30px_rgba(255,230,0,0.12)] [--hud:#ffe600]",
  green: "shadow-[0_0_30px_rgba(0,255,136,0.12)] [--hud:#00ff88]",
};

export const HudFrame = ({ children, className, title, glow = "cyan" }: HudFrameProps) => (
  <div className={cn("relative", glowStyles[glow], className)}>
    <span
      className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2"
      style={{ borderColor: "var(--hud)" }}
      aria-hidden
    />
    <span
      className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2"
      style={{ borderColor: "var(--hud)" }}
      aria-hidden
    />
    <span
      className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2"
      style={{ borderColor: "var(--hud)" }}
      aria-hidden
    />
    <span
      className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2"
      style={{ borderColor: "var(--hud)" }}
      aria-hidden
    />

    {title && (
      <div
        className="absolute -top-3 left-4 bg-[#06080f] px-2 font-display text-[10px] font-bold uppercase tracking-[0.25em]"
        style={{ color: "var(--hud)" }}
      >
        {title}
      </div>
    )}

    <div className="border border-[var(--hud)]/30 bg-[#0a0e17]/90 backdrop-blur-sm">
      {children}
    </div>
  </div>
);
