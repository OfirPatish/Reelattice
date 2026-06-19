import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getPathByteSize } from "@/lib/api";

type GridExportStatusProps = {
  destPath: string;
};

type ExportProgress = {
  elapsedSec: number;
  bytesWritten: number;
  stalled: boolean;
};

const STALL_THRESHOLD_MS = 30_000;
const POLL_INTERVAL_MS = 1_000;

const gridPartPath = (destPath: string) =>
  destPath.replace(/\.mp4$/i, ".mp4.part");

const formatMegabytes = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export const GridExportStatus = ({ destPath }: GridExportStatusProps) => {
  const [progress, setProgress] = useState<ExportProgress>({
    elapsedSec: 0,
    bytesWritten: 0,
    stalled: false,
  });

  useEffect(() => {
    const partPath = gridPartPath(destPath);
    const startedAt = Date.now();
    let lastBytes = 0;
    let lastChangeAt = Date.now();

    const poll = async () => {
      const bytesWritten = await getPathByteSize(partPath);
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);

      if (bytesWritten > lastBytes) {
        lastBytes = bytesWritten;
        lastChangeAt = Date.now();
      }

      const stalled =
        bytesWritten > 0 && Date.now() - lastChangeAt >= STALL_THRESHOLD_MS;

      setProgress({ elapsedSec, bytesWritten, stalled });
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [destPath]);

  const { elapsedSec, bytesWritten, stalled } = progress;
  const isStarting = bytesWritten === 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="shrink-0 border-b border-sky-500/30 bg-sky-500/10 px-5 py-2 text-xs text-sky-200"
    >
      <div className="flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        <div>
          {isStarting ? (
            <p>Starting grid export… ({elapsedSec}s)</p>
          ) : (
            <p>
              Encoding grid video… {elapsedSec}s · {formatMegabytes(bytesWritten)} MB
              written
            </p>
          )}
          {stalled ? (
            <p className="mt-0.5 text-amber-200/90">
              No new data for 30s. FFmpeg may still be finishing — check Task Manager
              for ffmpeg, or wait a bit longer.
            </p>
          ) : (
            <p className="mt-0.5 text-sky-200/70">
              Watch the MB count rise — that means it is working. A{" "}
              <span className="font-mono">.mp4.part</span> file appears in your save
              folder while encoding.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
