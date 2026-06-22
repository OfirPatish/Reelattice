import type { ReactNode } from "react";
import { useEffect } from "react";
import { CircleHelp, FolderOpen, Briefcase, Library, ScrollText, Settings } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { HeaderCompanion } from "@/components/layout/header-companion";
import { WindowControls } from "@/components/layout/window-controls";
import { WebsitePresence } from "@/components/website-presence";
import { sourceBadgeClass, sourceLabel } from "@/lib/format";
import { handleTitleBarMouseDown, stopTitleBarMouseDown } from "@/lib/title-bar";
import type { AppView, EventSource } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = {
  id: AppView;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { id: "library", label: "Library", icon: <Library className="h-4 w-4" aria-hidden /> },
  { id: "import", label: "Import", icon: <FolderOpen className="h-4 w-4" aria-hidden /> },
  { id: "cases", label: "Cases", icon: <Briefcase className="h-4 w-4" aria-hidden /> },
  { id: "help", label: "Help", icon: <CircleHelp className="h-4 w-4" aria-hidden /> },
  { id: "changelog", label: "Changelog", icon: <ScrollText className="h-4 w-4" aria-hidden /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" aria-hidden /> },
];

const librarySources: EventSource[] = ["recent", "sentry", "saved"];

const HeaderContext = ({ activeView }: { activeView: AppView }) => {
  if (activeView === "library") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <span className="mr-1 hidden text-[11px] text-zinc-600 md:inline">Sources</span>
        {librarySources.map((source) => (
          <span
            key={source}
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
              sourceBadgeClass(source),
            )}
          >
            {sourceLabel(source)}
          </span>
        ))}
      </div>
    );
  }

  if (activeView === "import") {
    return (
      <p className="max-w-xs text-right text-[11px] leading-snug text-zinc-600">
        Groups clips by timestamp · front, repeaters & rear
      </p>
    );
  }

  if (activeView === "cases") {
    return (
      <p className="max-w-xs text-right text-[11px] leading-snug text-zinc-600">
        Bundle related events into incident cases
      </p>
    );
  }

  if (activeView === "help") {
    return (
      <p className="max-w-xs text-right text-[11px] leading-snug text-zinc-600">
        Guides, shortcuts, and examples
      </p>
    );
  }

  if (activeView === "changelog") {
    return (
      <p className="max-w-xs text-right text-[11px] leading-snug text-zinc-600">
        Release notes by version
      </p>
    );
  }

  if (activeView === "settings") {
    return (
      <p className="text-[11px] text-zinc-600">
        Local-only · no cloud sync
      </p>
    );
  }

  return null;
};

type AppShellProps = {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  children: ReactNode;
};

const isTextEntryTarget = () => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.isContentEditable) return true;
  if (active instanceof HTMLTextAreaElement) return true;
  if (active instanceof HTMLInputElement) {
    const type = active.type;
    return type !== "checkbox" && type !== "radio" && type !== "range" && type !== "button";
  }
  return false;
};

const isTextEntryElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    const type = target.type;
    return type !== "checkbox" && type !== "radio" && type !== "range" && type !== "button";
  }
  return Boolean(
    target.closest(
      'textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]), [contenteditable="true"]',
    ),
  );
};

export const AppShell = ({ activeView, onNavigate, children }: AppShellProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "a" && event.key !== "A") return;
      if (!event.ctrlKey && !event.metaKey) return;
      if (isTextEntryTarget()) return;

      event.preventDefault();
      window.getSelection()?.removeAllRanges();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      if (isTextEntryElement(event.target)) return;
      event.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div className="flex h-screen select-none flex-col bg-zinc-950 text-zinc-100">
      <header
        className="flex h-14 shrink-0 cursor-default items-center border-b border-zinc-800"
        data-tauri-drag-region
        onMouseDown={handleTitleBarMouseDown}
      >
        <div
          className="flex shrink-0 items-center gap-2.5 px-4"
          data-no-drag
          onMouseDown={stopTitleBarMouseDown}
        >
          <AppLogo size={22} />
          <span className="text-sm font-semibold tracking-tight">Reelattice</span>
        </div>

        <nav
          className="flex items-center gap-0.5"
          aria-label="Main navigation"
          data-no-drag
          onMouseDown={stopTitleBarMouseDown}
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none focus:outline-none focus-visible:outline-none",
                  isActive
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          className="flex min-h-0 min-w-0 flex-1 self-stretch items-end gap-3 px-2"
          data-no-drag
          onMouseDown={stopTitleBarMouseDown}
        >
          <HeaderCompanion activeView={activeView} />
          <div className="hidden shrink-0 pb-3 sm:block">
            <HeaderContext activeView={activeView} />
          </div>
        </div>

        <WindowControls />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <WebsitePresence />
    </div>
  );
};
