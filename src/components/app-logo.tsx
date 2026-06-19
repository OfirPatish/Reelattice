import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: number;
  className?: string;
};

export const AppLogo = ({ size = 20, className }: AppLogoProps) => (
  <img
    src="/icons/app-logo.png"
    width={size}
    height={size}
    alt=""
    aria-hidden
    draggable={false}
    className={cn("shrink-0 rounded-full object-contain", className)}
  />
);
