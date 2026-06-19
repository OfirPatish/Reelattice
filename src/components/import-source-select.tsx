import { sourceLabel } from "@/lib/format";
import { IMPORT_SOURCE_OPTIONS } from "@/lib/import-source";
import type { EventSource } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ImportSourceSelectProps = {
  value: EventSource;
  onChange: (value: EventSource) => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "compact";
  "aria-label"?: string;
};

export const ImportSourceSelect = ({
  value,
  onChange,
  disabled = false,
  className,
  size = "default",
  "aria-label": ariaLabel = "Event source",
}: ImportSourceSelectProps) => (
  <Select
    value={value}
    onValueChange={(next) => onChange(next as EventSource)}
    disabled={disabled}
  >
    <SelectTrigger
      className={cn(
        "border-zinc-700 bg-zinc-900 text-xs",
        size === "compact"
          ? "h-7 w-auto min-w-0 max-w-none gap-1 px-2 py-0 [&_svg]:size-3"
          : "h-8 w-[7.5rem] min-w-0",
        className,
      )}
      aria-label={ariaLabel}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {IMPORT_SOURCE_OPTIONS.map((source) => (
        <SelectItem key={source} value={source}>
          {sourceLabel(source)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
