import { invoke } from "@tauri-apps/api/core";

/** Must match `CLIP_THUMBNAIL_SEEK_SECS` in `src-tauri/src/commands/events/mod.rs`. */
export const CLIP_THUMBNAIL_SEEK_SECS = 0;
/** Bump with `CLIP_THUMBNAIL_VERSION` in `src-tauri/src/commands/events/mod.rs`. */
const THUMBNAIL_CACHE_VERSION = "t0";

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

const cacheKey = (clipId: string) => `${clipId}:${THUMBNAIL_CACHE_VERSION}`;

const rememberDataUrl = (clipId: string, dataUrl: string) => {
  const key = cacheKey(clipId);
  if (dataUrlCache.has(key)) {
    dataUrlCache.delete(key);
  }

  dataUrlCache.set(key, dataUrl);

  while (dataUrlCache.size > MAX_CACHED_DATA_URLS) {
    const oldest = dataUrlCache.keys().next().value;
    if (!oldest) break;
    dataUrlCache.delete(oldest);
  }
};

export const loadClipThumbnail = (clipId: string) => {
  const key = cacheKey(clipId);
  const cached = dataUrlCache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingByClipId.get(key);
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

  pendingByClipId.set(key, promise);
  void promise.finally(() => {
    pendingByClipId.delete(key);
  });

  return promise;
};
