import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const siteUrl = (process.env.VITE_SITE_URL ?? "https://reelattice.app").replace(/\/$/, "");
const releasesRepo = process.env.VITE_RELEASES_REPO ?? "OfirPatish/Reelattice";
const releasesLatestApi =
  process.env.VITE_RELEASES_LATEST_API ??
  `https://api.github.com/repos/${releasesRepo}/releases/latest`;

const injectBuildTokens = (content: string) =>
  content
    .replaceAll("__SITE_URL__", siteUrl)
    .replaceAll("__RELEASES_LATEST_API__", releasesLatestApi);

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "inject-site-url",
      transformIndexHtml(html) {
        return injectBuildTokens(html);
      },
      closeBundle() {
        const distDir = path.resolve(rootDir, "dist");
        for (const file of ["robots.txt", "sitemap.xml"] as const) {
          const filePath = path.join(distDir, file);
          if (fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, injectBuildTokens(fs.readFileSync(filePath, "utf8")));
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        download: path.resolve(rootDir, "download.html"),
        privacy: path.resolve(rootDir, "privacy.html"),
        terms: path.resolve(rootDir, "terms.html"),
      },
    },
  },
});
