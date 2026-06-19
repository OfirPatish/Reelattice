const STORAGE_KEY = "Reelattice-event-cameras";

type EventCameraMap = Record<string, string>;

const loadEventCameras = (): EventCameraMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EventCameraMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveEventCameras = (map: EventCameraMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

export const getSavedEventCamera = (eventId: string): string | undefined => {
  return loadEventCameras()[eventId];
};

export const saveEventCamera = (eventId: string, camera: string) => {
  const map = loadEventCameras();
  map[eventId] = camera;
  saveEventCameras(map);
};
