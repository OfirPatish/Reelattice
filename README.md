# Reelattice

Local-first desktop app for organizing Tesla Dashcam, Sentry Mode, and Saved clips — multi-camera events woven into one review grid.

## Features

### Library
- Browse events with search, source/tag/date filters, and sort options
- Collapsible **Filter & view** panel (tag, date, sort, display prefs); open state persists until you collapse it
- Virtualized event list for smooth scrolling with large libraries
- FFmpeg-generated thumbnails (cached in `library/.thumbnails/`, served as data URLs)
- **Collapsible library list** — chevron in the library header; animated width; list content stays fixed width when clipped (no card reflow); only shown when events are in the list
- **Collapsible details inspector** — tags, notes, camera summary on the right rail (only when an event is open)
- Saved display preferences (list width, min cameras, note previews, playback layout, panel open/closed)
- Keyboard navigation: `/` search, `j`/`k` or ↑/↓ between events, `Delete` to remove, `a` select all in bulk mode
- Lazy thumbnails in the event list (front camera frame via FFmpeg, cached on disk)
- **Empty states** — subtle CSS animations: Dashcam REC (no footage / pick event), filter funnel (no matches), archive shelf, timeline hint (left list)
- **Event actions** in the detail header: open folder, export ZIP, export grid MP4, archive, delete (hint row below icons)
- **Edit event source** (Recent / Sentry / Saved) from the detail header after import
- Active / Archived library views with smooth tab transitions and per-view caching
- **Bulk select** — action cards on the right, selection progress, shift+click range select, bulk tag / archive / delete / export
- **Drag-and-drop import** — drop Tesla clips on the library to open Import and review

### Playback
- Single-camera view with centered segmented camera pills; video fills the player (`object-contain`)
- Inline **Single | Grid** toggle — surround grid with synced multi-cam playback
- Unified control bar: reserved export-segment rail, seek, play/pause, camera pills, scissors, fullscreen
- **Keyboard:** ← / → skip 5 seconds, Space play/pause (when an event is open; not in text fields)
- **Segment export** — scissors sets a 30s window at the playhead; fuchsia Export rail shows the range; ZIP and grid MP4 both respect it
- Fullscreen uses the same player instance (no remount flash when switching layout or angle)

### Export
- **ZIP** — all camera clips + metadata for one event (or bulk multi-event ZIP); optional 30s segment when scissors mode is on
- **Grid MP4** — combines all cameras into one video matching the in-app Grid layout (1920×960, 2:1); optional segment trim
- Live export progress: elapsed time and MB written while encoding
- FFmpeg runs only during grid export and stops when the app closes

### Import
- TeslaCam USB folder scan — **RecentClips** (flat MP4s), **SentryClips** / **SavedClips** (timestamp subfolders)
- **Cancel import** mid-copy with progress counter in the Import wizard
- Timestamp subfolder batches (generic parent folders) import as **one event per subfolder**
- Loose MP4 files and arbitrary folder trees (recursive scan); flat MP4s in one folder group by filename timestamp
- **Encrypted clip detection** (Tesla 2026.20+) — skips `EncryptedClips` paths and non-playable loose MP4s; links to [dashcam.tesla.com](https://dashcam.tesla.com/)
- Stable import drop zone (no layout flicker on empty folders or re-scan)
- Multi-folder import, drag-and-drop, merge same timestamp across folders
- **Accepted format only** — `.mp4` files named like `2026-06-16_02-11-07-front.mp4` (other files are ignored)
- **Source labeling:** auto-tag when importing a TeslaCam root or a folder named `RecentClips` / `SentryClips` / `SavedClips`; timestamp folders, loose MP4s, and generic folders → you pick Recent / Sentry / Saved (defaults to Recent)
- Copies files into the Reelattice library (safe to remove the source after import)
- Returns to Library automatically when done
- Async scan + copy (non-blocking UI for large imports)
- Thumbnail generation uses FFmpeg on first list view; grid export uses the same sidecar

### Help
- In-app **Help** tab: quick start, topic guides with examples, keyboard shortcuts, storage notes
- **Changelog** tab: concise release notes per version
- Complements Settings (paths, stats, prefs) for onboarding new users

### Cases
- **Cases** tab — incident bundles with title, description, and linked events
- Quick title presets (parking lot, sentry alert, insurance claim, etc.) when creating a case
- View/edit modes — read-only by default; **Edit** to change details, **Save** when done
- Library bulk select → **Add to case** opens a picker (choose an existing case or create one)
- Open linked events back in Library; remove events from a case without deleting footage

### Settings
- Library overview: active/archived events, clips, tags, storage usage, breakdown by source
- **Custom library location** — choose where new imports are copied (Settings → Change location)
- **Storage** cards: video library + database paths, size badges, open folder, copy path
- Current display preferences summary + reset (sort, filters, list width, playback layout, panel state)
- Export & processes: segment export, grid MP4, FFmpeg lifecycle
- Keyboard shortcuts reference in **Help** (library + playback)
- App version and software updates (auto-check on startup; install from Settings → About)
- Destructive actions (delete, archive, reset) use native Windows confirm dialogs
- Local-first privacy note — no cloud sync

### Data model
- **Import copies files** to `Documents/Reelattice/library/{timestamp}/{event-id}/` — playback uses the copy, not the original USB path
- **Open folder** on an event opens the library copy (short hex folder is the event UUID prefix)
- **Delete** removes library files + metadata (allows re-import)
- Event times match Tesla filename wall-clock time (no timezone shift)

## Stack

| Layer | Technology |
|-------|------------|
| Shell | Tauri 2 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Components | Radix UI (shadcn-style) |
| Icons / dates | Lucide React, date-fns |
| Database | SQLite (rusqlite) |
| Grid video export | FFmpeg (bundled sidecar) |

## Prerequisites

- Node.js 20+
- Rust ([rustup](https://rustup.rs/))
- Windows: WebView2 (preinstalled on Windows 10/11)

## Commands

```bash
npm install          # install frontend dependencies
npm run tauri:dev    # run desktop app with hot reload
npm run tauri:build  # production .exe + installers
npm test             # vitest (frontend)
```

**Grid video export** bundles FFmpeg automatically. First-time setup (or if the sidecar is missing):

```powershell
.\scripts\download-ffmpeg.ps1
```

From `src-tauri/`:

```bash
cargo test           # Rust parser, grouping, grid export filter tests
```

## Default paths (Windows)

| Data | Location |
|------|----------|
| Video library | `%USERPROFILE%\Documents\Reelattice\library` |
| Thumbnails cache | `library/.thumbnails/` (per clip, JPEG) |
| Database | `%APPDATA%\Reelattice\data.db` |

## UI overview

```
┌──────────────────────────────────────────────────────────────┐
│  Reelattice   Library · Import · Cases · Help · Settings             │
├─────────────┬──────────────────────────────────────|─────────┤
│  Search     │  [Dashcam REC or video when event open] │ Details │
│  Filters    │  Single | Grid · scissors               │ rail    │
│  Event list │  (inspector rail only with event open)  │         │
│  (collapse) │                                         │         │
└─────────────┴──────────────────────────────────────|─────────┘
```

Default window: **1680×945** (16:9), centered, **resizable and maximizable**.

## Keyboard shortcuts

| Context | Keys | Action |
|---------|------|--------|
| Library | `/` | Focus search |
| Library | `j` / `k` or ↑ / ↓ | Next / previous event |
| Library | `a` | Select all (bulk mode) |
| Library | Shift+click | Range select |
| Library | Delete | Delete selected |
| Library | Esc | Exit bulk selection |
| Playback | ← / → | Skip back / forward 5s |
| Playback | Space | Play / pause |

Full list in **Help** or **Settings**.

## Processes

| When | What runs |
|------|-----------|
| Normal use | `reelattice.exe` only |
| Event list thumbnails (first view) | `reelattice.exe` + short `ffmpeg` extract per clip (cached) |
| Grid MP4 export | `reelattice.exe` + one `ffmpeg` child |
| After closing the app | Nothing (FFmpeg is terminated on exit) |
| Dev (`npm run tauri:dev`) | Also `node`/Vite — not part of the shipped app |

Import (copy), playback, and ZIP export do **not** require FFmpeg during import.

## App icon

Source: `reelattice-icon-source.png` (1024×1024 PNG, transparent background, circular artwork). Regenerate all sizes and sync to the UI:

```powershell
npm run icons:generate
npm run installer:assets   # refresh NSIS sidebar/header from the new icon
```

Icons are used in: window title bar / `.exe`, `public/icons/` (favicon + header via `AppLogo`, displayed as a circle).

## Releases & in-app updates

Reelattice checks [GitHub Releases](https://github.com/OfirPatish/Reelattice/releases) for updates. Installed apps download and install signed updates in-app from **Settings → About** or when prompted on startup. Use **Check for updates** anytime while the app is open; there is no background polling between checks.

### First-time setup (signing keys)

```powershell
npm run updater:keys
```

- **Public key** → `src-tauri/updater.pub` (commit this; already wired in `tauri.conf.json`)
- **Private key** → `%USERPROFILE%\.tauri\reelattice.key` (never commit)

Add the private key to GitHub repository secrets as `TAURI_SIGNING_PRIVATE_KEY` (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if you set one).

### Publish a new version

1. Bump version in `package.json` (`1.2`), `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` (`1.2.0` — semver required by Rust/Tauri). The app displays **1.2** to users.
2. Commit and push to GitHub
3. Tag and push:

```bash
git tag v1.2
git push origin v1.2
```

GitHub Actions builds the signed NSIS installer, updater bundle, and `latest.json`, then attaches them to the release.

### Local signed installer (optional)

```powershell
npm run tauri:installer
```

The build script auto-uses `%USERPROFILE%\.tauri\reelattice.key` when present. If missing, run `npm run updater:keys` first.

Ship `src-tauri/target/release/bundle/nsis/Reelattice_<version>_x64-setup.exe` for new installs. Existing users update in-app once `latest.json` is on the release.

## Project layout

```
reelattice/
├── src/
│   ├── components/
│   │   ├── library/              # list UI, filters, bulk bar, virtual rows, thumbnails
│   │   ├── layout/app-shell.tsx  # main nav
│   │   ├── help-view.tsx         # in-app guides & shortcuts
│   │   ├── event-header-actions.tsx
│   │   ├── event-detail-panel.tsx
│   │   ├── event-detail-placeholder.tsx  # contextual empty states (detail panel)
│   │   ├── dashcam-rec-empty.tsx         # Dashcam REC animation
│   │   ├── empty-illustrations.tsx       # timeline, filter, archive, import, bulk animations
│   │   ├── event-playback-surface.tsx
│   │   ├── playback-controls-bar.tsx
│   │   ├── video-player.tsx
│   │   ├── import-wizard.tsx
│   │   ├── cases-view.tsx
│   │   ├── settings-view.tsx
│   │   └── ui/                   # fade-in, collapse-fade, button, …
│   ├── hooks/                    # use-library, use-synced-videos, use-library-drop-import
│   └── lib/                      # api, clip-thumbnail, filters, bulk-actions, keyboard-shortcuts
├── src-tauri/src/
│   ├── commands/events/          # CRUD, archive, export, bulk ops, ensure_clip_thumbnail
│   └── tesla/                    # parser, grouping, encrypted, ffmpeg, grid_video
├── scripts/download-ffmpeg.ps1
└── docs/                         # roadmap & module map
```

Full details: [docs/README.md](./docs/README.md) · Roadmap: [docs/PLAN.md](./docs/PLAN.md)

## License

All rights reserved — see repository for usage terms.
