# Developer Guide

Technical reference for building, testing, and releasing Reelattice.

---

## Stack

| Layer | Technology |
|-------|------------|
| Shell | Tauri 2 |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Database | SQLite (rusqlite) |
| Grid export | FFmpeg (bundled sidecar) |

---

## Prerequisites

- Node.js 20+
- Rust ([rustup](https://rustup.rs/))
- Windows: WebView2 (preinstalled on Windows 10/11)

---

## Commands

```bash
npm install
npm run tauri:dev      # dev app with hot reload
npm run tauri:build    # production installer
npm test               # frontend (vitest)
```

```bash
cd src-tauri && cargo test   # Rust unit tests
```

**FFmpeg sidecar** (if missing):

```powershell
.\scripts\download-ffmpeg.ps1
```

**Icons:**

```powershell
npm run icons:generate
npm run installer:assets
```

---

## Project layout

```
reelattice/
├── src/                 # React UI
├── src-tauri/src/       # Rust commands, Tesla parser, SQLite
├── website/             # Marketing site (Vite)
├── scripts/
└── docs/
```

Module map and roadmap: [PLAN.md](./PLAN.md)

---

## Releases

Follow `.cursor/rules/reelattice-release.mdc`.

1. Bump version in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`
2. Add entry in `src/lib/changelog.ts`
3. Update `website/src/lib/constants.ts` and `docs/PLAN.md`
4. Tag and push: `git tag vX.Y && git push origin vX.Y`

GitHub Actions builds the signed NSIS installer and `latest.json`.

**Signing keys (first time):**

```powershell
npm run updater:keys
```

- Commit `src-tauri/updater.pub`
- Store private key in `%USERPROFILE%\.tauri\reelattice.key` and GitHub secret `TAURI_SIGNING_PRIVATE_KEY`

---

## In-app copy

- **Help:** `src/components/help-view.tsx`
- **Changelog:** `src/lib/changelog.ts`
- **Shortcuts:** `src/lib/keyboard-shortcuts.ts`

Keep these in sync when shipping user-facing features.
