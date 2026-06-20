import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: number;
  className?: string;
};

export const AppLogo = ({ size = 32, className }: AppLogoProps) => (
  <span
    className={cn("inline-flex shrink-0 overflow-hidden rounded-full", className)}
    style={{ width: size, height: size }}
  >
    <img
      src="/icons/app-logo.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="size-full object-cover"
      aria-hidden
    />
  </span>
);
