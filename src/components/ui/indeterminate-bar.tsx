export const IndeterminateBar = () => (
  <div
    className="h-px w-full overflow-hidden bg-zinc-800"
    role="progressbar"
    aria-label="Loading"
  >
    <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-sky-500/60" />
  </div>
);
