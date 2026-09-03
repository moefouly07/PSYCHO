/*
 * Source-integrity validator.
 *
 * Guards against the two failure modes that matter for a psychology-adjacent
 * product: fabricated citations, and fabricated claims about what the citations
 * prove. Every reference must carry a resolvable URL, and no reference may
 * assert reliability, validity, norms, or an expert review that did not happen.
 */
import { loadBrowserData, report } from "./lib/load-data.mjs";

const errors = [];
const warnings = [];
const win = loadBrowserData(errors);
const sources = win.BAYNANA_SOURCES;
const data = win.BAYNANA_DATA;
const alignment = win.BAYNANA_ALIGNMENT;

if (!sources) errors.push("window.BAYNANA_SOURCES was not created");

/* Claims that would require evidence this project does not have. */
const forbiddenClaims = [
  "معامل ثبات",
  "معامل الثبات",
  "ألفا كرونباخ",
  "صدق تلازمي",
  "معايير سكانية",
  "مئينات",
  "نقاط قطع سريرية",
  "مُقنَّن على عينة",
  "راجعه مختصون",
  "معتمد من",
  "مرخّص من",
  "بإذن من الناشر",
  "بترخيص من"
];

const validVerification = new Set(["verified", "pending"]);

if (sources) {
  const pool = new Map();

  function collect(list, context) {
    (list || []).forEach((reference) => {
      if (!reference || typeof reference !== "object") {
        errors.push(`${context}: malformed reference entry`);
        return;
      }
      pool.set(reference.id || reference.url, { reference, context });
    });
  }

  collect(sources.global, "global");
  collect(sources.standards, "standards");
  Object.entries(sources.byAssessment || {}).forEach(([id, entry]) => {
    const refs = Array.isArray(entry) ? entry : entry?.references;
    if (!Array.isArray(refs) || !refs.length) errors.push(`byAssessment/${id}: no references`);
    collect(refs, `byAssessment/${id}`);
  });
  Object.entries(sources.byModule || {}).forEach(([id, entry]) => {
    const refs = Array.isArray(entry) ? entry : entry?.references;
    if (!Array.isArray(refs) || !refs.length) errors.push(`byModule/${id}: no references`);
    collect(refs, `byModule/${id}`);
  });

  pool.forEach(({ reference, context }, key) => {
    const label = `${context}/${key}`;
    if (!reference.id) errors.push(`${label}: missing source ID`);
    if (!reference.displayTitle && !reference.title) errors.push(`${label}: missing full title`);
    if (!reference.authors) errors.push(`${label}: missing authors or issuing organization`);
    if (!/^https:\/\//.test(reference.url || "")) errors.push(`${label}: missing or non-HTTPS canonical URL`);
    if (!reference.kind) errors.push(`${label}: missing source type`);
    if (!reference.description) errors.push(`${label}: missing description of what it supports`);
    if (reference.doi && !/^10\.\d{4,9}\/\S+$/.test(reference.doi)) {
      errors.push(`${label}: DOI does not look like a DOI (${reference.doi})`);
    }
    if (reference.year && (!Number.isInteger(reference.year) || reference.year < 1900 || reference.year > 2026)) {
      errors.push(`${label}: implausible year ${reference.year}`);
    }
    if (reference.verification && !validVerification.has(reference.verification)) {
      errors.push(`${label}: verification must be "verified" or "pending"`);
    }
    if (reference.accessedOn && !/^\d{4}-\d{2}-\d{2}$/.test(reference.accessedOn)) {
      errors.push(`${label}: accessedOn must be an ISO date`);
    }
    /* A commercial instrument must state its item-use status explicitly. */
    if (/commercial|instrument-documentation/.test(reference.kind || "") && !reference.itemUse) {
      errors.push(`${label}: commercial instrument entries must record item-use/licensing status`);
    }
  });

  const serialized = JSON.stringify(sources);
  forbiddenClaims.forEach((claim) => {
    if (serialized.includes(claim)) errors.push(`Source copy must not claim: ${claim}`);
  });

  /* Every alignment map's declared sourceIds must resolve to a real reference. */
  if (alignment) {
    const known = new Set(Array.from(pool.values()).map(({ reference }) => reference.id));
    alignment.maps.forEach((map) => {
      (map.sourceIds || []).forEach((id) => {
        if (!known.has(id)) errors.push(`${map.id}: unknown sourceId ${id}`);
      });
    });
  }

  /* Every assessment must have at least one reference. */
  if (data) {
    data.tests.forEach((test) => {
      const entry = sources.byAssessment?.[test.id];
      const refs = Array.isArray(entry) ? entry : entry?.references;
      if (!Array.isArray(refs) || !refs.length) errors.push(`${test.id}: assessment has no scientific source entry`);
    });
  }

  const verifiedCount = Array.from(pool.values())
    .filter(({ reference }) => reference.verification === "verified").length;

  report("Source validation", errors, warnings, [
    `${pool.size} distinct references · ${verifiedCount} carry an explicit verification stamp`,
    "No reliability, validity, norm, licensing, or expert-review claim is asserted"
  ]);
} else {
  report("Source validation", errors, warnings);
}
