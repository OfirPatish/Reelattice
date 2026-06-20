import { CheckSquare, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FilterEmptyIllustration } from "@/components/empty-illustrations";
import { EventDetailPanel } from "@/components/event-detail-panel";
import { EventDetailPlaceholder } from "@/components/event-detail-placeholder";
import { EventDetailSkeleton, EventListSkeleton } from "@/components/event-list-skeleton";
import { LibraryBulkPanel } from "@/components/library/library-bulk-panel";
import { CasePickerDialog } from "@/components/library/case-picker-dialog";
import { LibraryActiveFilters } from "@/components/library/library-active-filters";
import { LibraryListIdleHint, LibraryToolbar } from "@/components/library/library-toolbar";
import { LibraryFilterPanel } from "@/components/library/library-filter-panel";
import { LibraryDropHint } from "@/components/library/library-drop-hint";
import { LibraryEventRows } from "@/components/library/library-event-rows";
import { FadeIn } from "@/components/ui/fade-in";
import { useLibraryDropImport } from "@/hooks/use-library-drop-import";
import { useLibrary } from "@/hooks/use-library";
import { LIST_PANEL_INNER_WIDTH_CLASSES, LIST_PANEL_WIDTH_CLASSES } from "@/lib/library-preferences";
import type { AppView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { IndeterminateBar } from "@/components/ui/indeterminate-bar";
import { cn } from "@/lib/utils";

type EventListProps = {
  refreshKey: number;
  active: boolean;
  openEventId?: string | null;
  onOpenEventConsumed?: () => void;
  onNavigate: (view: AppView) => void;
  onReviewImport: (paths: string[]) => void;
};

export const EventList = ({
  refreshKey,
  active,
  openEventId,
  onOpenEventConsumed,
  onNavigate,
  onReviewImport,
}: EventListProps) => {
  const [casePickerEventIds, setCasePickerEventIds] = useState<string[] | null>(null);
  const library = useLibrary(refreshKey);
  const listOpen = library.prefs.libraryListOpen;
  const hasBrowsableEvents = library.filteredEvents.length > 0;
  const canCollapseList = !library.selectionMode && hasBrowsableEvents;
  const listPanelWidthClass = LIST_PANEL_WIDTH_CLASSES[library.prefs.listWidth];
  const listPanelInnerWidthClass = LIST_PANEL_INNER_WIDTH_CLASSES[library.prefs.listWidth];
  const listToggleLabel = listOpen ? "Hide library" : "Show library";

  const { dragOver } = useLibraryDropImport({
    enabled: active && !library.selectionMode,
    onDropImport: onReviewImport,
  });

  const handleListToggle = () => {
    library.updatePrefs({ libraryListOpen: !listOpen });
  };

  const listScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !openEventId) return;
    library.setSelectedId(openEventId);
    onOpenEventConsumed?.();
  }, [active, library.setSelectedId, onOpenEventConsumed, openEventId]);

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col transition-shadow",
        dragOver && "ring-2 ring-inset ring-sky-500/25",
      )}
    >
      {library.isInitialLoad && <IndeterminateBar />}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          id="library-event-list"
          aria-label="Event list"
          aria-busy={library.isInitialLoad}
          className={cn(
            "relative flex min-h-0 shrink-0 flex-col overflow-hidden border-zinc-800 transition-[width] duration-200 ease-out",
            listOpen
              ? cn(
                  "max-h-[min(50vh,28rem)] border-b lg:max-h-none",
                  listPanelWidthClass,
                  "lg:border-b-0 lg:border-r",
                )
              : canCollapseList
                ? "w-9 border-b lg:max-h-none lg:border-b-0 lg:border-r"
                : "w-0 border-0",
          )}
        >
          {!listOpen && canCollapseList ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center bg-zinc-950 py-3">
              <button
                type="button"
                aria-expanded={listOpen}
                aria-controls="library-event-list"
                aria-label={listToggleLabel}
                onClick={handleListToggle}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}

          {(listOpen || canCollapseList) && (
          <div
            className={cn(
              listPanelInnerWidthClass,
              "flex h-full min-h-0 shrink-0 flex-col",
              !listOpen && canCollapseList && "pointer-events-none select-none",
            )}
            aria-hidden={!listOpen}
          >
            <div className="shrink-0 space-y-3 border-b border-zinc-800 bg-zinc-950/40 p-4">
              <LibraryToolbar
                filteredCount={library.filteredEvents.length}
                totalCount={library.events.length}
                hasActiveFilters={library.hasActiveFilters}
                isInitialLoad={library.isInitialLoad}
                searchInput={library.searchInput}
                libraryView={library.libraryView}
                sourceFilter={library.sourceFilter}
                onSearchChange={library.setSearchInput}
                onClearSearch={() => library.setSearchInput("")}
                onLibraryViewChange={library.handleLibraryViewChange}
                onSourceFilterChange={library.setSourceFilter}
                canCollapse={canCollapseList}
                onCollapse={handleListToggle}
              />

              <LibraryFilterPanel
                expanded={library.filtersExpanded}
                isInitialLoad={library.isInitialLoad}
                tagFilter={library.tagFilter}
                tags={library.tags}
                prefs={library.prefs}
                onToggleExpanded={() => library.setFiltersExpanded((open) => !open)}
                onTagFilterChange={library.setTagFilter}
                onPrefsChange={library.updatePrefs}
              />

              <LibraryActiveFilters
                searchInput={library.searchInput}
                sourceFilter={library.sourceFilter}
                tagFilter={library.tagFilter}
                dateRange={library.prefs.dateRange}
                minCameras={library.prefs.minCameras}
                onClearSearch={() => library.setSearchInput("")}
                onSourceFilterChange={library.setSourceFilter}
                onTagFilterChange={library.setTagFilter}
                onDateRangeChange={(dateRange) => library.updatePrefs({ dateRange })}
                onMinCamerasChange={(minCameras) => library.updatePrefs({ minCameras })}
                onClearAll={library.handleClearFilters}
              />
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
              {!library.isInitialLoad && !library.selectionMode && (
                <LibraryDropHint
                  libraryView={library.libraryView}
                  dragOver={dragOver}
                />
              )}

              {!library.isInitialLoad && library.filteredEvents.length > 0 && (
                <div className="z-[1] flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/60 bg-zinc-950/95 px-4 py-2">
                  <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {library.selectionMode
                      ? library.selectedIds.size > 0
                        ? `${library.selectedIds.size} selected — use panel on the right`
                        : "Tap events to select"
                      : "Events"}
                  </p>
                  <Button
                    type="button"
                    variant={library.selectionMode ? "outline" : "ghost"}
                    size="sm"
                    onClick={library.handleToggleSelectionMode}
                    disabled={library.isBulkBusy}
                    className="h-6 shrink-0 px-2 text-[10px]"
                    aria-pressed={library.selectionMode}
                  >
                    <CheckSquare className="h-3 w-3" aria-hidden />
                    {library.selectionMode ? "Done" : "Select"}
                  </Button>
                </div>
              )}

              <div
                ref={listScrollRef}
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto transition-opacity duration-200 ease-out",
                  library.isViewRefreshing && "pointer-events-none opacity-50",
                )}
                aria-busy={library.isViewRefreshing}
              >
                {library.isInitialLoad && <EventListSkeleton />}

                {library.error && !library.isInitialLoad && (
                  <div className="px-4 py-8 text-center text-sm text-red-400" role="alert">
                    {library.error}
                  </div>
                )}

                {library.showEmptyLibrary && (
                  <FadeIn
                    refreshKey={`${library.libraryView}-${library.isViewRefreshing}`}
                  >
                    <LibraryListIdleHint libraryView={library.libraryView} />
                  </FadeIn>
                )}

                {library.showNoMatches && (
                  <FadeIn
                    refreshKey={`${library.libraryView}-${library.isViewRefreshing}`}
                  >
                    <div className="flex w-full flex-col items-center gap-3 px-4 py-10 text-center text-sm text-zinc-500">
                      <FilterEmptyIllustration size="compact" className="mx-auto shrink-0" />
                      <p>No matches.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={library.handleClearFilters}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </FadeIn>
                )}

                {!library.isInitialLoad && library.filteredEvents.length > 0 && (
                  <LibraryEventRows
                    scrollElementRef={listScrollRef}
                    events={library.filteredEvents}
                    selectedId={library.selectedId}
                    selectionMode={library.selectionMode}
                    selectedIds={library.selectedIds}
                    showNotesInList={library.prefs.showNotesInList}
                    onSelectEvent={library.setSelectedId}
                    onToggleSelected={library.handleToggleEventSelected}
                  />
                )}
              </div>

              {library.isViewRefreshing && !library.isInitialLoad && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-3 flex justify-center"
                  aria-hidden
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-medium text-zinc-400 shadow-sm backdrop-blur-sm">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Switching…
                  </span>
                </div>
              )}
            </div>
          </div>
          )}
        </aside>

        <section
          id="library-event-detail"
          aria-label="Event detail"
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          {library.isInitialLoad && <EventDetailSkeleton />}

          {!library.isInitialLoad && library.selectionMode && (
            <LibraryBulkPanel
              selectedEvents={library.bulkSelectedEvents}
              filteredEvents={library.filteredEvents}
              selectedIds={library.selectedIds}
              tags={library.tags}
              busyAction={library.bulkBusyAction}
              filteredCount={library.filteredEvents.length}
              viewingArchived={library.libraryView === "archived"}
              onSelectAll={library.handleSelectAllFiltered}
              onClearSelection={library.handleClearBulkSelection}
              onExitSelection={library.handleExitSelectionMode}
              onDelete={() => void library.handleBulkDelete()}
              onExport={() => void library.handleBulkExport()}
              onArchive={() => void library.handleBulkArchive()}
              onToggleTag={(tagName) => void library.handleBulkToggleTag(tagName)}
              onAddToCase={() => {
                setCasePickerEventIds(Array.from(library.selectedIds));
              }}
            />
          )}

          <CasePickerDialog
            open={casePickerEventIds !== null}
            eventIds={casePickerEventIds ?? []}
            onClose={() => setCasePickerEventIds(null)}
            onSuccess={() => {
              library.handleClearBulkSelection();
              library.handleExitSelectionMode();
            }}
          />

          {!library.isInitialLoad &&
            !library.selectionMode &&
            !library.displayEvent &&
            !library.error && (
              <div
                className={cn(
                  "relative flex min-h-0 flex-1 flex-col transition-opacity duration-200 ease-out",
                  library.isViewRefreshing && "pointer-events-none opacity-60",
                )}
              >
                <EventDetailPlaceholder
                  reason={
                    library.events.length === 0
                      ? library.libraryView === "archived"
                        ? "archived-empty"
                        : "empty-library"
                      : library.filteredEvents.length === 0
                        ? "no-matches"
                        : "pick-event"
                  }
                  libraryView={library.libraryView}
                  listOpen={listOpen}
                  canBrowseEvents={library.filteredEvents.length > 0}
                  onShowLibrary={() => library.updatePrefs({ libraryListOpen: true })}
                  onImport={() => onNavigate("import")}
                  onHelp={() => onNavigate("help")}
                  onClearFilters={library.handleClearFilters}
                />
              </div>
            )}

          {!library.isInitialLoad && !library.selectionMode && library.displayEvent && (
            <EventDetailPanel
              event={library.displayEvent}
              isViewRefreshing={library.isViewRefreshing}
              tags={library.tags}
              noteDraft={library.noteDraft}
              isSavingNote={library.isSavingNote}
              playbackLayout={library.prefs.playbackLayout}
              seekStepSecs={library.prefs.seekStepSecs}
              exportSegmentSecs={library.prefs.exportSegmentSecs}
              detailInspectorOpen={library.prefs.detailInspectorOpen}
              onPlaybackLayoutChange={(layout) => library.updatePrefs({ playbackLayout: layout })}
              onDetailInspectorOpenChange={(open) =>
                library.updatePrefs({ detailInspectorOpen: open })
              }
              onNoteChange={library.setNoteDraft}
              onNoteSave={library.handleSaveNote}
              onToggleTag={library.handleToggleTag}
              onSourceChange={(source) => void library.handleChangeSource(source)}
              onLibraryChange={() => void library.fetchLibrary({ silent: true })}
              onDeleted={() => void library.fetchLibrary({ silent: true })}
            />
          )}
        </section>
      </div>
    </div>
  );
};
