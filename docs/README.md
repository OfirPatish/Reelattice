# Documentation

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Features, setup, releases, icon workflow, keyboard shortcuts |
| [PLAN.md](./PLAN.md) | Roadmap, architecture, module map |

## In-app Help

The **Help** tab (`src/components/help-view.tsx`) mirrors and expands on this README for end users: quick start, workflow examples, shortcuts, and storage notes. Keep it updated when adding user-facing features.

Shortcut definitions live in one place: `src/lib/keyboard-shortcuts.ts` (shown in Help).

## Project layout

```
reelattice/
├── src/                      # React UI
│   ├── components/
│   │   ├── library/          # Event list, filters, bulk bar, case picker, virtual rows
│   │   ├── cases/            # Case title presets
│   │   ├── layout/           # App shell (Library · Import · Cases · Help · Changelog · Settings)
│   │   ├── help-view.tsx
│   │   ├── event-header-actions.tsx
│   │   ├── event-detail-panel.tsx
│   │   ├── event-detail-placeholder.tsx  # contextual empty states (detail panel)
│   │   ├── dashcam-rec-empty.tsx         # Dashcam REC animation
│   │   ├── empty-illustrations.tsx       # timeline, filter, archive, import, bulk animations
│   │   ├── encrypted-clips-banner.tsx
│   │   ├── playback-clip-error.tsx
│   │   ├── grid-export-status.tsx
│   │   ├── event-playback-surface.tsx
│   │   ├── playback-controls-bar.tsx
│   │   ├── video-player.tsx
│   │   ├── import-source-select.tsx
│   │   ├── import-wizard.tsx
│   │   ├── cases-view.tsx
│   │   ├── settings-view.tsx
│   │   └── ui/               # Shared primitives (button, fade-in, collapse-fade, …)
│   ├── hooks/                # use-library, use-synced-videos, use-library-drop-import
│   └── lib/                  # api, accent-tones, case-presets, changelog, bulk-actions
├── src-tauri/src/
│   ├── commands/
│   │   ├── events/           # CRUD, archive, export, bulk ops, thumbnails, open
│   │   ├── cases.rs          # Incident bundles
│   │   └── import.rs         # Scan, async import, library location
│   ├── tesla/
│   │   ├── parser.rs
│   │   ├── grouping.rs
│   │   ├── encrypted.rs      # EncryptedClips + MP4 header checks
│   │   ├── ffmpeg.rs
│   │   └── grid_video.rs     # FFmpeg grid export (1920×960)
│   └── db/                   # SQLite schema & migrations
├── scripts/download-ffmpeg.ps1
└── docs/                     # This folder
```
