/*
 * Legacy assessment preservation guard.
 *
 * validate-assessments.js checks structural shape (6 dimensions, 18 questions,
 * required IDs/titles present). It does NOT catch a dimension being silently
 * renamed, a negative dimension having its polarity flipped, or a question
 * being reassigned to a different dimension while every count still balances.
 * Any of those would pass every other check and still corrupt a live result
 * or a partner comparison. This file pins the exact fingerprint recovered
 * from the forensic audit of 2026-09-03 (see docs/LEGACY_ASSESSMENT_RECOVERY.md)
 * so that kind of silent corruption fails the build instead of shipping.
 *
 * Do not "fix" a mismatch here by editing this file to match a code change.
 * A mismatch means the data changed — go verify that was intentional first.
 */
import { loadBrowserData, report } from "./lib/load-data.mjs";
import { LEGACY_FINGERPRINT } from "./lib/legacy-fingerprint.mjs";

const errors = [];
const win = loadBrowserData(errors);
const data = win.BAYNANA_DATA;
if (!data) errors.push("window.BAYNANA_DATA was not created");

if (data) {
  const byId = new Map((data.tests || []).map((test) => [test.id, test]));

  Object.entries(LEGACY_FINGERPRINT).forEach(([id, expected]) => {
    const test = byId.get(id);
    if (!test) {
      errors.push(`${id}: assessment is missing entirely`);
      return;
    }
    if (test.title !== expected.title) {
      errors.push(`${id}: title changed from "${expected.title}" to "${test.title}"`);
    }

    const actualDims = new Map((test.dimensions || []).map((dim) => [dim.id, dim.polarity]));
    expected.dims.forEach(([dimId, polarity]) => {
      if (!actualDims.has(dimId)) {
        errors.push(`${id}: dimension "${dimId}" is missing`);
        return;
      }
      if (actualDims.get(dimId) !== polarity) {
        errors.push(`${id}/${dimId}: polarity changed from "${polarity}" to "${actualDims.get(dimId)}" — this inverts how the result reads`);
      }
    });
    if (actualDims.size !== expected.dims.length) {
      errors.push(`${id}: expected exactly ${expected.dims.length} dimensions, found ${actualDims.size}`);
    }

    const actualQuestionsByDim = new Map();
    (test.questions || []).forEach((question) => {
      if (!actualQuestionsByDim.has(question.dim)) actualQuestionsByDim.set(question.dim, []);
      actualQuestionsByDim.get(question.dim).push(question.id);
    });
    expected.questionsByDim.forEach(([dimId, expectedQuestionIds]) => {
      const actualIds = (actualQuestionsByDim.get(dimId) || []).slice().sort();
      const wanted = expectedQuestionIds.slice().sort();
      if (JSON.stringify(actualIds) !== JSON.stringify(wanted)) {
        errors.push(`${id}/${dimId}: expected questions [${wanted.join(", ")}], found [${actualIds.join(", ")}]`);
      }
    });
  });

  const missingFromFingerprint = (data.tests || [])
    .map((test) => test.id)
    .filter((id) => !LEGACY_FINGERPRINT[id]);
  if (missingFromFingerprint.length) {
    errors.push(`Assessment(s) not covered by the legacy fingerprint: ${missingFromFingerprint.join(", ")}. Add them to scripts/lib/legacy-fingerprint.mjs so future changes are caught.`);
  }

  report("Legacy assessment preservation", errors, [], [
    `${Object.keys(LEGACY_FINGERPRINT).length} assessments pinned by exact dimension id, polarity, and question-to-dimension mapping`
  ]);
} else {
  report("Legacy assessment preservation", errors, []);
}
