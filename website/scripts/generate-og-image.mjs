import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(rootDir, "../public/og-image.svg");
const pngPath = path.join(rootDir, "../public/og-image.png");

const svg = readFileSync(svgPath);
await sharp(svg).png({ quality: 90 }).toFile(pngPath);

console.log(`Generated ${path.relative(process.cwd(), pngPath)}`);
