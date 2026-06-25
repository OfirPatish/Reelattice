# Reelattice website

Marketing landing page for Reelattice — built with Vite, React, and Tailwind CSS.

**Live:** [reelattice.vercel.app](https://reelattice.vercel.app)

## Development

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

`build` generates `public/og-image.png` from the SVG (better social previews) then compiles the site.

Output is written to `website/dist/` (gitignored).

## Environment variables

Copy `.env.example` to `.env` when deploying:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SITE_URL` | Public site URL (SEO, Open Graph) | `https://reelattice.vercel.app` |
| `VITE_BASE` | Vite `base` path | `/` |
| `VITE_DOWNLOAD_URL` | Download button target | `/download` (default) |

Defaults if unset: `VITE_SITE_URL=https://reelattice.vercel.app`, `VITE_BASE=/`, `VITE_DOWNLOAD_URL=/download`.

## Deploy

Production is on **Vercel** (`patish/reelattice`, root directory `website`). Pushes to `main` that touch `website/` auto-deploy via the Git integration.

1. Import the repo in [Vercel](https://vercel.com) (or connect Git on an existing project).
2. Set **Root Directory** to `website`.
3. Set `VITE_SITE_URL` to your production URL (e.g. `https://reelattice.vercel.app`).
4. Deploy — `vercel.json` handles SPA routing and `/download` → `download.html`.

The `/download` page resolves the latest Windows installer from GitHub Releases without exposing raw API URLs in the marketing UI. If auto-redirect fails, users get a direct GitHub Releases link.

**Analytics:** [Vercel Analytics](https://vercel.com/docs/analytics) is included (`@vercel/analytics`). Enable Web Analytics in the Vercel project dashboard for page-view stats — no extra env vars required on Vercel.

CI: `.github/workflows/website-build.yml` verifies `npm run build` on pull requests and `main` pushes.

## Assets

- **Icons:** run `npm run icons:generate` from the repo root — syncs to `website/public/icons/` automatically.
- **Open Graph image:** `public/og-image.svg` (1200×630).
