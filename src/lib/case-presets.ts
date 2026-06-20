export const CASE_TITLE_PRESETS = [
  "Parking lot incident",
  "Accident / collision",
  "Hit and run",
  "Sentry alert",
  "Road rage",
  "Vandalism",
  "Insurance claim",
  "Near miss",
] as const;

export type CaseTitlePreset = (typeof CASE_TITLE_PRESETS)[number];
