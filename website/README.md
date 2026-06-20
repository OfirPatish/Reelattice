# Reelattice website

Marketing landing page for Reelattice — built with Vite, React, and Tailwind CSS.

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

Output is written to `website/dist/` (gitignored).

## Environment variables

Copy `.env.example` to `.env` when deploying:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SITE_URL` | Public site URL (SEO, Open Graph) | `https://reelattice.app` |
| `VITE_BASE` | Vite `base` path | `/` |
| `VITE_DOWNLOAD_URL` | Download button target | `/download` (default) |

Defaults if unset: `VITE_SITE_URL=https://reelattice.app`, `VITE_BASE=/`, `VITE_DOWNLOAD_URL=/download`.

## Deploy

### Vercel (recommended)

1. Import the repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `website`.
3. Add `VITE_SITE_URL` to match your production domain (e.g. `https://reelattice.app`).
4. Deploy — `vercel.json` handles SPA routing and `/download` → `download.html`.

The `/download` page resolves the latest Windows installer without exposing GitHub links in the marketing UI.

### GitHub Pages (optional)

A workflow at `.github/workflows/deploy-website.yml` deploys to GitHub Pages if you prefer that over Vercel. It sets `VITE_BASE=/Reelattice/` and `VITE_DOWNLOAD_URL=/Reelattice/download.html`.

## Assets

- **Icons:** run `npm run icons:generate` from the repo root — syncs to `website/public/icons/` automatically.
- **Open Graph image:** `public/og-image.svg` (1200×630).
