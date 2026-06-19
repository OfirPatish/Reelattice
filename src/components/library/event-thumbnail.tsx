import { Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadClipThumbnail } from "@/lib/clip-thumbnail";
import type { Clip } from "@/lib/types";
import { cn } from "@/lib/utils";

type EventThumbnailProps = {
  clips: Clip[];
  className?: string;
};

const pickPreviewClip = (clips: Clip[]) =>
  clips.find((clip) => clip.camera === "front") ?? clips[0];

const ThumbnailPlaceholder = ({ loading = false }: { loading?: boolean }) => (
  <div
    className={cn(
      "flex h-full w-full items-center justify-center bg-zinc-900/80",
      loading && "animate-pulse",
    )}
  >
    <Video className="h-3.5 w-3.5 text-zinc-700" />
  </div>
);

export const EventThumbnail = ({ clips, className }: EventThumbnailProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const clip = useMemo(() => pickPreviewClip(clips), [clips]);
  const clipId = clip?.id;

  useEffect(() => {
    if (!clipId) {
      setImageSrc(null);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setImageSrc(null);
    setFailed(false);

    void loadClipThumbnail(clipId)
      .then((dataUrl) => {
        if (!cancelled) {
          setImageSrc(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clipId]);

  const renderContent = () => {
    if (!clip || failed) {
      return <ThumbnailPlaceholder />;
    }

    if (imageSrc) {
      return (
        <img
          src={imageSrc}
          alt=""
          decoding="async"
          className="pointer-events-none h-full w-full object-cover"
        />
      );
    }

    return <ThumbnailPlaceholder loading />;
  };

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md bg-zinc-900 ring-1 ring-zinc-800/80",
        className,
      )}
      aria-hidden
    >
      {renderContent()}
    </div>
  );
};
