import { bulkArchiveEvents, bulkDeleteEvents, bulkExportEvents, bulkToggleTags } from "@/lib/api";
import { save } from "@tauri-apps/plugin-dialog";
import { showConfirm } from "@/lib/show-confirm";

export const confirmBulkArchive = async (count: number, archiving: boolean) => {
  if (!archiving) return true;

  return showConfirm({
    title: "Archive events",
    description: `Archive ${count} event${count === 1 ? "" : "s"}? They will move out of your active library.`,
    confirmLabel: "Archive",
    variant: "default",
  });
};

export const confirmBulkRestore = async (count: number) =>
  showConfirm({
    title: "Restore events",
    description: `Restore ${count} event${count === 1 ? "" : "s"} to your active library?`,
    confirmLabel: "Restore",
    variant: "default",
  });

export const confirmBulkDelete = async (count: number) =>
  showConfirm({
    title: `Delete ${count} event${count === 1 ? "" : "s"}`,
    description: `Permanently delete ${count} event${count === 1 ? "" : "s"} and all copied video files? You can re-import the footage later.`,
    confirmLabel: "Delete",
    variant: "warning",
  });

export const runBulkArchive = async (eventIds: string[], archiving: boolean) => {
  const confirmed = archiving
    ? await confirmBulkArchive(eventIds.length, true)
    : await confirmBulkRestore(eventIds.length);

  if (!confirmed) return { cancelled: true as const };

  const result = await bulkArchiveEvents(eventIds, archiving);
  return { cancelled: false as const, result };
};

export const runBulkDelete = async (eventIds: string[]) => {
  const confirmed = await confirmBulkDelete(eventIds.length);
  if (!confirmed) return { cancelled: true as const };

  const result = await bulkDeleteEvents(eventIds);
  return { cancelled: false as const, result };
};

export const runBulkToggleTag = async (eventIds: string[], tagName: string) => {
  const result = await bulkToggleTags(eventIds, tagName);
  return { result };
};

export const bulkExportFileName = (count: number) => {
  const stamp = new Date().toISOString().slice(0, 10);
  return `Reelattice-export-${count}-events-${stamp}.zip`;
};

export const runBulkExport = async (eventIds: string[]) => {
  if (eventIds.length === 0) return { cancelled: true as const };

  const destPath = await save({
    defaultPath: bulkExportFileName(eventIds.length),
    filters: [{ name: "ZIP archive", extensions: ["zip"] }],
  });

  if (!destPath) return { cancelled: true as const };

  const result = await bulkExportEvents(eventIds, destPath);
  return { cancelled: false as const, result, destPath };
};
