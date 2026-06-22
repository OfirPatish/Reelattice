import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SecondaryViewRootProps = {
  children: ReactNode;
  className?: string;
};

export const SecondaryViewRoot = ({ children, className }: SecondaryViewRootProps) => (
  <div
    data-scroll-root
    className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
  >
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 p-5 lg:p-8", className)}>
      {children}
    </div>
  </div>
);

type SecondaryViewHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export const SecondaryViewHeader = ({
  title,
  description,
  actions,
}: SecondaryViewHeaderProps) => (
  <header className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-100">{title}</h1>
      {description && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">{description}</p>
      )}
    </div>
    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
  </header>
);

type SecondarySectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export const SecondarySection = ({
  title,
  description,
  children,
  className,
  bodyClassName,
}: SecondarySectionProps) => (
  <section
    className={cn(
      "overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/40 shadow-sm shadow-black/5",
      className,
    )}
  >
    {(title || description) && (
      <div className="border-b border-zinc-800/60 px-5 py-3.5">
        {title && <h2 className="text-sm font-medium text-zinc-100">{title}</h2>}
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
        )}
      </div>
    )}
    <div className={cn(bodyClassName)}>{children}</div>
  </section>
);

type SecondaryStatProps = {
  label: string;
  value: string;
  icon: ReactNode;
  loading?: boolean;
  hint?: string;
};

export const SecondaryStat = ({ label, value, icon, loading, hint }: SecondaryStatProps) => (
  <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/30 px-4 py-3.5">
    <div className="flex items-center gap-2 text-zinc-500">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-zinc-400 ring-1 ring-inset ring-zinc-800/80">
        {icon}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="mt-2.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-100">
      {loading ? "…" : value}
    </p>
    {hint && !loading && (
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{hint}</p>
    )}
  </div>
);

export const secondaryPanelClass =
  "overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/40 shadow-sm shadow-black/5";

export const secondaryListItemClass = (active: boolean) =>
  cn(
    "relative flex w-full items-center gap-3 overflow-hidden border-l-2 px-3 py-2.5 text-left transition-colors",
    active
      ? "border-sky-400 bg-sky-500/[0.06]"
      : "border-transparent hover:bg-zinc-900/50",
  );
