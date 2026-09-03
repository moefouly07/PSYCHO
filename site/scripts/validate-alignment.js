/*
 * Structural validator for neutral alignment maps.
 *
 * The central rule this enforces: an alignment map must NOT look like an
 * assessment. No polarity, no scores, no compatibility copy.
 */
import { loadBrowserData, report } from "./lib/load-data.mjs";

const errors = [];
const warnings = [];
const win = loadBrowserData(errors);
const alignment = win.BAYNANA_ALIGNMENT;
const premarital = win.BAYNANA_PREMARITAL;

if (!alignment) errors.push("window.BAYNANA_ALIGNMENT was not created");

/* The eight neutral premarital domains, 7 through 14. */
const requiredMaps = [
  "marriage-expectations",
  "values-faith-culture",
  "money-and-obligations",
  "home-and-mental-load",
  "family-and-social-boundaries",
  "children-and-parenting",
  "work-place-lifestyle",
  "affection-and-intimacy"
];

/* Fields that would mean this content is being scored like an assessment. */
const forbiddenFields = ["polarity", "s", "score", "scoreMode", "supportive", "bands", "interp", "dim"];

const forbiddenCopy = [
  "نسبة توافق",
  "درجة توافق",
  "نسبة التوافق",
  "توافق مضمون",
  "شريك مثالي",
  "علاقة فاشلة",
  "إجابة صحيحة",
  "الإجابة الأفضل",
  "غير صحي",
  "طبيعي وغير طبيعي"
];

const validTypes = new Set(["ordered", "nominal"]);
const validSensitivity = new Set(["standard", "personal", "intimate"]);

if (alignment) {
  const maps = alignment.maps || [];
  const ids = maps.map((map) => map.id);

  requiredMaps.forEach((id) => {
    if (!ids.includes(id)) errors.push(`Missing required alignment map: ${id}`);
  });
  if (new Set(ids).size !== ids.length) errors.push("Alignment map IDs are not unique");

  const importanceIds = (alignment.importanceLevels || []).map((level) => level.id).sort().join(",");
  if (importanceIds !== "essential,flexible,important") {
    errors.push(`Importance levels must be flexible/important/essential, found: ${importanceIds}`);
  }
  ["same", "close", "different", "unsure", "skipped"].forEach((key) => {
    if (!alignment.classificationLabels?.[key]) errors.push(`Missing classification label: ${key}`);
  });
  if (!alignment.specialAnswers?.unsure?.label) errors.push("Missing the 'not yet discussed' answer label");
  if (!alignment.specialAnswers?.private?.label) errors.push("Missing the 'prefer not to answer' label");

  let itemCount = 0;
  const allItemIds = new Set();

  maps.forEach((map) => {
    if (!Number.isInteger(map.schemaVersion)) errors.push(`${map.id}: missing schemaVersion`);
    if (!Number.isInteger(map.contentVersion)) errors.push(`${map.id}: missing contentVersion`);
    if (map.kind !== "alignment") errors.push(`${map.id}: kind must be "alignment"`);
    if (!map.reviewStatus) errors.push(`${map.id}: missing reviewStatus`);
    if (map.reviewStatus && /expert|reviewed-by|clinical/i.test(map.reviewStatus) && !/pending/i.test(map.reviewStatus)) {
      errors.push(`${map.id}: reviewStatus claims a review that has not happened`);
    }
    if (map.lastReviewedOn && !/^\d{4}-\d{2}-\d{2}$/.test(map.lastReviewedOn)) {
      errors.push(`${map.id}: lastReviewedOn must be an ISO date or absent`);
    }
    if (!map.title || !map.short || !map.description) errors.push(`${map.id}: missing title/short/description`);
    if (!validSensitivity.has(map.sensitivity)) errors.push(`${map.id}: invalid sensitivity ${map.sensitivity}`);
    if (!Array.isArray(map.sourceIds) || !map.sourceIds.length) errors.push(`${map.id}: missing sourceIds`);

    const categories = map.categories || [];
    const items = map.items || [];
    if (categories.length !== 6) errors.push(`${map.id}: expected 6 categories, found ${categories.length}`);
    if (items.length !== 18) errors.push(`${map.id}: expected 18 items, found ${items.length}`);
    itemCount += items.length;

    const categoryIds = new Set(categories.map((category) => category.id));
    if (categoryIds.size !== categories.length) errors.push(`${map.id}: category IDs are not unique`);
    categories.forEach((category) => {
      if (!category.name || !category.desc) errors.push(`${map.id}/${category.id}: missing name or description`);
      if (!category.followUp) errors.push(`${map.id}/${category.id}: missing neutral follow-up question`);
      const count = items.filter((item) => item.cat === category.id).length;
      if (count !== 3) errors.push(`${map.id}/${category.id}: expected 3 items, found ${count}`);
    });

    items.forEach((item) => {
      if (allItemIds.has(item.id)) errors.push(`Duplicate alignment item ID: ${item.id}`);
      allItemIds.add(item.id);
      if (!categoryIds.has(item.cat)) errors.push(`${map.id}/${item.id}: unknown category ${item.cat}`);
      if (!validTypes.has(item.type)) errors.push(`${map.id}/${item.id}: type must be ordered or nominal`);
      if (!item.prompt || item.prompt.length < 10) errors.push(`${map.id}/${item.id}: prompt is too short`);
      if (!Array.isArray(item.options) || item.options.length !== 5) {
        errors.push(`${map.id}/${item.id}: expected a five-position neutral scale`);
      } else {
        const values = item.options.map((option) => option.v).join(",");
        if (values !== "0,1,2,3,4") errors.push(`${map.id}/${item.id}: option values must be 0..4 in order`);
        if (item.options.some((option) => !option.t || option.t.length < 2)) {
          errors.push(`${map.id}/${item.id}: option text missing`);
        }
      }
      if (item.allowUnsure !== true) errors.push(`${map.id}/${item.id}: every item must allow "not yet discussed"`);
      if (item.sensitivity !== "standard" && item.allowPrivate !== true) {
        errors.push(`${map.id}/${item.id}: sensitive items must allow "prefer not to answer"`);
      }
      forbiddenFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(item, field)) {
          errors.push(`${map.id}/${item.id}: alignment items must not carry the assessment field "${field}"`);
        }
        if (item.options?.some((option) => Object.prototype.hasOwnProperty.call(option, field))) {
          errors.push(`${map.id}/${item.id}: alignment options must not carry the assessment field "${field}"`);
        }
      });
    });

    /* Intimate content must be optional and adult-gated. */
    if (map.sensitivity === "intimate" && (!map.optional || !map.adultOnly)) {
      errors.push(`${map.id}: intimate maps must be optional and adult-only`);
    }
  });

  const serialized = JSON.stringify(maps);
  forbiddenCopy.forEach((phrase) => {
    if (serialized.includes(phrase)) errors.push(`Alignment copy must not contain: ${phrase}`);
  });

  /* Every neutral domain must be reachable from the journey registry. */
  if (premarital) {
    const mapped = premarital.domains
      .filter((domain) => domain.canonical.kind === "alignment")
      .map((domain) => domain.canonical.refId);
    requiredMaps.forEach((id) => {
      if (!mapped.includes(id)) errors.push(`Alignment map ${id} is not mapped to a premarital domain`);
    });
  }

  report("Alignment validation", errors, warnings, [
    `${maps.length} alignment maps · ${maps.length * 6} categories · ${itemCount} items · no scores, no polarity`
  ]);
} else {
  report("Alignment validation", errors, warnings);
}
