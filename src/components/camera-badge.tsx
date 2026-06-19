import { cameraLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

type CameraBadgeProps = {
  camera: string;
  className?: string;
};

export const CameraBadge = ({ camera, className }: CameraBadgeProps) => {
  const label = cameraLabel(camera);

  return (
    <span
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur-[2px]",
        className,
      )}
      aria-hidden
    >
      {label}
    </span>
  );
};

export const cameraAriaLabel = (camera: string) => `${cameraLabel(camera)} camera`;
