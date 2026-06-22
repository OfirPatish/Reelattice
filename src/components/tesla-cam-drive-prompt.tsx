import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { dismissTeslaCamDrive } from "@/lib/api";
import type { TeslaCamDriveDetectedPayload, TeslaCamDriveMatch } from "@/lib/types";

type TeslaCamDrivePromptProps = {
  onImportDrive: (mountPath: string) => void;
};

const formatDriveLabel = (drive: TeslaCamDriveMatch) => {
  if (drive.volumeLabel.trim()) {
    return `${drive.driveLetter} · ${drive.volumeLabel}`;
  }

  return drive.driveLetter;
};

export const TeslaCamDrivePrompt = ({ onImportDrive }: TeslaCamDrivePromptProps) => {
  const [pendingDrive, setPendingDrive] = useState<TeslaCamDriveMatch | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listen<TeslaCamDriveDetectedPayload>("tesla-cam-drive-detected", (event) => {
      const drive = event.payload.drives[0];
      if (!drive) return;
      setPendingDrive(drive);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const handleDismiss = useCallback(async () => {
    if (!pendingDrive) return;

    setBusy(true);
    try {
      await dismissTeslaCamDrive(pendingDrive.volumeId);
    } finally {
      setBusy(false);
      setPendingDrive(null);
    }
  }, [pendingDrive]);

  const handleImport = useCallback(async () => {
    if (!pendingDrive) return;

    setBusy(true);
    try {
      onImportDrive(pendingDrive.mountPath);
    } finally {
      setBusy(false);
      setPendingDrive(null);
    }
  }, [onImportDrive, pendingDrive]);

  if (!pendingDrive) {
    return null;
  }

  return (
    <AppConfirmDialog
      open
      variant="accent"
      title="TeslaCam drive connected"
      loading={busy}
      confirmLabel="Import"
      cancelLabel="Not now"
      onConfirm={() => void handleImport()}
      onCancel={() => void handleDismiss()}
      description={
        <p>
          TeslaCam found on{" "}
          <span className="font-medium text-zinc-200">{formatDriveLabel(pendingDrive)}</span>
          {" — "}
          import new clips? Nothing is scanned until you confirm.
        </p>
      }
    />
  );
};
