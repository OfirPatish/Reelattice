import type { ReactNode } from "react";

export const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0 space-y-1">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
      {label}
    </span>
    {children}
  </div>
);
