import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { confirm } from "@tauri-apps/plugin-dialog";
import {
  AlertCircle,
  Briefcase,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import {
  createIncidentCase,
  deleteIncidentCase,
  getCaseDetail,
  getCases,
  removeEventFromIncidentCase,
  updateIncidentCase,
} from "@/lib/api";
import { formatEventTime, formatRelativeTime } from "@/lib/format";
import type { CaseDetail, CaseSummary } from "@/lib/types";
import { CaseTitlePresets } from "@/components/cases/case-title-presets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CasesViewProps = {
  active?: boolean;
  refreshKey?: number;
  onOpenEvent?: (eventId: string) => void;
};

const sortCasesByUpdated = (items: CaseSummary[]) =>
  [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const fieldClassName =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-violet-500/50";

export const CasesView = ({
  active = true,
  refreshKey = 0,
  onOpenEvent,
}: CasesViewProps) => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingCase, setEditingCase] = useState(false);

  const hasLoadedOnceRef = useRef(false);
  const casesRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const prevRefreshKeyRef = useRef(refreshKey);
  const prevSelectedCaseIdRef = useRef<string | null>(null);
  const saveInFlightRef = useRef(false);
  const createDraftSnapshotRef = useRef<{ title: string; description: string } | null>(null);

  const selectedSummary = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? null,
    [cases, selectedCaseId],
  );

  const patchCaseSummary = useCallback((caseId: string, patch: Partial<CaseSummary>) => {
    setCases((prev) =>
      prev.map((item) => (item.id === caseId ? { ...item, ...patch } : item)),
    );
  }, []);

  const loadCases = useCallback(async (options: { silent?: boolean } = {}) => {
    const requestId = ++casesRequestIdRef.current;

    if (!options.silent && !hasLoadedOnceRef.current) {
      setLoading(true);
    } else if (options.silent) {
      setRefreshing(true);
    }

    setError("");

    try {
      const next = await getCases();
      if (requestId !== casesRequestIdRef.current) return;

      setCases(next);
      setSelectedCaseId((prev) => {
        if (next.length === 0) return null;
        if (prev && next.some((item) => item.id === prev)) return prev;
        return next[0]?.id ?? null;
      });
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (requestId !== casesRequestIdRef.current) return;
      setError(String(err));
    } finally {
      if (requestId === casesRequestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const loadDetail = useCallback(async (caseId: string, options: { silent?: boolean } = {}) => {
    const requestId = ++detailRequestIdRef.current;

    if (options.silent) {
      setDetailRefreshing(true);
    } else {
      setDetailLoading(true);
    }

    setError("");

    try {
      const next = await getCaseDetail(caseId);
      if (requestId !== detailRequestIdRef.current) return;

      setDetail(next);
      setTitleDraft(next.title);
      setDescriptionDraft(next.description);
    } catch (err) {
      if (requestId !== detailRequestIdRef.current) return;
      setError(String(err));
      if (!options.silent) {
        setDetail(null);
      }
    } finally {
      if (requestId === detailRequestIdRef.current) {
        setDetailLoading(false);
        setDetailRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void loadCases({ silent: hasLoadedOnceRef.current });
  }, [active, loadCases, refreshKey]);

  useEffect(() => {
    if (!active || !selectedCaseId) {
      setDetail(null);
      prevSelectedCaseIdRef.current = null;
      return;
    }

    const selectionChanged = prevSelectedCaseIdRef.current !== selectedCaseId;
    prevSelectedCaseIdRef.current = selectedCaseId;
    prevRefreshKeyRef.current = refreshKey;

    void loadDetail(selectedCaseId, { silent: !selectionChanged });
  }, [active, loadDetail, refreshKey, selectedCaseId]);

  useEffect(() => {
    setEditingCase(false);
  }, [selectedCaseId]);

  const handleStartCreate = () => {
    setEditingCase(false);
    createDraftSnapshotRef.current = {
      title: detail?.id === selectedCaseId ? titleDraft : (detail?.title ?? ""),
      description:
        detail?.id === selectedCaseId ? descriptionDraft : (detail?.description ?? ""),
    };
    setCreating(true);
    setTitleDraft("");
    setDescriptionDraft("");
    setError("");
  };

  const handleCancelCreate = () => {
    setCreating(false);
    const snapshot = createDraftSnapshotRef.current;
    createDraftSnapshotRef.current = null;

    if (selectedCaseId && snapshot) {
      setTitleDraft(snapshot.title);
      setDescriptionDraft(snapshot.description);
      return;
    }

    if (detail) {
      setTitleDraft(detail.title);
      setDescriptionDraft(detail.description);
    }
  };

  const handleCreateCase = async () => {
    const title = titleDraft.trim() || "Untitled case";
    const description = descriptionDraft.trim();
    setSaving(true);
    setError("");

    try {
      const created = await createIncidentCase(title, description);
      const nextDetail: CaseDetail = {
        id: created.id,
        title: created.title,
        description: created.description,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        events: [],
      };

      setCases((prev) => sortCasesByUpdated([created, ...prev.filter((item) => item.id !== created.id)]));
      setSelectedCaseId(created.id);
      setDetail(nextDetail);
      setTitleDraft(created.title);
      setDescriptionDraft(created.description);
      createDraftSnapshotRef.current = null;
      setCreating(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCase = async () => {
    if (!selectedCaseId || !detail || saveInFlightRef.current) return;

    const title = titleDraft.trim();
    if (!title) {
      setError("Case title is required.");
      return;
    }

    const description = descriptionDraft.trim();
    const previousTitle = detail.title;
    const previousDescription = detail.description;
    const now = new Date().toISOString();

    saveInFlightRef.current = true;
    setError("");
    setDetail((prev) =>
      prev ? { ...prev, title, description, updatedAt: now } : prev,
    );
    patchCaseSummary(selectedCaseId, { title, description });

    try {
      await updateIncidentCase(selectedCaseId, title, description);
      setEditingCase(false);
    } catch (err) {
      setDetail((prev) =>
        prev
          ? { ...prev, title: previousTitle, description: previousDescription }
          : prev,
      );
      patchCaseSummary(selectedCaseId, {
        title: previousTitle,
        description: previousDescription,
      });
      setTitleDraft(previousTitle);
      setDescriptionDraft(previousDescription);
      setError(String(err));
    } finally {
      saveInFlightRef.current = false;
    }
  };

  const handleDeleteCase = async () => {
    if (!selectedCaseId || !selectedSummary) return;

    const confirmed = await confirm(
      `Delete "${selectedSummary.title}"? Events stay in your library; only the case bundle is removed.`,
      { title: "Delete case", kind: "warning", okLabel: "Delete" },
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await deleteIncidentCase(selectedCaseId);
      setCases((prev) => {
        const next = prev.filter((item) => item.id !== selectedCaseId);
        setSelectedCaseId(next[0]?.id ?? null);
        if (next.length === 0) {
          setDetail(null);
        }
        return next;
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEvent = async (eventId: string) => {
    if (!selectedCaseId || !detail) return;

    const removedEvent = detail.events.find((event) => event.id === eventId);
    if (!removedEvent) return;

    const previousEvents = detail.events;
    const previousCount = selectedSummary?.eventCount ?? detail.events.length;
    const now = new Date().toISOString();
    const nextEvents = detail.events.filter((event) => event.id !== eventId);

    setSaving(true);
    setError("");
    setDetail((prev) =>
      prev ? { ...prev, events: nextEvents, updatedAt: now } : prev,
    );
    patchCaseSummary(selectedCaseId, {
      eventCount: Math.max(0, previousCount - 1),
    });

    try {
      await removeEventFromIncidentCase(selectedCaseId, eventId);
    } catch (err) {
      setDetail((prev) =>
        prev ? { ...prev, events: previousEvents, updatedAt: prev.updatedAt } : prev,
      );
      patchCaseSummary(selectedCaseId, { eventCount: previousCount });
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const showDetailContent = detail?.id === selectedCaseId;
  const showDetailSpinner = detailLoading && !showDetailContent;
  const isDetailBusy = detailRefreshing;
  const hasCases = cases.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-5 lg:p-6">
        <header>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Cases</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-zinc-400">
            Group related events into incident bundles for review and export planning.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <div className="grid min-h-[420px] flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            className={cn(
              "relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30",
              refreshing && "pointer-events-none opacity-60",
              creating && "opacity-80",
            )}
            aria-busy={refreshing}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Your cases
                </p>
                {!loading && (
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {hasCases
                      ? `${cases.length} bundle${cases.length === 1 ? "" : "s"}`
                      : "None yet"}
                  </p>
                )}
              </div>
              {hasCases ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartCreate}
                  disabled={saving || creating}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  New case
                </Button>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-8 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading cases…
                </div>
              ) : cases.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-600">
                    <Briefcase className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-medium text-zinc-400">No cases yet</p>
                  <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-zinc-600">
                    Create your first bundle using the panel on the right.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1" aria-label="Case list">
                  {cases.map((item) => {
                    const isActive = item.id === selectedCaseId && !creating;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setCreating(false);
                            setEditingCase(false);
                            createDraftSnapshotRef.current = null;
                            setSelectedCaseId(item.id);
                          }}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition",
                            isActive
                              ? "bg-violet-500/10 ring-1 ring-inset ring-violet-500/25"
                              : "hover:bg-zinc-800/60",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
                              isActive
                                ? "bg-violet-500/20 text-violet-300"
                                : "bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-400",
                            )}
                          >
                            <Briefcase className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm font-medium",
                                isActive ? "text-zinc-100" : "text-zinc-300",
                              )}
                            >
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {item.eventCount} event{item.eventCount === 1 ? "" : "s"} ·{" "}
                              {formatRelativeTime(item.updatedAt)}
                            </p>
                          </span>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 shrink-0 transition",
                              isActive
                                ? "text-violet-400/80"
                                : "text-zinc-700 group-hover:text-zinc-500",
                            )}
                            aria-hidden
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {refreshing && !loading && (
              <div
                className="pointer-events-none absolute inset-x-0 top-14 flex justify-center"
                aria-hidden
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-medium text-zinc-400 shadow-sm backdrop-blur-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Refreshing…
                </span>
              </div>
            )}
          </aside>

          <section
            className={cn(
              "relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 transition-opacity duration-200 ease-out",
              isDetailBusy && showDetailContent && "opacity-70",
            )}
            aria-busy={detailRefreshing}
          >
            {creating ? (
              <>
                <div className="border-b border-violet-500/20 bg-violet-500/5 px-5 py-4">
                  <p className="text-sm font-medium text-violet-100">New incident case</p>
                  <p className="mt-0.5 text-xs text-violet-300/70">
                    Name the bundle, then link events from Library.
                  </p>
                </div>
                <CaseEditor
                  mode="create"
                  title={titleDraft}
                  description={descriptionDraft}
                  saving={saving}
                  submitBusy={saving}
                  onTitleChange={setTitleDraft}
                  onDescriptionChange={setDescriptionDraft}
                  onSubmit={() => void handleCreateCase()}
                  onCancel={handleCancelCreate}
                />
              </>
            ) : !selectedCaseId ? (
              <CasesEmptyDetail hasCases={hasCases} onCreate={handleStartCreate} />
            ) : showDetailSpinner ? (
              <div className="flex flex-1 items-center justify-center gap-2 p-8 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading case…
              </div>
            ) : showDetailContent && detail ? (
              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col",
                  isDetailBusy && "pointer-events-none",
                )}
              >
                <div className="border-b border-zinc-800/80 px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Case details
                  </p>
                  <h2 className="mt-1 truncate text-base font-semibold tracking-tight text-zinc-100">
                    {detail.title}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {detail.events.length} linked event{detail.events.length === 1 ? "" : "s"} ·
                    Updated {formatRelativeTime(detail.updatedAt)}
                  </p>
                </div>

                <CaseEditor
                  mode={editingCase ? "edit" : "view"}
                  title={titleDraft}
                  description={descriptionDraft}
                  saving={saving}
                  submitBusy={false}
                  onTitleChange={setTitleDraft}
                  onDescriptionChange={setDescriptionDraft}
                  onSubmit={() => void handleSaveCase()}
                  onEdit={() => setEditingCase(true)}
                  onCancel={() => {
                    setTitleDraft(detail.title);
                    setDescriptionDraft(detail.description);
                    setEditingCase(false);
                  }}
                  extraActions={
                    !editingCase ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        onClick={() => void handleDeleteCase()}
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </Button>
                    ) : null
                  }
                />

                <div className="min-h-0 flex-1 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between px-5 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Linked events
                    </p>
                    <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[11px] tabular-nums text-zinc-400">
                      {detail.events.length}
                    </span>
                  </div>
                  <div className="min-h-0 overflow-y-auto px-3 pb-4">
                    {detail.events.length === 0 ? (
                      <div className="mx-2 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 px-4 py-8 text-center">
                        <Video className="mx-auto h-8 w-8 text-zinc-700" aria-hidden />
                        <p className="mt-3 text-sm text-zinc-400">No events linked yet</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                          In Library, bulk-select footage and choose Add to case.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2 px-2">
                        {detail.events.map((event) => (
                          <li
                            key={event.id}
                            className="flex items-center gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3 transition hover:border-zinc-700/80"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-500">
                              <Video className="h-4 w-4" aria-hidden />
                            </span>
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => onOpenEvent?.(event.id)}
                            >
                              <p className="truncate text-sm font-medium text-zinc-100">
                                {formatEventTime(event.eventTime)}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-zinc-500">
                                {event.clips.length} cameras ·{" "}
                                {event.tags.join(", ") || "No tags"}
                              </p>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-zinc-500 hover:text-red-300"
                              aria-label={`Remove ${formatEventTime(event.eventTime)} from case`}
                              onClick={() => void handleRemoveEvent(event.id)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {detailRefreshing && showDetailContent && (
              <div
                className="pointer-events-none absolute inset-x-0 top-3 flex justify-center"
                aria-hidden
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-medium text-zinc-400 shadow-sm backdrop-blur-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating…
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const CasesEmptyDetail = ({
  hasCases,
  onCreate,
}: {
  hasCases: boolean;
  onCreate: () => void;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-600">
      <Briefcase className="h-6 w-6" aria-hidden />
    </span>
    {hasCases ? (
      <>
        <p className="text-sm font-medium text-zinc-300">Select a case</p>
        <p className="max-w-xs text-xs leading-relaxed text-zinc-600">
          Pick a bundle from the list to view details and linked events.
        </p>
      </>
    ) : (
      <>
        <p className="text-sm font-medium text-zinc-300">Create your first case</p>
        <p className="max-w-xs text-xs leading-relaxed text-zinc-600">
          Bundle related footage from one incident so you can review and plan exports
          together.
        </p>
        <Button type="button" size="sm" className="mt-2" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New case
        </Button>
      </>
    )}
  </div>
);

type CaseEditorMode = "create" | "view" | "edit";

type CaseEditorProps = {
  mode: CaseEditorMode;
  title: string;
  description: string;
  saving: boolean;
  submitBusy: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onEdit?: () => void;
  extraActions?: ReactNode;
};

const readOnlyFieldClassName =
  "mt-2 rounded-lg border border-transparent bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300";

const CaseEditor = ({
  mode,
  title,
  description,
  saving,
  submitBusy,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
  onEdit,
  extraActions,
}: CaseEditorProps) => {
  const isEditing = mode === "create" || mode === "edit";

  return (
    <div className="flex flex-col">
      <div className="space-y-4 px-5 py-4">
        {mode === "create" ? <CaseTitlePresets value={title} onSelect={onTitleChange} /> : null}

        <div className="grid gap-4 sm:grid-cols-1">
          <div className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Title
            </span>
            {isEditing ? (
              <input
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                className={fieldClassName}
                placeholder={mode === "create" ? "Or type a custom title" : "Case title"}
              />
            ) : (
              <p className={readOnlyFieldClassName}>{title}</p>
            )}
          </div>

          <div className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Description
            </span>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                rows={3}
                className={cn(fieldClassName, "resize-none")}
                placeholder="Optional notes for this incident"
              />
            ) : (
              <p className={cn(readOnlyFieldClassName, "min-h-[4.5rem] whitespace-pre-wrap")}>
                {description.trim() ? description : "No description"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 bg-zinc-950/20 px-5 py-3">
        {mode === "view" ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onEdit} disabled={saving}>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </Button>
            {extraActions ? <div className="flex items-center gap-2">{extraActions}</div> : null}
          </>
        ) : (
          <>
            <div className="flex flex-nowrap items-center gap-2">
              <Button type="button" onClick={onSubmit} disabled={saving} aria-busy={submitBusy}>
                {submitBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {mode === "create" ? "Create case" : "Save changes"}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
            {mode === "edit" && extraActions ? (
              <div className="flex items-center gap-2">{extraActions}</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
