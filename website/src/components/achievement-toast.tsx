const ACHIEVEMENTS = [
  { title: "Achievement Unlocked", detail: "First USB Import" },
  { title: "New Skill", detail: "Scissors Trim Master" },
  { title: "Quest Complete", detail: "Case File Created" },
] as const;

export const AchievementToast = () => (
  <div
    className="pointer-events-none fixed bottom-6 right-4 z-40 hidden md:block"
    aria-live="polite"
    aria-atomic
  >
    {ACHIEVEMENTS.map((item, index) => (
      <div
        key={item.detail}
        className="achievement-pop mb-3 border border-yellow-400/40 bg-[#0a0e17]/95 px-4 py-3 shadow-[0_0_20px_rgba(255,230,0,0.15)]"
        style={{ animationDelay: `${index * 5}s` }}
      >
        <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-yellow-400">
          {item.title}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-200">{item.detail}</p>
      </div>
    ))}
  </div>
);
