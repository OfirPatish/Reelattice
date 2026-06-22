# Reelattice User Guide

Reelattice is a Windows desktop app for managing Tesla Dashcam, Sentry Mode, and Saved clips long-term. It copies footage into a searchable library on your PC — nothing is sent to the cloud.

**Download:** [reelattice.vercel.app](https://reelattice.vercel.app)

---

## What Reelattice does

Reelattice groups Tesla clips into **events** (one timestamp, up to six cameras). You import from USB or folders, review footage, add tags and notes, bundle related events into **Cases**, and export ZIP or grid MP4 when you need to share proof.

---

## Getting started

### 1. Import footage

- Open the **Import** tab, or drag Tesla clips onto **Library**.
- Select your TeslaCam USB folder, or a folder such as `RecentClips`, `SentryClips`, or `SavedClips`.
- Pick which events to import. Reelattice **copies** files into your library — you can remove the USB afterward.

**Accepted files:** `.mp4` only, named like `2026-06-16_02-11-07-front.mp4`.

**Encrypted clips (Tesla 2026.20+):** decrypt at [dashcam.tesla.com](https://dashcam.tesla.com/) before importing.

### 2. Review in Library

- Search with `/`, move between events with `j` / `k` or arrow keys.
- Filter by source (Recent / Sentry / Saved), tag, or date.
- Open an event → switch cameras or use **Grid** for all angles synced.
- Toggle **Notes** in the library toolbar to preview note text in the list (500 character limit per event).
- Add tags, notes, archive, or delete from the detail panel.

### 3. Cases (incident bundles)

Use **Cases** when several events belong to one incident (insurance claim, parking dispute, etc.):

1. Create a case with a title and description.
2. In Library bulk select → **Add to case**, or link events from the case detail view.
3. Open linked events back in Library without losing your bundle.

### 4. Export proof

From an open event (header icons):

- **ZIP** — all camera files plus metadata.
- **Grid MP4** — one video matching the in-app 6-camera grid (1920×960). Choose quality (Full, Standard, HD, or Web) before picking a save location.

Use **scissors** on the playback bar to trim a short segment (default 30 seconds; change in Settings → Playback) before exporting.

---

## TeslaCam folder layout

```
TeslaCam/
├── RecentClips/     ← flat MP4 files
├── SentryClips/     ← one folder per event
├── SavedClips/      ← same as Sentry
└── EncryptedClips/  ← not imported (decrypt first)
```

---

## USB drive prompt (Windows)

While Reelattice is open, it can notify you when a drive with TeslaCam folders is connected.

- **Import** → opens Import and scans that drive (only after you confirm).
- **Not now** → dismissed for this session (tracked by drive identity, not letter).

Turn off in **Settings → Import → Notify when TeslaCam drive is connected**.

The check is lightweight (folder names at the drive root only). It does not scan your entire disk or read video files until you choose Import.

---

## Where files are stored

| What | Default location (Windows) |
|------|----------------------------|
| Video library | `%USERPROFILE%\Documents\Reelattice\library` |
| Thumbnails | `library\.thumbnails\` |
| Database (tags, notes, cases) | `%APPDATA%\Reelattice\data.db` |

Change the library folder in **Settings → Storage → Change location**. Existing events keep their original paths.

---

## Keyboard shortcuts

| Keys | Action |
|------|--------|
| `/` | Focus search |
| `j` / `k` or ↑ / ↓ | Previous / next event |
| `a` | Select all (bulk mode) |
| Shift+click | Range select |
| Delete | Delete selected |
| Esc | Exit bulk selection |
| ← / → | Skip 5 seconds (playback) |
| Space | Play / pause |

Full list: **Help** tab in the app.

---

## Updates

Installed apps check for updates on startup and in **Settings → About**. Updates install in-app with a progress overlay (download size and estimated time remaining).

Opening Reelattice while it is already running focuses the existing window instead of starting a second copy.

---

## Privacy

- No account required  
- No cloud upload of video  
- No analytics on your footage  

See [Privacy Policy](https://reelattice.vercel.app/privacy) and [Terms of Use](https://reelattice.vercel.app/terms).

Reelattice is not affiliated with Tesla, Inc.
