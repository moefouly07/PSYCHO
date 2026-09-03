/*
 * Structural validator for the "قد إيه تعرفني؟" knowledge challenge.
 *
 * Two rules matter most here:
 *  - adjacency (a half point) may only exist on explicitly ordered items;
 *  - there must be no share-code support for item-level answers anywhere.
 */
import fs from "node:fs";
import path from "node:path";
import { loadBrowserData, report, root } from "./lib/load-data.mjs";

const errors = [];
const warnings = [];
const win = loadBrowserData(errors);

const meta = win.BAYNANA_KNOWLEDGE_CATEGORIES;
const itemData = win.BAYNANA_KNOWLEDGE_ITEMS;

if (!meta) errors.push("window.BAYNANA_KNOWLEDGE_CATEGORIES was not created");
if (!itemData) errors.push("window.BAYNANA_KNOWLEDGE_ITEMS was not created");

const REQUIRED_CATEGORIES = [
  "routines", "joy", "stress", "communication", "repair", "values",
  "future", "money", "family", "boundaries", "affection", "growth"
];

const MINIMUM_PER_CATEGORY = 8;
const MINIMUM_TOTAL = 96;

if (meta && itemData) {
  const categories = meta.categories || [];
  const items = itemData.items || [];
  const categoryIds = categories.map((category) => category.id);

  if (categories.length !== 12) errors.push(`Expected exactly 12 categories, found ${categories.length}`);
  REQUIRED_CATEGORIES.forEach((id) => {
    if (!categoryIds.includes(id)) errors.push(`Missing required knowledge category: ${id}`);
  });
  if (new Set(categoryIds).size !== categoryIds.length) errors.push("Knowledge category IDs are not unique");

  if (items.length < MINIMUM_TOTAL) errors.push(`Expected at least ${MINIMUM_TOTAL} items, found ${items.length}`);

  /* Scoring marks: exactly three scoring marks and two excluded marks. */
  const marks = meta.reviewMarks || [];
  const scoring = marks.filter((mark) => mark.scores);
  const excluded = marks.filter((mark) => !mark.scores);
  if (scoring.length !== 3) errors.push("Expected exactly three scoring review marks");
  if (excluded.length !== 2) errors.push("Expected exactly two excluded review marks (ambiguous, private)");
  if (scoring.find((mark) => mark.id === "accurate")?.value !== 1) errors.push("Accurate must score 1");
  if (scoring.find((mark) => mark.id === "close")?.value !== 0.5) errors.push("Close must score 0.5");
  if (scoring.find((mark) => mark.id === "different")?.value !== 0) errors.push("Different must score 0");
  if (!meta.disclaimer || !meta.disclaimer.includes("لا يقيس")) errors.push("Missing the required knowledge disclaimer");

  const ids = new Set();
  const prompts = new Map();

  items.forEach((item) => {
    if (ids.has(item.id)) errors.push(`Duplicate knowledge item ID: ${item.id}`);
    ids.add(item.id);
    if (!/^[a-z0-9_-]{3,40}$/i.test(item.id)) errors.push(`${item.id}: invalid stable ID format`);
    if (!categoryIds.includes(item.cat)) errors.push(`${item.id}: unknown category ${item.cat}`);
    if (item.kind !== "knowledge") errors.push(`${item.id}: kind must be "knowledge"`);
    if (!Number.isInteger(item.schemaVersion)) errors.push(`${item.id}: missing schemaVersion`);
    if (!Number.isInteger(item.contentVersion)) errors.push(`${item.id}: missing contentVersion`);
    if (!item.prompt || item.prompt.length < 10) errors.push(`${item.id}: prompt is too short`);

    if (!Array.isArray(item.options) || item.options.length < 4 || item.options.length > 6) {
      errors.push(`${item.id}: expected four to six substantive options, found ${item.options?.length}`);
    } else {
      item.options.forEach((option, index) => {
        if (option.v !== index) errors.push(`${item.id}: option values must be sequential from 0`);
        if (!option.t || option.t.length < 2) errors.push(`${item.id}: option text missing or too short`);
      });
      /* "Not sure" and "prefer not to answer" are engine-provided, never authored. */
      if (item.options.some((option) => /لست متأكد|أفضل عدم الإجابة/.test(option.t))) {
        errors.push(`${item.id}: skip answers must not be authored as substantive options`);
      }
    }

    if (item.type !== "ordered" && item.type !== "nominal") errors.push(`${item.id}: type must be ordered or nominal`);
    if (item.type === "nominal" && item.adjacentCounts) {
      errors.push(`${item.id}: nominal items must never award adjacency`);
    }
    if (item.type === "ordered" && typeof item.adjacentCounts !== "boolean") {
      errors.push(`${item.id}: ordered items must declare adjacentCounts explicitly`);
    }
    if (item.allowUnsure !== true) errors.push(`${item.id}: every item must allow "not sure"`);
    if (item.sensitivity !== "standard" && item.allowPrivate !== true) {
      errors.push(`${item.id}: sensitive items must allow "prefer not to answer"`);
    }
    if (!["concrete", "internal"].includes(item.focus)) errors.push(`${item.id}: focus must be concrete or internal`);

    const key = item.prompt.replace(/\s+/g, " ").trim();
    if (prompts.has(key)) errors.push(`Duplicate item text: "${key}" (${prompts.get(key)} and ${item.id})`);
    else prompts.set(key, item.id);
  });

  categories.forEach((category) => {
    const list = items.filter((item) => item.cat === category.id);
    if (list.length < MINIMUM_PER_CATEGORY) {
      errors.push(`${category.id}: expected at least ${MINIMUM_PER_CATEGORY} items, found ${list.length}`);
    }
    /* Balance: concrete everyday knowledge alongside internal-world knowledge. */
    const concrete = list.filter((item) => item.focus === "concrete").length;
    const internal = list.filter((item) => item.focus === "internal").length;
    if (concrete < 2 || internal < 2) {
      errors.push(`${category.id}: needs at least two concrete and two internal items (found ${concrete}/${internal})`);
    }
  });

  /*
   * There must be no share-code path for this feature. The knowledge modules
   * must not import the pairing codec or define one of their own.
   */
  const knowledgeSources = ["assets/js/knowledge.js", "assets/js/knowledge-views.js"];
  knowledgeSources.forEach((relativePath) => {
    const absolute = path.join(root, relativePath);
    if (!fs.existsSync(absolute)) {
      errors.push(`Missing file: ${relativePath}`);
      return;
    }
    /* Comments describe the rule; only executable code is checked against it. */
    const source = fs.readFileSync(absolute, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*/g, "$1");
    ["encodePairingCode", "encodeAlignmentCode", "toBase64Url", "BN1.", "BNA1."].forEach((marker) => {
      if (source.includes(marker)) {
        errors.push(`${relativePath}: must not support share codes (found "${marker}")`);
      }
    });
    if (/localStorage/.test(source)) {
      errors.push(`${relativePath}: must not touch localStorage directly`);
    }
  });

  report("Knowledge validation", errors, warnings, [
    `${categories.length} categories · ${items.length} items · ordered/nominal semantics enforced`,
    "No share code and no item-level persistence path exists for this feature"
  ]);
} else {
  report("Knowledge validation", errors, warnings);
}
