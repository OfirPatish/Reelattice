import { SYSTEM_REQUIREMENTS } from "@/lib/site-content";

export const SystemRequirements = () => (
  <div className="mx-auto mt-6 max-w-md rounded border border-slate-700/60 bg-slate-900/30 px-4 py-4 text-left">
    <p className="font-display text-[10px] font-bold uppercase tracking-widest text-slate-400">
      System Requirements
    </p>
    <dl className="mt-3 space-y-2">
      {SYSTEM_REQUIREMENTS.map((req) => (
        <div key={req.label} className="grid grid-cols-[5.5rem_1fr] gap-2 text-xs">
          <dt className="font-display font-bold uppercase tracking-wider text-slate-500">{req.label}</dt>
          <dd className="leading-relaxed text-slate-400">{req.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);
