/* Shared browser-data loader for the validators. No external dependencies. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, "..", "..");

/* Load order mirrors the <script> order in index.html exactly. */
export const DATA_FILES = [
  "data/tests.js",
  "data/config.js",
  "data/additional-tests.js",
  "data/premarital/skill-assessments.js",
  "data/sources.js",
  "data/assessment-registry.js",
  "data/premarital/alignment-maps.js",
  "data/conversation/categories.js",
  "data/conversation/questions.js",
  "data/conversation/decks.js",
  "data/knowledge/categories.js",
  "data/knowledge/items.js",
  "data/premarital/registry.js"
];

export function loadBrowserData(errors = []) {
  const context = vm.createContext({ window: {}, console });
  for (const relativePath of DATA_FILES) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`Missing file: ${relativePath}`);
      continue;
    }
    try {
      vm.runInContext(fs.readFileSync(absolutePath, "utf8"), context, { filename: relativePath });
    } catch (error) {
      errors.push(`${relativePath} could not be evaluated: ${error.message}`);
    }
  }
  return context.window;
}

export function report(name, errors, warnings, summaryLines = []) {
  warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
  if (errors.length) {
    errors.forEach((error) => console.error(`ERROR: ${error}`));
    console.error(`${name} FAILED with ${errors.length} error(s).`);
    process.exitCode = 1;
    return false;
  }
  console.log(`${name} passed.`);
  summaryLines.forEach((line) => console.log(line));
  return true;
}
