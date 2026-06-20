import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GameButtonProps = {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  external?: boolean;
  ariaLabel?: string;
};

export const GameButton = ({
  children,
  href,
  variant = "primary",
  className,
  external = true,
  ariaLabel,
}: GameButtonProps) => (
  <a
    href={href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    aria-label={ariaLabel}
    className={cn(
      "game-btn group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] transition-transform",
      variant === "primary" &&
        "border-2 border-cyan-400 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 hover:shadow-[0_0_24px_rgba(0,240,255,0.35)]",
      variant === "secondary" &&
        "border-2 border-fuchsia-500/50 bg-fuchsia-500/5 text-fuchsia-300 hover:border-fuchsia-400 hover:bg-fuchsia-500/10",
      className,
    )}
  >
    <span className="absolute left-1 top-1 size-1 bg-current opacity-60" aria-hidden />
    <span className="absolute right-1 top-1 size-1 bg-current opacity-60" aria-hidden />
    <span className="absolute bottom-1 left-1 size-1 bg-current opacity-60" aria-hidden />
    <span className="absolute bottom-1 right-1 size-1 bg-current opacity-60" aria-hidden />
    <span className="relative flex items-center gap-2">{children}</span>
  </a>
);
