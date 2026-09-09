import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let count = 0;
async function check(folder) {
  for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) {
    const relative = path.join(folder, entry.name);
    if (entry.isDirectory()) await check(relative);
    else if (/\.m?js$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ["--check", path.join(root, relative)], { encoding: "utf8" });
      if (result.status) throw new Error(result.stderr);
      count++;
    }
  }
}
for (const folder of ["assets/js", "data", "scripts", "tests"]) await check(folder);
console.log(`JavaScript syntax check passed: ${count} files. No TypeScript or lint configuration.`);
