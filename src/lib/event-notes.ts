export const MAX_EVENT_NOTE_LENGTH = 500;

export const clampEventNote = (value: string) => value.slice(0, MAX_EVENT_NOTE_LENGTH);
