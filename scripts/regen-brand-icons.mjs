/**
 * Rasterize public/brand/live-ping-mark.svg for favicon-ish PNGs used by manifest & Apple touch.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const sharp = (await import("sharp")).default;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public/brand/live-ping-mark.svg");
const svg = fs.readFileSync(svgPath);

const outs = [
  ["icon-192x192.png", 192],
  ["icon-512x512.png", 512],
  ["apple-touch-icon.png", 180],
];

for (const [name, size] of outs) {
  await sharp(svg).resize(size, size).png().toFile(path.join(root, "public", name));
  console.log("wrote", name, size + "×" + size);
}

fs.copyFileSync(svgPath, path.join(root, "app/icon.svg"));
console.log("synced app/icon.svg from public/brand/live-ping-mark.svg");
