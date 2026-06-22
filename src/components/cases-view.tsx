import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { showConfirm } from "@/lib/show-confirm";
import {
  AlertCircle,
  Briefcase,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createIncidentCase,
  deleteIncidentCase,
  getCaseDetail,
  getCases,
  removeEventFromIncidentCase,
  updateIncidentCase,
} from "@/lib/api";
import {
  secondaryListItemClass,
  secondaryPanelClass,
} from "@/components/layout/secondary-view-layout";
import { formatRelativeTime } from "@/lib/format";
import type { CaseDetail, CaseSummary } from "@/lib/types";
import { CaseLinkedEventsList } from "@/components/cases/case-linked-events-list";
import { CaseDetailSkeleton, CaseListSkeleton } from "@/components/cases/cases-skeleton";
import { CaseTitlePresets } from "@/components/cases/case-title-presets";
import { Button } from "@/components/ui/button";
import { IndeterminateBar } from "@/components/ui/indeterminate-bar";
import { cn } from "@/lib/utils";

type CasesViewProps = {
  active?: boolean;
  refreshKey?: number;
  onOpenEvent?: (eventId: string) => void;
};

const sortCasesByUpdated = (items: CaseSummary[]) =>
  [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const fieldClassName =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20";

export const CasesView = ({
  active = true,
  refreshKey = 0,
  onOpenEvent,
}: CasesViewProps) => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
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
      setIsInitialLoad(true);
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
        setIsInitialLoad(false);
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

    const confirmed = await showConfirm({
      title: "Delete case",
      description: `Delete "${selectedSummary.title}"? Events stay in your library; only the case bundle is removed.`,
      confirmLabel: "Delete",
      variant: "warning",
    });
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
  const showDetailSkeleton =
    isInitialLoad || (detailLoading && !showDetailContent);
  const isDetailBusy = detailRefreshing;
  const hasCases = cases.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {isInitialLoad && <IndeterminateBar />}

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 overflow-hidden p-5 lg:p-8">
        <header className="shrink-0 border-b border-zinc-800/80 pb-5">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Cases</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Group related events into incident bundles for review and export planning.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="flex shrink-0 items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            className={cn(
              "relative flex min-h-0 flex-col overflow-hidden",
              secondaryPanelClass,
              (isInitialLoad || refreshing) && "pointer-events-none",
              isInitialLoad && "opacity-90",
              refreshing && !isInitialLoad && "opacity-60",
              creating && "opacity-80",
            )}
            aria-busy={isInitialLoad || refreshing}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Your cases
                </p>
                {!isInitialLoad && (
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {hasCases
                      ? `${cases.length} bundle${cases.length === 1 ? "" : "s"}`
                      : "None yet"}
                  </p>
                )}
              </div>
              {hasCases && !isInitialLoad ? (
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

            <div data-scroll-root className="min-h-0 flex-1 overflow-y-auto">
              {isInitialLoad ? (
                <CaseListSkeleton />
              ) : cases.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-900 text-zinc-500 ring-1 ring-inset ring-zinc-800/80">
                    <Briefcase className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-medium text-zinc-400">No cases yet</p>
                  <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-zinc-600">
                    Create your first bundle using the panel on the right.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800/60" aria-label="Case list">
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
                          className={cn(secondaryListItemClass(isActive), "group pr-3")}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-zinc-500 ring-1 ring-inset ring-zinc-800/80 transition",
                              isActive && "text-sky-400",
                            )}
                          >
                            <Briefcase className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-200">
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {item.eventCount} event{item.eventCount === 1 ? "" : "s"} ·{" "}
                              {formatRelativeTime(item.updatedAt)}
                            </p>
                          </span>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 shrink-0 text-zinc-700 transition group-hover:text-zinc-500",
                              isActive && "text-sky-400/80",
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

            {refreshing && !isInitialLoad && (
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
              "relative flex min-h-0 flex-1 flex-col overflow-hidden transition-opacity duration-200 ease-out",
              secondaryPanelClass,
              isDetailBusy && showDetailContent && "opacity-70",
            )}
            aria-busy={isInitialLoad || detailLoading || detailRefreshing}
          >
            {creating ? (
              <>
                <div className="border-b border-zinc-800/80 px-5 py-4">
                  <p className="text-sm font-medium text-zinc-100">New incident case</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
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
            ) : showDetailSkeleton ? (
              <CaseDetailSkeleton />
            ) : !selectedCaseId ? (
              <CasesEmptyDetail hasCases={hasCases} onCreate={handleStartCreate} />
            ) : showDetailContent && detail ? (
              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col",
                  isDetailBusy && "pointer-events-none",
                )}
              >
                <div className="shrink-0 border-b border-zinc-800/80 px-5 py-4">
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

                <div data-scroll-root className="min-h-0 shrink overflow-y-auto">
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
                </div>

                <div className="flex min-h-36 flex-1 flex-col overflow-hidden border-t border-zinc-800/80">
                  <div className="flex shrink-0 items-center justify-between px-5 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Linked events
                    </p>
                    <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[11px] tabular-nums text-zinc-400">
                      {detail.events.length}
                    </span>
                  </div>
                  <CaseLinkedEventsList
                    events={detail.events}
                    saving={saving}
                    onOpenEvent={onOpenEvent}
                    onRemoveEvent={(eventId) => void handleRemoveEvent(eventId)}
                  />
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
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500 ring-1 ring-inset ring-zinc-800/80">
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
