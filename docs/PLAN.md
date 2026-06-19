# Reelattice — Plan & Roadmap

**Product:** Reelattice  
**Type:** Local-first desktop app (Tauri 2 + React)  
**Status:** v1.3 — daily-use ready, public releases on GitHub  
**Last updated:** June 2026

---

## Implementation status

### Shipped (v0.1)

- [x] Import from TeslaCam folders, loose MP4s, multi-folder + drag-and-drop
- [x] Group cameras by filename timestamp; copy files to local library
- [x] Event library: search, filters, sort, persisted display preferences
- [x] Single-camera playback + fullscreen multi-cam review
- [x] Tags, notes, delete (single + bulk), re-import after delete
- [x] Bulk tag edit in selection mode
- [x] Settings: storage stats, paths, copy path, reset preferences
- [x] Correct Tesla wall-clock timestamps (no timezone shift)
- [x] Import completes → Library; wizard resets for next import
- [x] Fixed 1600×900 window (v0.1); v0.3: **1680×945** default, resizable + maximizable
- [x] Rust unit tests for parser and grouping

### Shipped (v0.2)

- [x] Video preview thumbnails in event list (lazy-loaded front camera frame)
- [x] Archive / restore events (single + bulk, Active · Archived library toggle)
- [x] Export event as ZIP + text summary (all cameras + metadata)
- [x] Export multi-camera grid video (.mp4) — same layout as Grid playback (1920×960, 2:1)
- [x] Event header actions: folder, ZIP, grid MP4, archive, delete (with hover labels)
- [x] Grid export progress UI (elapsed time, MB written, stall hint)
- [x] FFmpeg lifecycle: bundled sidecar, killed on app exit, temp `.mp4.part` then rename
- [x] Bulk export (multi-event ZIP)
- [x] Library drag-and-drop → Import wizard
- [x] Playback UI polish: unified control bar, inline Single | Grid toggle, synced multi-cam grid
- [x] Bulk selection UX: sticky bar, shift+click range, keyboard shortcuts
- [x] Consistent single-camera playback (`object-contain`, full frame in player area)
- [x] Settings overview: stats, prefs summary, shortcuts, reset preferences syncs Library
- [x] Import: loose-file source picker + bulk “Set all to” when structure is ambiguous
- [x] Library filter panel: collapsible Filter & view; stays open when reverting filters (no ghost-click collapse)

### Shipped (v0.3)

- [x] Collapsible library list + details inspector (collapse icon in library header; slim strip when closed; state persisted)
- [x] Segment export (30s scissors mode) for ZIP and grid MP4
- [x] Edit event source (Recent / Sentry / Saved) after import
- [x] Detail inspector: summary, tags, notes, per-camera sizes (replaces raw filename list)
- [x] Active / Archived toggle with smooth transitions (fade, cache, stable drop hint)
- [x] Resizable, maximizable window (default 1680×945)
- [x] Optimistic tag/note saves (no detail flicker)
- [x] Delete removes empty parent timestamp folders in library
- [x] **Help** tab — quick start, guides, examples, keyboard shortcuts
- [x] Playback keyboard: ← / → skip 5s, Space play/pause
- [x] Segment export rail (reserved slot above seek bar; no layout shift)
- [x] Camera pills: centered segmented control under timeline
- [x] Bulk actions: per-icon loading state (not all spinners at once)
- [x] Settings storage cards (stacked layout, size badges, copy checkmark)
- [x] Edit event source compact badge; seek slider without focus ring flash
- [x] Playback error overlay for clips that cannot decode (e.g. slipped-through encryption)
- [x] Import wizard: stable drop zone, scan-state fixes, encrypted-folder banner
- [x] Active / Archived: smooth fades, per-view cache, sliding tab pill
- [x] Library list collapse control inside the panel (header chevron + slim expand strip)
- [x] Dashcam REC empty state when no event is selected; no focus-ring flash on controls
- [x] App-wide context menu disabled (text fields still allow copy/paste)

### Shipped (v0.3.1)

- [x] Import grouping: timestamp subfolders → one event each; flat MP4s group by filename timestamp (not one mega-event)
- [x] Async import scan + copy (`spawn_blocking`) — UI stays responsive on large batches
- [x] Virtualized event list (`@tanstack/react-virtual`) for large libraries
- [x] FFmpeg thumbnails: `ensure_clip_thumbnail` + `get_clip_thumbnail_data`; cache in `library/.thumbnails/`
- [x] Import source labeling: auto-tag only when the selected folder is `RecentClips` / `SentryClips` / `SavedClips`, or when scanning a full TeslaCam root; timestamp folders, loose MP4s, and generic folders → picker (default Recent)
- [x] Empty state UX: contextual CSS animations — Dashcam REC (no footage / pick event), filter funnel (no matches), archive shelf, timeline hint (left list), import drop zone, bulk-select checkboxes
- [x] Library collapse: animated panel width; list content stays fixed width and clips (no event-card reflow); virtualized rows use stable heights
- [x] Bulk select panel: action cards, selection progress, animated empty state on the right
- [x] Library collapse chevron hidden when the list has no browsable events

### Shipped (v1.0)

- [x] Custom frameless window with draggable title bar and window controls (minimize / maximize / close)
- [x] Branded NSIS installer (sidebar + header artwork)
- [x] In-app auto-updates via GitHub Releases (`latest.json`, signed NSIS bundle)
- [x] GitHub Actions release workflow + updater signing keys
- [x] User-facing version display as major.minor (e.g. **1.0** from `1.0.0`)
- [x] Header update status indicator (check on startup, install from Settings → About)

### Shipped (v1.3)

- [x] **Changelog** tab — concise release notes per version (1.0 → latest)
- [x] Help: software update behavior in Good to know

### Shipped (v1.2)

- [x] New circular transparent app icon (multi-cam reel / play motif)
- [x] Round `AppLogo` in title bar and Settings

### Next (v0.4)

- [ ] Cancel mid-copy during import (async Rust job)
- [ ] Custom library location
- [ ] Cases / incident bundles (`cases` table exists, unused)

---

## What Reelattice is

Reelattice organizes Tesla Dashcam and Sentry footage into **events** (one timestamp, multiple camera angles). Users import from USB or folders, tag and annotate incidents, search the library, and review footage — all offline.

Separate from **SentryClip** (mobile PWA): SentryClip reminds you to check clips before the buffer expires; Reelattice manages the actual video files long-term.

---

## Tesla footage layout

```
TeslaCam/
├── RecentClips/          # flat MP4s only (grouped by filename timestamp)
├── SentryClips/           # timestamp subfolders, MP4s inside each
├── SavedClips/           # same subfolder layout as Sentry
└── EncryptedClips/       # 2026.20+ — decrypt via dashcam.tesla.com before import
```

**Accepted import format**

- Extension: `.mp4` only (case-insensitive)
- Filename pattern: `{YYYY-MM-DD}_{HH-MM-SS}-{camera}.mp4`
- Cameras: `front`, `back`, `left_repeater`, `right_repeater`, `left_pillar`, `right_pillar`
- Other files (`.txt`, images, random MP4s) are **silently skipped** during scan
- Duplicate events (same timestamp already in library) are marked and skipped on import

**Encrypted clips (2026.20+)**

- Paths under `EncryptedClips/` are detected and **not imported**
- Loose encrypted MP4s (moved out of that folder) are detected when the file is large but not a valid MP4 container
- If one slips through, playback shows an error with a link to [dashcam.tesla.com](https://dashcam.tesla.com/)
- Disable in car: Controls → Safety → Encrypt Dashcam Recordings

Event folder or clip filename pattern:

```
2026-06-16_02-20-11-front.mp4
2026-06-16_02-20-11-right_repeater.mp4
```

Timestamps in filenames are **local wall-clock time** — stored and displayed as-is.

**Source labeling (Recent / Sentry / Saved)**

| What you import | Auto-detected? | UI |
|-----------------|----------------|-----|
| Full TeslaCam USB root | Yes | Badge per event |
| Folder named `RecentClips`, `SentryClips`, or `SavedClips` | Yes | Badge |
| Timestamp folder (`2024-01-15_14-30-22/`) | No | Dropdown (default Recent) |
| Loose `.mp4` files (browse / drag-drop) | No | Dropdown |
| Generic folder (any other name) | No | Dropdown |

Sentry is never guessed from folder layout alone. Timestamp folders do not contain source names — even if they live under `SentryClips` on disk, picking that folder directly still asks you to choose. Full TeslaCam scans infer source from the parent clip folder during structured scan.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React UI                                                    │
│  EventList · EventDetailPanel · ImportWizard · HelpView · SettingsView │
├─────────────────────────────────────────────────────────────┤
│  src/lib/api.ts → Tauri invoke                               │
├─────────────────────────────────────────────────────────────┤
│  Rust (src-tauri/src/)                                       │
│  · scan_import_paths · import_tesla_events (async)           │
│  · get_events · update_event (note, tags, source) · delete_event · bulk_delete    │
│  · ensure_clip_thumbnail · get_clip_thumbnail_data           │
│  · bulk_export_events_zip · bulk_toggle_tags                 │
│  · export_event_grid_video · get_path_byte_size              │
│  · get_app_settings · open_*_folder                          │
│  · tesla/parser.rs · tesla/grouping.rs · tesla/grid_video.rs │
├─────────────────────────────────────────────────────────────┤
│  SQLite (%APPDATA%/Reelattice/data.db)                        │
│  Video library (Documents/Reelattice/library/)                │
│  Thumbnails (library/.thumbnails/{clip-id}.jpg)               │
└─────────────────────────────────────────────────────────────┘
```

### Import behavior

1. Scan paths → match Tesla `.mp4` filenames; ignore everything else  
2. Group by timestamp folder or filename timestamp (≤6 cameras per event)  
3. Infer source from clip folder name (`RecentClips` / `SentryClips` / `SavedClips`) or structured TeslaCam scan; timestamp folders and loose files → user picks on import  
4. Skip encrypted clips (`EncryptedClips` path or invalid MP4 header on loose files)  
5. User selects events → **copy** MP4s to library  
6. Store `library_path` on event; `import_path` for dedupe only  
7. Playback and “Open folder” use **library copy**, not the original source  

### Grid video export

- Output: **1920×960** (2:1) — matches a 3×2 grid of 4:3 Tesla cameras; cells are 640×480
- FFmpeg sidecar bundled via `scripts/download-ffmpeg.ps1`; used for grid export and list thumbnails
- Thumbnails: 320px-wide JPEG extract at ~0.4s; cached under `library/.thumbnails/`; served to UI as base64 data URLs
- Writes to `*.mp4.part` during encode, renames on success; duration capped to shortest clip
- **Import copy does not use FFmpeg**; thumbnails generate on first list view

### Default paths (Windows)

| Data | Path |
|------|------|
| Library | `%USERPROFILE%\Documents\Reelattice\library` |
| Thumbnails | `library/.thumbnails/` |
| Database | `%APPDATA%\Reelattice\data.db` |

---

## Key modules

```
src/
├── components/
│   ├── library/                # filters, virtual rows, thumbnails, bulk panel, drop import
│   ├── empty-illustrations.tsx # animated empty states (timeline, filter, archive, import, bulk)
│   ├── dashcam-rec-empty.tsx   # Dashcam REC animation (detail placeholder)
│   ├── event-list.tsx          # library shell (list collapse, Active/Archived fades)
│   ├── event-detail-panel.tsx  # playback, tags, notes, export status
│   ├── event-header-actions.tsx
│   ├── grid-export-status.tsx
│   ├── event-playback-surface.tsx  # single mount for all video elements
│   ├── playback-controls-bar.tsx   # seek, play, camera tabs, layout, fullscreen
│   ├── video-player.tsx        # fullscreen wrapper + camera state
│   ├── import-wizard.tsx
│   ├── help-view.tsx
│   ├── settings-view.tsx
│   └── …
├── hooks/
│   ├── use-library.ts          # library state, fetch, bulk ops, per-view cache, keyboard
│   ├── use-synced-videos.ts    # multi-cam sync + playback state
│   └── use-library-drop-import.ts
└── lib/
    ├── api.ts
    ├── clip-thumbnail.ts       # thumbnail load queue + data URL cache
    ├── bulk-actions.ts         # bulk archive / delete / export / tags
    ├── bulk-selection.ts       # shift+click range select, BulkBusyAction type
    ├── event-actions.ts        # export / archive / delete helpers
    ├── keyboard-shortcuts.ts   # shared shortcut list (Help + Settings)
    ├── library-filters.ts      # filter & sort logic
    ├── library-preferences.ts  # localStorage (incl. playbackLayout, list inner width)
    ├── import-source.ts        # import review source overrides
    └── playback-metrics.ts     # segment export window, 5s seek step

src-tauri/src/
├── commands/
│   ├── events/                 # mod, archive, delete, export, tags
│   └── import.rs
├── tesla/                      # parser, grouping, grid_video (FFmpeg)
└── db/                         # schema, migrations
```

### Processes

| Process | When |
|---------|------|
| `reelattice.exe` | App open |
| `ffmpeg` | Grid MP4 export; short-lived per-clip thumbnail extract (cached) |
| `node`/Vite | `npm run tauri:dev` only — not shipped |

See [docs/README.md](./README.md) for the full tree.

---

## Resolved decisions

| Decision | Choice |
|----------|--------|
| App name | **Reelattice** (user-facing) |
| Repo layout | `Desktop/Projects/Reelattice` |
| Import | Copy to library (not reference in place) |
| Playback UI | Single angle + tabs; inline grid toggle; optional fullscreen |
| Video player | Native `<video>` + Tauri asset protocol; one surface, CSS layout switch |
| Single-camera frame | `object-contain` in player — full frame, side bars on wide panels are normal |
| Window | Default 1680×945; resizable and maximizable |
| Grid export resolution | 1920×960 (2:1), not 16:9 — avoids side pillarboxing |
| Legacy app name | Vaultline paths still supported for existing libraries |

---

## Testing

| Area | How |
|------|-----|
| Parser / grouping / grid filter | `cargo test` in `src-tauri/` |
| Frontend | `npm test` (Vitest, passWithNoTests) |
| End-to-end | Manual import + playback with real TeslaCam folder |

---

## MVP success criteria ✓

- [x] Import TeslaCam / loose clips into grouped events  
- [x] Tags, notes, search, playback  
- [x] Data persists locally across restarts  
- [x] No network required  

---

*Plan version: 1.8 — June 2026*
