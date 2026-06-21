import { FileVideo, FolderOpen, Loader2 } from "lucide-react";
import { ImportDropIllustration } from "@/components/empty-illustrations";
import { ImportGuidePanel } from "@/components/import-guide-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImportPickPanelProps = {
  dragOver: boolean;
  loading: boolean;
  onPickFolders: () => void;
  onPickFiles: () => void;
};

export const ImportPickPanel = ({
  dragOver,
  loading,
  onPickFolders,
  onPickFiles,
}: ImportPickPanelProps) => (
  <section className="flex flex-col gap-4" aria-label="Choose import sources">
    <div
      className={cn(
        "relative flex min-h-[15rem] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
        dragOver ? "border-sky-400/70 bg-sky-500/[0.06]" : "border-zinc-700/80 bg-zinc-950/50",
      )}
      aria-label="Drop Tesla clip files or folders here"
      aria-busy={loading}
    >
      <div className="relative flex h-24 w-full max-w-[10rem] items-center justify-center">
        {!loading && (
          <ImportDropIllustration
            size="compact"
            className={cn("transition-opacity duration-150", dragOver ? "opacity-100" : "opacity-80")}
          />
        )}
        <Loader2
          className={cn(
            "absolute h-9 w-9 animate-spin text-sky-400 transition-opacity duration-150",
            loading ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <p className="mt-3 text-sm font-medium text-zinc-200">
        {loading ? "Scanning…" : dragOver ? "Drop to scan" : "Drop files or folders here"}
      </p>

      <p className="mt-3 text-sm text-zinc-500">or</p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={onPickFolders} disabled={loading}>
          <FolderOpen className="h-4 w-4" aria-hidden />
          Browse folders
        </Button>
        <Button type="button" variant="outline" onClick={onPickFiles} disabled={loading}>
          <FileVideo className="h-4 w-4" aria-hidden />
          Browse files
        </Button>
      </div>
    </div>

    <ImportGuidePanel />
  </section>
);
