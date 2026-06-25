export const GITHUB_REPO_URL = "https://github.com/OfirPatish/Reelattice";
export const GITHUB_RELEASES_URL = "https://github.com/OfirPatish/Reelattice/releases/latest";

export const BUILT_FOR = [
  "Incident logs",
  "Insurance dossiers",
  "Long-term archive",
  "Offline review",
] as const;

export const COMPARISON = {
  goodFor: [
    "Regular TeslaCam USB imports",
    "Insurance and dispute case files",
    "Large libraries — search, tag, archive",
    "Multi-camera grid review and export",
  ],
  notFor: [
    "One-off viewing with telemetry overlays",
    "Full video editor with trim timelines",
    "macOS or Linux (Windows today)",
    "Cloud sync or shared online libraries",
  ],
} as const;

export const SYSTEM_REQUIREMENTS = [
  { label: "OS", value: "Windows 10 or 11 (64-bit)" },
  { label: "Storage", value: "Room for your clip library (copies locally)" },
  { label: "Network", value: "Optional — offline after install" },
  { label: "Account", value: "None required" },
  { label: "Installer", value: "Signed .exe · in-app updates" },
  { label: "License", value: "Free · open source" },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Does Reelattice upload my footage?",
    answer:
      "No. Everything stays on your PC. There is no account, no cloud storage, and no background upload. Import copies files into a local library on your machine.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "Windows 10 and 11 today. macOS and Linux are not available yet. The installer is a signed Windows .exe with in-app updates from Settings → About.",
  },
  {
    question: "What happens when I plug in my TeslaCam USB?",
    answer:
      "On Windows you can opt in to a notification when a TeslaCam drive is detected. Reelattice never auto-imports — you choose what to copy in the Import tab.",
  },
  {
    question: "Can I use encrypted Tesla clips?",
    answer:
      "Clips encrypted by Tesla (2026.20+) must be decrypted first at dashcam.tesla.com before importing into Reelattice.",
  },
  {
    question: "Is Reelattice free? Where do downloads come from?",
    answer:
      "Yes — Reelattice is free and open source. The Download button on this site fetches the latest signed installer from GitHub Releases. You can also browse releases on GitHub directly.",
  },
  {
    question: "Where is the full release history?",
    answer:
      "In the app under Help → Changelog. This site shows highlights for the current version only.",
  },
] as const;
