# Documentation

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Features, setup, commands, keyboard shortcuts |
| [PLAN.md](./PLAN.md) | Roadmap, architecture, module map |

## In-app Help

The **Help** tab (`src/components/help-view.tsx`) mirrors and expands on this README for end users: quick start, workflow examples, shortcuts, and storage notes. Keep it updated when adding user-facing features.

Shortcut definitions live in one place: `src/lib/keyboard-shortcuts.ts` (used by Help and Settings).

## Project layout

```
reelattice/
├── src/                      # React UI
│   ├── components/
│   │   ├── library/          # Event list, filters, bulk bar, virtual rows, thumbnails
│   │   ├── layout/           # App shell (Library · Import · Help · Settings)
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
│   │   ├── settings-view.tsx
│   │   └── ui/               # Shared primitives (button, fade-in, collapse-fade, …)
│   ├── hooks/                # use-library, use-synced-videos, use-library-drop-import
│   └── lib/                  # api, clip-thumbnail, types, filters, bulk-actions, keyboard-shortcuts
├── src-tauri/src/
│   ├── commands/
│   │   ├── events/           # CRUD, archive, export, bulk ops, thumbnails, open
│   │   └── import.rs
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
