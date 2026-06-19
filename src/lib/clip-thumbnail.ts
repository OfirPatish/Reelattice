import { invoke } from "@tauri-apps/api/core";

const MAX_CONCURRENT_THUMBNAIL_BUILDS = 4;
const MAX_CACHED_DATA_URLS = 300;

let activeBuilds = 0;
const waitQueue: Array<() => void> = [];
const pendingByClipId = new Map<string, Promise<string>>();
const dataUrlCache = new Map<string, string>();

const acquireBuildSlot = () =>
  new Promise<void>((resolve) => {
    const grant = () => {
      activeBuilds += 1;
      resolve();
    };

    if (activeBuilds < MAX_CONCURRENT_THUMBNAIL_BUILDS) {
      grant();
      return;
    }

    waitQueue.push(grant);
  });

const releaseBuildSlot = () => {
  activeBuilds = Math.max(0, activeBuilds - 1);
  const next = waitQueue.shift();
  if (next) next();
};

const rememberDataUrl = (clipId: string, dataUrl: string) => {
  if (dataUrlCache.has(clipId)) {
    dataUrlCache.delete(clipId);
  }

  dataUrlCache.set(clipId, dataUrl);

  while (dataUrlCache.size > MAX_CACHED_DATA_URLS) {
    const oldest = dataUrlCache.keys().next().value;
    if (!oldest) break;
    dataUrlCache.delete(oldest);
  }
};

export const loadClipThumbnail = (clipId: string) => {
  const cached = dataUrlCache.get(clipId);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingByClipId.get(clipId);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    await acquireBuildSlot();
    try {
      const base64 = await invoke<string>("get_clip_thumbnail_data", { clipId });
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      rememberDataUrl(clipId, dataUrl);
      return dataUrl;
    } finally {
      releaseBuildSlot();
    }
  })();

  pendingByClipId.set(clipId, promise);
  void promise.finally(() => {
    pendingByClipId.delete(clipId);
  });

  return promise;
};
