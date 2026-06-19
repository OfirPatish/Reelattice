import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type UseLibraryDropImportOptions = {
  enabled: boolean;
  onDropImport: (paths: string[]) => void;
};

const normalizeDropPaths = (paths: string[]) =>
  [...new Set(paths.map((path) => path.trim()).filter(Boolean))];

export const useLibraryDropImport = ({ enabled, onDropImport }: UseLibraryDropImportOptions) => {
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDragOver(false);
      return;
    }

    let unlisten: (() => void) | undefined;

    void getCurrentWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setDragOver(true);
          return;
        }

        if (event.payload.type === "leave") {
          setDragOver(false);
          return;
        }

        if (event.payload.type === "drop") {
          setDragOver(false);
          const paths = normalizeDropPaths(event.payload.paths);
          if (paths.length === 0) return;
          onDropImport(paths);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
      setDragOver(false);
    };
  }, [enabled, onDropImport]);

  return { dragOver };
};
