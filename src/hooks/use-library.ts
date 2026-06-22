import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEvents, getAllTags, updateEvent } from "@/lib/api";
import { clampEventNote } from "@/lib/event-notes";
import { runBulkArchive, runBulkDelete, runBulkExport, runBulkToggleTag } from "@/lib/bulk-actions";
import { applyRangeSelection, getTagCoverage, type BulkBusyAction } from "@/lib/bulk-selection";
import { runDeleteEvent } from "@/lib/event-actions";
import {
  DEFAULT_LIBRARY_PREFERENCES,
  loadLibraryPreferences,
  saveLibraryPreferences,
  subscribeLibraryPreferences,
  type LibraryPreferences,
} from "@/lib/library-preferences";
import {
  filterAndSortEvents,
  hasExtendedFilters,
  type LibraryView,
} from "@/lib/library-filters";
import type { DashEvent, EventSource, TagInfo } from "@/lib/types";

const FILTERS_EXPANDED_KEY = "Reelattice-filters-expanded";

const loadFiltersExpanded = () => {
  const stored = sessionStorage.getItem(FILTERS_EXPANDED_KEY);
  if (stored !== null) return stored === "true";
  return hasExtendedFilters(loadLibraryPreferences());
};

export const useLibrary = (refreshKey: number) => {
  const [events, setEvents] = useState<DashEvent[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusyAction, setBulkBusyAction] = useState<BulkBusyAction | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  const [libraryView, setLibraryView] = useState<LibraryView>("active");
  const [searchInput, setSearchInput] = useState("");
  const [prefs, setPrefs] = useState<LibraryPreferences>(loadLibraryPreferences);
  const [filtersExpanded, setFiltersExpandedState] = useState(loadFiltersExpanded);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState("");
  const [noteDraft, setNoteDraftState] = useState("");
  const setNoteDraft = useCallback((value: string) => {
    setNoteDraftState(clampEventNote(value));
  }, []);

  const [isViewRefreshing, setIsViewRefreshing] = useState(false);
  const eventsCacheRef = useRef<Partial<Record<LibraryView, DashEvent[]>>>({});

  const setFiltersExpanded = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setFiltersExpandedState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      sessionStorage.setItem(FILTERS_EXPANDED_KEY, String(next));
      return next;
    });
  }, []);

  const updatePrefs = useCallback((patch: Partial<LibraryPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveLibraryPreferences(next);
      return next;
    });
  }, []);

  useEffect(() => {
    return subscribeLibraryPreferences(() => {
      setPrefs(loadLibraryPreferences());
    });
  }, []);

  const filteredEvents = useMemo(
    () =>
      filterAndSortEvents(
        events,
        searchInput,
        sourceFilter,
        tagFilter,
        prefs.dateRange,
        prefs.minCameras,
        prefs.sort,
      ),
    [events, searchInput, sourceFilter, tagFilter, prefs],
  );

  const requestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const selectionAnchorRef = useRef<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );

  const bulkSelectedEvents = useMemo(
    () => filteredEvents.filter((event) => selectedIds.has(event.id)),
    [filteredEvents, selectedIds],
  );

  const hasActiveFilters =
    Boolean(sourceFilter) ||
    Boolean(tagFilter) ||
    searchInput.trim().length > 0 ||
    prefs.dateRange !== "all" ||
    prefs.minCameras !== "any";

  const showEmptyLibrary = !isInitialLoad && events.length === 0 && !error;
  const showNoMatches = !isInitialLoad && events.length > 0 && filteredEvents.length === 0;

  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    selectionAnchorRef.current = null;
    setBulkBusyAction(null);
  }, []);

  const patchEvent = useCallback((eventId: string, patch: Partial<DashEvent>) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === eventId ? { ...event, ...patch } : event)),
    );
  }, []);

  const patchEvents = useCallback(
    (updates: Array<{ id: string; patch: Partial<DashEvent> }>) => {
      const patchMap = new Map(updates.map((entry) => [entry.id, entry.patch]));
      setEvents((prev) =>
        prev.map((event) => {
          const patch = patchMap.get(event.id);
          return patch ? { ...event, ...patch } : event;
        }),
      );
    },
    [],
  );

  const fetchLibrary = useCallback(async (options: { silent?: boolean } = {}) => {
    const requestId = ++requestIdRef.current;

    if (!options.silent && !hasLoadedOnceRef.current) {
      setIsInitialLoad(true);
    }

    setError("");

    try {
      const [eventData, tagData] = await Promise.all([
        getEvents({ archived: libraryView }),
        getAllTags(),
      ]);

      if (requestId !== requestIdRef.current) return;

      eventsCacheRef.current[libraryView] = eventData;
      setEvents(eventData);
      setTags(tagData);
      setSelectedId((prev) => {
        if (prev && eventData.some((event) => event.id === prev)) return prev;
        return null;
      });
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(String(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsInitialLoad(false);
        setIsViewRefreshing(false);
      }
    }
  }, [libraryView]);

  const handleBulkArchive = useCallback(async () => {
    const ids = bulkSelectedEvents.map((event) => event.id);
    if (ids.length === 0) return;

    const archiving = libraryView === "active";

    setBulkBusyAction("archive");
    setError("");

    try {
      const outcome = await runBulkArchive(ids, archiving);
      if (outcome.cancelled) return;

      if (outcome.result.failed.length > 0) {
        setError(`Updated ${outcome.result.updated}; failed on ${outcome.result.failed.length}.`);
      }
      handleExitSelectionMode();
      await fetchLibrary({ silent: true });
      delete eventsCacheRef.current[archiving ? "archived" : "active"];
    } catch (err) {
      setError(String(err));
    } finally {
      setBulkBusyAction(null);
    }
  }, [bulkSelectedEvents, fetchLibrary, handleExitSelectionMode, libraryView]);

  const handleBulkDelete = useCallback(async () => {
    const ids = bulkSelectedEvents.map((event) => event.id);
    if (ids.length === 0) return;

    setBulkBusyAction("delete");
    setError("");

    try {
      const outcome = await runBulkDelete(ids);
      if (outcome.cancelled) return;

      if (outcome.result.failed.length > 0) {
        setError(`Deleted ${outcome.result.deleted}; failed to remove ${outcome.result.failed.length}.`);
      }
      handleExitSelectionMode();
      await fetchLibrary({ silent: true });
    } catch (err) {
      setError(String(err));
    } finally {
      setBulkBusyAction(null);
    }
  }, [bulkSelectedEvents, fetchLibrary, handleExitSelectionMode]);

  const handleBulkToggleTag = useCallback(
    async (tagName: string) => {
      const ids = bulkSelectedEvents.map((event) => event.id);
      if (ids.length === 0) return;

      const shouldAdd = getTagCoverage(bulkSelectedEvents, tagName) !== "all";
      const snapshot = bulkSelectedEvents.map((event) => ({
        id: event.id,
        tags: [...event.tags],
      }));

      patchEvents(
        bulkSelectedEvents.map((event) => {
          const hasTag = event.tags.includes(tagName);
          if (shouldAdd && !hasTag) {
            return { id: event.id, patch: { tags: [...event.tags, tagName] } };
          }
          if (!shouldAdd && hasTag) {
            return {
              id: event.id,
              patch: { tags: event.tags.filter((entry) => entry !== tagName) },
            };
          }
          return { id: event.id, patch: {} };
        }),
      );

      setError("");

      try {
        const outcome = await runBulkToggleTag(ids, tagName);
        if (outcome.result.failed.length > 0) {
          patchEvents(snapshot.map((entry) => ({ id: entry.id, patch: { tags: entry.tags } })));
          setError(`Updated ${outcome.result.updated}; failed on ${outcome.result.failed.length}.`);
        }
      } catch (err) {
        patchEvents(snapshot.map((entry) => ({ id: entry.id, patch: { tags: entry.tags } })));
        setError(String(err));
      }
    },
    [bulkSelectedEvents, patchEvents],
  );

  const handleBulkExport = useCallback(async () => {
    const ids = bulkSelectedEvents.map((event) => event.id);
    if (ids.length === 0) return;

    setBulkBusyAction("export");
    setError("");

    try {
      const outcome = await runBulkExport(ids);
      if (outcome.cancelled) return;

      if (outcome.result.failed.length > 0) {
        setError(`Exported ${outcome.result.exported}; failed on ${outcome.result.failed.length}.`);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBulkBusyAction(null);
    }
  }, [bulkSelectedEvents]);

  const handleSelectAdjacent = useCallback(
    (direction: "prev" | "next") => {
      if (filteredEvents.length === 0) return;

      const currentIndex = filteredEvents.findIndex((event) => event.id === selectedId);
      const startIndex = currentIndex === -1 ? 0 : currentIndex;
      const delta = direction === "next" ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(filteredEvents.length - 1, startIndex + delta));

      setSelectedId(filteredEvents[nextIndex]?.id ?? null);
    },
    [filteredEvents, selectedId],
  );

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedEvent) return;

    setError("");
    try {
      const deleted = await runDeleteEvent(selectedEvent);
      if (deleted) await fetchLibrary({ silent: true });
    } catch (err) {
      setError(String(err));
    }
  }, [fetchLibrary, selectedEvent]);

  useEffect(() => {
    setNoteDraftState(clampEventNote(selectedEvent?.note ?? ""));
  }, [selectedEvent?.id, selectedEvent?.note]);

  useEffect(() => {
    if (!selectedId) return;
    if (filteredEvents.some((event) => event.id === selectedId)) return;
    setSelectedId(null);
  }, [filteredEvents, selectedId]);

  useEffect(() => {
    if (!selectionMode) return;

    setSelectedIds((prev) => {
      const visibleIds = new Set(filteredEvents.map((event) => event.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredEvents, selectionMode]);

  useEffect(() => {
    const silent = hasLoadedOnceRef.current;
    fetchLibrary({ silent });
  }, [fetchLibrary, refreshKey, libraryView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        document.getElementById("library-search")?.focus();
        return;
      }

      if (!selectionMode && (event.key === "j" || event.key === "ArrowDown") && !isTyping) {
        event.preventDefault();
        handleSelectAdjacent("next");
        return;
      }

      if (!selectionMode && (event.key === "k" || event.key === "ArrowUp") && !isTyping) {
        event.preventDefault();
        handleSelectAdjacent("prev");
        return;
      }

      if (
        selectionMode &&
        event.key === "a" &&
        !isTyping &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        const allVisibleSelected =
          filteredEvents.length > 0 &&
          filteredEvents.every((item) => selectedIds.has(item.id));
        if (allVisibleSelected) {
          setSelectedIds(new Set());
          selectionAnchorRef.current = null;
        } else {
          setSelectedIds(new Set(filteredEvents.map((item) => item.id)));
          selectionAnchorRef.current = filteredEvents[0]?.id ?? null;
        }
        return;
      }

      if (event.key === "Escape" && selectionMode && !isTyping) {
        event.preventDefault();
        handleExitSelectionMode();
        return;
      }

      if (event.key === "Delete" && !isTyping) {
        if (selectionMode && bulkSelectedEvents.length > 0) {
          event.preventDefault();
          void handleBulkDelete();
          return;
        }
        if (selectedEvent) {
          event.preventDefault();
          void handleDeleteSelected();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    bulkSelectedEvents.length,
    handleBulkDelete,
    handleDeleteSelected,
    handleExitSelectionMode,
    filteredEvents,
    handleSelectAdjacent,
    selectedEvent,
    selectedIds,
    selectionMode,
  ]);

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      handleExitSelectionMode();
      return;
    }
    updatePrefs({ libraryListOpen: true });
    setBulkBusyAction(null);
    setSelectionMode(true);
    setSelectedIds(new Set());
    selectionAnchorRef.current = null;
  };

  const handleToggleEventSelected = (
    eventId: string,
    checked: boolean,
    options?: { shiftKey?: boolean },
  ) => {
    if (options?.shiftKey && selectionAnchorRef.current) {
      setSelectedIds((prev) =>
        applyRangeSelection(
          filteredEvents,
          selectionAnchorRef.current!,
          eventId,
          prev,
          checked,
        ),
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });
    selectionAnchorRef.current = eventId;
  };

  const handleLibraryViewChange = (view: LibraryView) => {
    if (view === libraryView) return;

    const cachedEvents = eventsCacheRef.current[view];
    setIsViewRefreshing(true);
    setLibraryView(view);
    handleExitSelectionMode();

    setSelectedId(null);

    if (cachedEvents) {
      setEvents(cachedEvents);
    }
  };

  const handleClearFilters = () => {
    setSourceFilter(undefined);
    setTagFilter(undefined);
    setSearchInput("");
    updatePrefs({
      dateRange: DEFAULT_LIBRARY_PREFERENCES.dateRange,
      minCameras: DEFAULT_LIBRARY_PREFERENCES.minCameras,
    });
  };

  const handleSaveNote = async () => {
    if (!selectedEvent) return;

    const nextNote = clampEventNote(noteDraft);
    if (nextNote !== noteDraft) {
      setNoteDraft(nextNote);
    }
    if (nextNote === selectedEvent.note) return;

    const previousNote = selectedEvent.note;
    patchEvent(selectedEvent.id, { note: nextNote });

    try {
      await updateEvent({ eventId: selectedEvent.id, note: nextNote });
    } catch (err) {
      patchEvent(selectedEvent.id, { note: previousNote });
      setNoteDraft(previousNote);
      setError(String(err));
    }
  };

  const handleToggleTag = async (tagName: string) => {
    if (!selectedEvent) return;

    const previousTags = selectedEvent.tags;
    const nextTags = previousTags.includes(tagName)
      ? previousTags.filter((entry) => entry !== tagName)
      : [...previousTags, tagName];

    patchEvent(selectedEvent.id, { tags: nextTags });

    try {
      await updateEvent({ eventId: selectedEvent.id, tags: nextTags });
    } catch (err) {
      patchEvent(selectedEvent.id, { tags: previousTags });
      setError(String(err));
    }
  };

  const handleChangeSource = async (source: EventSource) => {
    if (!selectedEvent || selectedEvent.source === source) return;

    const previousSource = selectedEvent.source;
    patchEvent(selectedEvent.id, { source });

    try {
      await updateEvent({ eventId: selectedEvent.id, source });
    } catch (err) {
      patchEvent(selectedEvent.id, { source: previousSource });
      setError(String(err));
    }
  };

  return {
    events,
    tags,
    selectedId,
    setSelectedId,
    selectionMode,
    selectedIds,
    bulkBusyAction,
    isBulkBusy: Boolean(bulkBusyAction),
    sourceFilter,
    setSourceFilter,
    tagFilter,
    setTagFilter,
    libraryView,
    searchInput,
    setSearchInput,
    prefs,
    filtersExpanded,
    setFiltersExpanded,
    isInitialLoad,
    error,
    setError,
    noteDraft,
    setNoteDraft,
    filteredEvents,
    selectedEvent,
    isViewRefreshing,
    bulkSelectedEvents,
    hasActiveFilters,
    showEmptyLibrary,
    showNoMatches,
    updatePrefs,
    fetchLibrary,
    handleToggleSelectionMode,
    handleToggleEventSelected,
    handleSelectAllFiltered: () => {
      setSelectedIds(new Set(filteredEvents.map((event) => event.id)));
      selectionAnchorRef.current = filteredEvents[0]?.id ?? null;
    },
    handleClearBulkSelection: () => {
      setSelectedIds(new Set());
      selectionAnchorRef.current = null;
    },
    handleExitSelectionMode,
    handleBulkArchive,
    handleBulkDelete,
    handleBulkExport,
    handleBulkToggleTag,
    handleLibraryViewChange,
    handleClearFilters,
    handleSaveNote,
    handleToggleTag,
    handleChangeSource,
  };
};
