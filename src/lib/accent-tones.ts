import { cn } from "@/lib/utils";

export type AccentTone =
  | "sky"
  | "violet"
  | "emerald"
  | "amber"
  | "fuchsia"
  | "teal"
  | "rose";

const iconBox: Record<AccentTone, string> = {
  sky: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/25",
  teal: "bg-teal-500/15 text-teal-300 ring-teal-500/25",
  rose: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
};

const sectionBorder: Record<AccentTone, string> = {
  sky: "border-sky-500/25",
  violet: "border-violet-500/25",
  emerald: "border-emerald-500/25",
  amber: "border-amber-500/25",
  fuchsia: "border-fuchsia-500/25",
  teal: "border-teal-500/25",
  rose: "border-rose-500/25",
};

const sectionHeader: Record<AccentTone, string> = {
  sky: "border-sky-500/15 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent",
  violet: "border-violet-500/15 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent",
  emerald:
    "border-emerald-500/15 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent",
  amber: "border-amber-500/15 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
  fuchsia:
    "border-fuchsia-500/15 bg-gradient-to-r from-fuchsia-500/10 via-fuchsia-500/5 to-transparent",
  teal: "border-teal-500/15 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent",
  rose: "border-rose-500/15 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent",
};

const softCard: Record<AccentTone, string> = {
  sky: "border-sky-500/20 bg-sky-500/[0.06]",
  violet: "border-violet-500/20 bg-violet-500/[0.06]",
  emerald: "border-emerald-500/20 bg-emerald-500/[0.06]",
  amber: "border-amber-500/20 bg-amber-500/[0.06]",
  fuchsia: "border-fuchsia-500/20 bg-fuchsia-500/[0.06]",
  teal: "border-teal-500/20 bg-teal-500/[0.06]",
  rose: "border-rose-500/20 bg-rose-500/[0.06]",
};

const bullet: Record<AccentTone, string> = {
  sky: "bg-sky-400/80",
  violet: "bg-violet-400/80",
  emerald: "bg-emerald-400/80",
  amber: "bg-amber-400/80",
  fuchsia: "bg-fuchsia-400/80",
  teal: "bg-teal-400/80",
  rose: "bg-rose-400/80",
};

const statShell: Record<AccentTone, string> = {
  sky: "border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] to-zinc-950/40",
  violet: "border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-zinc-950/40",
  emerald: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-zinc-950/40",
  amber: "border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-zinc-950/40",
  fuchsia: "border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/[0.08] to-zinc-950/40",
  teal: "border-teal-500/20 bg-gradient-to-br from-teal-500/[0.08] to-zinc-950/40",
  rose: "border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-zinc-950/40",
};

const pageBanner: Record<AccentTone, string> = {
  sky: "border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent",
  violet: "border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent",
  emerald:
    "border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent",
  amber: "border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
  fuchsia:
    "border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-500/10 via-fuchsia-500/5 to-transparent",
  teal: "border-teal-500/20 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent",
  rose: "border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent",
};

export const accentIconBox = (tone: AccentTone, className?: string) =>
  cn(
    "flex items-center justify-center rounded-lg ring-1 ring-inset",
    iconBox[tone],
    className,
  );

export const accentSectionClass = (tone?: AccentTone) =>
  cn(
    "overflow-hidden rounded-xl border bg-zinc-900/20",
    tone ? sectionBorder[tone] : "border-zinc-800/60",
  );

export const accentSectionHeaderClass = (tone?: AccentTone) =>
  cn(
    "border-b px-5 py-3",
    tone ? sectionHeader[tone] : "border-zinc-800/60 bg-zinc-950/20",
  );

export const accentSoftCardClass = (tone: AccentTone) =>
  cn("rounded-lg border", softCard[tone]);

export const accentBulletClass = (tone: AccentTone) => bullet[tone];

export const accentStatCardClass = (tone: AccentTone) =>
  cn("rounded-lg border px-4 py-3.5", statShell[tone]);

export const accentPageBannerClass = (tone: AccentTone) =>
  cn("rounded-xl border px-4 py-3", pageBanner[tone]);

/** Changelog version → accent (cycles for older releases). */
export const changelogToneForVersion = (version: string, isLatest: boolean): AccentTone => {
  if (isLatest) return "violet";
  const major = Number.parseInt(version.split(".")[0] ?? "0", 10);
  const minor = Number.parseInt(version.split(".")[1] ?? "0", 10);
  const tones: AccentTone[] = ["sky", "teal", "amber", "emerald", "fuchsia", "rose"];
  return tones[(major + minor) % tones.length] ?? "sky";
};
