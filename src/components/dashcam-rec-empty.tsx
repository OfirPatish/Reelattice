import { Cctv } from "lucide-react";
import { cn } from "@/lib/utils";

type DashcamRecEmptyProps = {
  className?: string;
};

export const DashcamRecEmpty = ({ className }: DashcamRecEmptyProps) => (
  <div
    className={cn("relative flex h-44 w-44 items-end justify-center", className)}
    aria-hidden
  >
    <div className="absolute inset-x-6 top-6 h-[5.5rem] rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-[inset_0_0_24px_rgba(0,0,0,0.45)]">
      <span className="absolute left-3 top-3 h-2 w-2 rounded-full bg-red-500 rec-blink" />
      <span className="absolute right-3 top-3 text-[10px] font-bold tracking-wider text-red-400">
        REC
      </span>
      <div className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full w-1/3 rounded-full bg-sky-500/70 rec-scan" />
      </div>
      <div className="absolute inset-x-3 top-10 flex gap-1">
        <span className="h-8 flex-1 rounded-sm bg-zinc-800/80" />
        <span className="h-8 flex-1 rounded-sm bg-zinc-800/50" />
        <span className="h-8 flex-1 rounded-sm bg-zinc-800/80" />
      </div>
    </div>
    <Cctv className="absolute bottom-2 h-6 w-6 text-zinc-600" />
  </div>
);
