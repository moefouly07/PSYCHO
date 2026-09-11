import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
if (path.dirname(output) !== root || path.basename(output) !== "dist") throw new Error("Unsafe output path");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// Explicit allowlist: prototypes, tests, dependencies and local data never ship.
for (const name of ["index.html", "robots.txt", "vercel.json", "assets", "data"]) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
await stat(path.join(output, "assets/js/app.js"));
console.log("Static production build written to site/dist (no server runtime).");
