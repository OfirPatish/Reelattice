import { Loader2 } from "lucide-react";
import { useAppUpdateContext } from "@/contexts/app-update-context";
import { isUpdaterEnabled } from "@/lib/app-update";
import { cn } from "@/lib/utils";

type UpdateStatusIndicatorProps = {
  onOpenSettings?: () => void;
};

const StatusDot = ({
  pulse = false,
  tone = "muted",
}: {
  pulse?: boolean;
  tone?: "muted" | "success" | "alert";
}) => (
  <span
    className={cn(
      "relative inline-flex h-2 w-2 shrink-0 rounded-full",
      tone === "success" && "bg-emerald-400",
      tone === "alert" && "bg-emerald-400",
      tone === "muted" && "bg-zinc-600",
      pulse && "animate-pulse",
    )}
    aria-hidden
  >
    {pulse && (
      <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
    )}
  </span>
);

export const UpdateStatusIndicator = ({ onOpenSettings }: UpdateStatusIndicatorProps) => {
  const { ready, state, installUpdate, checkForUpdate } = useAppUpdateContext();

  if (!isUpdaterEnabled() || !ready || state.status === "idle") {
    return null;
  }

  const handleClick = () => {
    if (state.status === "available") {
      void installUpdate();
      return;
    }

    if (state.status === "error") {
      void checkForUpdate();
      return;
    }

    onOpenSettings?.();
  };

  const isInteractive =
    state.status === "available" ||
    state.status === "error" ||
    Boolean(onOpenSettings);

  const label =
    state.status === "checking"
      ? "Checking updates…"
      : state.status === "up-to-date"
        ? "Up to date"
        : state.status === "available"
          ? `v${state.availableVersion} available`
          : state.status === "downloading"
            ? state.downloadPercent === null
              ? "Downloading update…"
              : `Downloading ${state.downloadPercent}%`
            : state.status === "installing"
              ? "Installing update…"
              : "Update check failed";

  const tone =
    state.status === "available"
      ? "alert"
      : state.status === "up-to-date"
        ? "success"
        : "muted";

  const content = (
    <>
      {state.status === "checking" || state.status === "downloading" || state.status === "installing" ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-zinc-500" aria-hidden />
      ) : (
        <StatusDot pulse={state.status === "available"} tone={tone} />
      )}
      <span
        className={cn(
          "max-w-[10rem] truncate text-[11px]",
          state.status === "available" ? "text-emerald-400/90" : "text-zinc-500",
        )}
      >
        {label}
      </span>
    </>
  );

  if (!isInteractive) {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1"
        aria-live="polite"
        aria-label={label}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 transition-colors outline-none",
        "hover:bg-zinc-900/80 focus-visible:ring-1 focus-visible:ring-zinc-700",
        state.status === "available" && "hover:bg-emerald-500/10",
      )}
      aria-live="polite"
      aria-label={
        state.status === "available"
          ? `Install update ${state.availableVersion}`
          : state.status === "error"
            ? "Retry update check"
            : label
      }
      data-no-drag
    >
      {content}
    </button>
  );
};
