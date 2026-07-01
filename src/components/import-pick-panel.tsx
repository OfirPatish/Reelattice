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
  <section className="flex flex-col gap-3" aria-label="Choose import sources">
    <div
      className={cn(
        "relative flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-7 text-center transition-colors",
        dragOver ? "border-sky-500/35 bg-sky-500/[0.04]" : "border-zinc-800 bg-zinc-950/50",
      )}
      aria-label="Drop Tesla clip files or folders here"
      aria-busy={loading}
    >
      <div className="relative mb-4 flex h-28 w-full max-w-[10rem] items-center justify-center">
        {!loading && (
          <ImportDropIllustration
            size="compact"
            className={cn(
              "transition-opacity duration-150",
              dragOver ? "opacity-100" : "opacity-80",
            )}
          />
        )}
        <Loader2
          className={cn(
            "absolute h-8 w-8 animate-spin text-zinc-400 transition-opacity duration-150",
            loading ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      </div>

      <p className="text-sm font-medium text-zinc-200">
        {loading ? "Scanning…" : dragOver ? "Drop to scan" : "Drop files or folders"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        TeslaCam USB, SentryClips, SavedClips, or loose .mp4 files
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
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
