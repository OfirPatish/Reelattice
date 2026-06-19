import { bulkArchiveEvents, bulkDeleteEvents, bulkExportEvents, bulkToggleTags } from "@/lib/api";
import { confirm, save } from "@tauri-apps/plugin-dialog";

export const confirmBulkArchive = async (count: number, archiving: boolean) => {
  if (!archiving) return true;

  return confirm(
    `Archive ${count} event${count === 1 ? "" : "s"}? They will move out of your active library.`,
    { title: "Archive events", kind: "info", okLabel: "Archive" },
  );
};

export const confirmBulkRestore = async (count: number) =>
  confirm(
    `Restore ${count} event${count === 1 ? "" : "s"} to your active library?`,
    { title: "Restore events", kind: "info", okLabel: "Restore" },
  );

export const confirmBulkDelete = async (count: number) =>
  confirm(
    `Permanently delete ${count} event${count === 1 ? "" : "s"} and all copied video files? You can re-import the footage later.`,
    { title: `Delete ${count} event${count === 1 ? "" : "s"}`, kind: "warning", okLabel: "Delete" },
  );

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
