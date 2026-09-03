/* Core scoring and pairing smoke tests. */
import assert from "node:assert/strict";

globalThis.window = {
  location: { origin: "https://example.test", pathname: "/", href: "https://example.test/#/" }
};
globalThis.location = globalThis.window.location;

const { scoreFromPercentages, compareScores, comparisonLabel } = await import("../assets/js/scoring.js");
const { encodePairingCode, decodePairingCode, isSameResult, shareLinkFor } = await import("../assets/js/pairing.js");

const dimensions = Array.from({ length: 6 }, (_, index) => ({
  id: `d${index + 1}`,
  name: `Dimension ${index + 1}`,
  short: `D${index + 1}`,
  polarity: index === 5 ? "negative" : "positive",
  desc: "Description",
  interp: { low: "Low", developing: "Developing", strong: "Strong" },
  tip: "Tip"
}));
const test = { id: "example-test", dimensions, scoreMode: "skill", bands: [
  { min: 0, max: 39, label: "Low" },
  { min: 40, max: 59, label: "Moderate" },
  { min: 60, max: 79, label: "Clear" },
  { min: 80, max: 100, label: "Strong" }
] };

const score = scoreFromPercentages(test, [100, 80, 60, 40, 20, 100]);
assert.equal(score.dimensions[5].supportive, 0, "negative dimensions must reverse only for supportive ranking");
assert.equal(score.dimensions[5].interpretation, "Strong", "negative-dimension text must follow the raw named indicator");

const peer = scoreFromPercentages(test, [90, 60, 30, 40, 10, 70]);
const comparison = compareScores(test, score, peer);
assert.equal(comparison.similarity, 83);
assert.equal(comparison.rows.length, 6);
assert.equal(comparisonLabel(10), "تقارب واضح");
assert.equal(comparisonLabel(11), "اختلاف متوسط");
assert.equal(comparisonLabel(24), "اختلاف متوسط");
assert.equal(comparisonLabel(25), "اختلاف يستحق الحوار");

const record = {
  assessmentId: "example-test",
  nickname: "نور",
  dimensions: [0, 17, 33, 50, 67, 100],
  derived: { security: 71, tendency: "secure" },
  completedAt: 1700000000000
};
const code = encodePairingCode(record);
assert.match(code, /^BN1\.[A-Za-z0-9_-]+$/);
const decoded = decodePairingCode(code, { availableIds: ["example-test"], expectedAssessmentId: "example-test" });
assert.equal(decoded.ok, true);
assert.deepEqual(decoded.payload.dimensions, record.dimensions);
assert.equal(isSameResult(decoded.payload, decoded.payload), true);
assert.ok(shareLinkFor("example-test", code).includes("#/assessment/example-test/partner/BN1."));

const tamperedLast = code.endsWith("A") ? "B" : "A";
const tampered = `${code.slice(0, -1)}${tamperedLast}`;
assert.equal(decodePairingCode(tampered, { availableIds: ["example-test"] }).ok, false);
assert.equal(decodePairingCode(code, { expectedAssessmentId: "other-test" }).code, "wrong-assessment");

console.log("Core scoring and pairing tests passed.");
