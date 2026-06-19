import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-4 shrink-0 rounded-[4px] border border-zinc-600 bg-zinc-900 shadow-sm",
      "focus:outline-none focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-sky-500 data-[state=checked]:bg-sky-600 data-[state=checked]:text-white",
      "data-[state=indeterminate]:border-sky-500 data-[state=indeterminate]:bg-sky-600 data-[state=indeterminate]:text-white",
      "[&[data-state=indeterminate]_svg:first-child]:hidden",
      "[&[data-state=indeterminate]_svg:last-child]:block",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="size-3.5 stroke-[3]" aria-hidden />
      <Minus className="hidden size-3.5 stroke-[3]" aria-hidden />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
