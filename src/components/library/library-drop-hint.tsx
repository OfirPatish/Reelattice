import { Upload } from "lucide-react";
import { CollapseFade } from "@/components/ui/collapse-fade";
import type { LibraryView } from "@/lib/library-filters";
import { cn } from "@/lib/utils";

type LibraryDropHintProps = {
  libraryView: LibraryView;
  dragOver?: boolean;
};

export const LibraryDropHint = ({
  libraryView,
  dragOver = false,
}: LibraryDropHintProps) => (
  <CollapseFade show={libraryView === "active"}>
    <p
      className={cn(
        "flex shrink-0 items-center gap-1.5 border-b border-zinc-800/60 px-4 py-2 text-[10px] leading-snug transition-colors duration-200",
        dragOver ? "bg-sky-500/8 text-sky-300/90" : "text-zinc-600",
      )}
      aria-live="polite"
    >
      <Upload className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">
        {dragOver ? "Release to import" : "Drop clips here to import"}
      </span>
    </p>
  </CollapseFade>
);
