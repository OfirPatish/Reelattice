export const TESLA_DASHCAM_URL = "https://dashcam.tesla.com/";

export type EncryptedScanInfo = {
  encryptedClipsFound: number;
  encryptedFolderDetected: boolean;
};

export const hasEncryptedScanHits = (info: EncryptedScanInfo | null) =>
  Boolean(info && (info.encryptedClipsFound > 0 || info.encryptedFolderDetected));
