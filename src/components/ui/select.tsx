import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Four select rows visible before scrolling (py-2 + text-sm line + viewport padding). */
export const SELECT_VISIBLE_ITEMS_MAX_HEIGHT = "max-h-[10rem]";

const SelectScrollViewport = ({ children }: { children: React.ReactNode }) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  const updateScrollHint = React.useCallback(() => {
    const element = viewportRef.current;
    if (!element) return;
    setCanScrollDown(element.scrollTop + element.clientHeight < element.scrollHeight - 2);
  }, []);

  React.useEffect(() => {
    updateScrollHint();
    const element = viewportRef.current;
    if (!element) return;

    element.addEventListener("scroll", updateScrollHint, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollHint);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", updateScrollHint);
      resizeObserver.disconnect();
    };
  }, [updateScrollHint, children]);

  return (
    <div className="relative">
      <SelectPrimitive.Viewport
        ref={viewportRef}
        className={cn(
          SELECT_VISIBLE_ITEMS_MAX_HEIGHT,
          "scroll-smooth overflow-y-auto overscroll-contain p-1 pb-5 [scrollbar-width:thin] [scrollbar-color:rgb(63_63_70)_transparent]",
          "w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex h-7 items-end justify-center bg-gradient-to-t from-zinc-900 via-zinc-900/90 to-transparent pb-0.5 transition-opacity duration-150",
          canScrollDown ? "opacity-100" : "opacity-0",
        )}
      >
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
      </div>
    </div>
  );
};

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-sm",
      "focus:outline-none focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "[&>span]:min-w-0 [&>span]:truncate [&>span]:text-left",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 shrink-0 text-zinc-500" aria-hidden />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", onCloseAutoFocus, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[var(--radix-select-trigger-width)] w-max max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-lg",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onCloseAutoFocus?.(event);
      }}
      {...props}
    >
      <SelectScrollViewport>{children}</SelectScrollViewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-xs font-medium text-zinc-500", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-md px-3 py-2 text-sm outline-none",
      "focus:bg-zinc-800 focus:text-zinc-100",
      "data-[state=checked]:bg-zinc-800/90 data-[state=checked]:font-medium data-[state=checked]:text-zinc-100",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="whitespace-nowrap">
      {children}
    </SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-zinc-800", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
