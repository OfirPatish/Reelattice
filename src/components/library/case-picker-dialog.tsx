import { useCallback, useEffect, useState } from "react";
import { Briefcase, Loader2, Plus, X } from "lucide-react";
import { CaseTitlePresets } from "@/components/cases/case-title-presets";
import {
  addEventsToIncidentCase,
  createIncidentCase,
  getCases,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { CaseSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CasePickerDialogProps = {
  open: boolean;
  eventIds: string[];
  onClose: () => void;
  onSuccess: () => void;
};

export const CasePickerDialog = ({
  open,
  eventIds,
  onClose,
  onSuccess,
}: CasePickerDialogProps) => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getCases();
      setCases(next);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedCaseId(null);
    setCreating(false);
    setNewTitle("");
    setError("");
    void loadCases();
  }, [loadCases, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, saving]);

  const handleCreateAndSelect = async () => {
    const title = newTitle.trim() || "Untitled case";
    setSaving(true);
    setError("");
    try {
      const created = await createIncidentCase(title);
      setCases((current) => [created, ...current]);
      setSelectedCaseId(created.id);
      setCreating(false);
      setNewTitle("");
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedCaseId) return;
    setSaving(true);
    setError("");
    try {
      await addEventsToIncidentCase(selectedCaseId, eventIds);
      onSuccess();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const eventLabel = `${eventIds.length} event${eventIds.length === 1 ? "" : "s"}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-picker-title"
        className="flex w-full max-w-md flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 id="case-picker-title" className="text-base font-semibold text-zinc-100">
              Add to case
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Choose which case should include {eventLabel}.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Close"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {error ? (
            <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {creating ? (
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <CaseTitlePresets value={newTitle} onSelect={setNewTitle} />
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Title
                </span>
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/30"
                  placeholder="Or type a custom title"
                  autoFocus
                />
              </label>
              <div className="flex flex-nowrap gap-2">
                <Button type="button" onClick={() => void handleCreateAndSelect()} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  Create case
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setNewTitle("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                className="mb-2 w-full justify-start gap-2 text-zinc-300"
                onClick={() => setCreating(true)}
                disabled={loading || saving}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Create new case
              </Button>

              {loading ? (
                <div className="flex items-center gap-2 px-3 py-8 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading cases…
                </div>
              ) : cases.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  <Briefcase className="mx-auto mb-3 h-8 w-8 text-zinc-700" aria-hidden />
                  No cases yet. Create one above.
                </div>
              ) : (
                <ul className="space-y-1" role="listbox" aria-label="Cases">
                  {cases.map((item) => {
                    const isSelected = item.id === selectedCaseId;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => setSelectedCaseId(item.id)}
                          className={cn(
                            "w-full rounded-lg px-3 py-2.5 text-left transition",
                            isSelected
                              ? "bg-amber-500/[0.06] text-zinc-100 ring-1 ring-inset ring-amber-500/20"
                              : "text-zinc-300 hover:bg-zinc-900/40",
                          )}
                        >
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {item.eventCount} event{item.eventCount === 1 ? "" : "s"} ·{" "}
                            {formatRelativeTime(item.updatedAt)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!selectedCaseId || saving || creating}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Add to case
          </Button>
        </div>
      </div>
    </div>
  );
};
