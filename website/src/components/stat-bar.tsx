import { cn } from "@/lib/utils";

type StatBarProps = {
  label: string;
  value: number;
  max?: number;
  color?: "cyan" | "magenta" | "yellow" | "green";
  className?: string;
};

const barColors = {
  cyan: "from-cyan-500 to-cyan-300",
  magenta: "from-fuchsia-600 to-fuchsia-400",
  yellow: "from-yellow-500 to-yellow-300",
  green: "from-emerald-500 to-emerald-300",
};

export const StatBar = ({ label, value, max = 100, color = "cyan", className }: StatBarProps) => {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between font-display text-[9px] uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span className="text-slate-400">{value}/{max}</span>
      </div>
      <div className="h-2 overflow-hidden border border-slate-700 bg-slate-900/80">
        <div
          className={cn("stat-bar-fill h-full bg-gradient-to-r", barColors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
