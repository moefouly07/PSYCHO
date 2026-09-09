import assert from "node:assert/strict";
import { installDom } from "./lib/dom-shim.mjs";
import { loadBrowserData } from "./lib/load-data.mjs";

const { window, document } = installDom({ hash: "#/" });
Object.assign(window, loadBrowserData([]));
const { storage, assessmentSchema, sanitizeAlignmentRecord } = await import("../assets/js/storage.js");
const { scoreAssessment } = await import("../assets/js/scoring.js");
const { checksum, toBase64Url, fromBase64Url, encodePairingCode, decodePairingCode } = await import("../assets/js/pairing.js");
const { buildCategoryAggregates, encodeAlignmentCode, decodeAlignmentCode } = await import("../assets/js/alignment.js");
const { currentRoute, assessmentPath } = await import("../assets/js/router.js");
const { createQuickExit } = await import("../assets/js/safety.js");
const test = window.BAYNANA_DATA.tests[0];
const map = window.BAYNANA_ALIGNMENT.maps[0];
const answers = Object.fromEntries(test.questions.map(q => [q.id, 1]));
const alignmentAnswers = Object.fromEntries(map.items.map(q => [q.id, 2]));
let checks = 0;
function check(name, run) { storage.deleteAll(); run(); console.log(`  ok  ${name}`); checks++; }
const sign = (prefix, base) => `${prefix}${toBase64Url(JSON.stringify([...base, checksum(JSON.stringify(base))]))}`;
const record = { assessmentId: test.id, nickname: "تجربة", dimensions: [0, 17, 33, 50, 67, 100], completedAt: 1700000000000 };

check("scoring rejects incomplete and out-of-range answers instead of manufacturing zeroes", () => {
  assert.throws(() => scoreAssessment(test, {}));
  assert.throws(() => scoreAssessment(test, { ...answers, [test.questions[0].id]: 3 }));
  for (const value of [0, 1, 2]) {
    const score = scoreAssessment(test, Object.fromEntries(test.questions.map(q => [q.id, value])));
    assert.ok(score.dimensions.every(d => d.percentage === value * 50));
  }
});
check("corrupt JSON and foreign schemas recover safely", () => {
  window.localStorage.setItem(storage.key.progress(test.id), "{broken");
  assert.equal(storage.getProgress(test), null);
  window.localStorage.setItem(storage.key.progress(test.id), JSON.stringify({ v: 1, testId: test.id, nickname: "تجربة", answers, schema: "older" }));
  assert.equal(storage.getProgress(test).stale, true);
  assert.notEqual(assessmentSchema(test), assessmentSchema({ ...test, questions: test.questions.map((q, i) => i ? q : { ...q, prompt: "changed" }) }));
});
check("saved results are recomputed from complete answers, including safety", () => {
  const candidate = { v: 1, testId: test.id, nickname: "تجربة", answers, dimensions: [100, 100, 100, 100, 100, 100], safety: { level: "none", reasons: 2 } };
  window.localStorage.setItem(storage.key.result(test.id), JSON.stringify(candidate));
  assert.deepEqual(Array.from(storage.getResult(test).dimensions), [50, 50, 50, 50, 50, 50]);
  window.localStorage.setItem(storage.key.result(test.id), JSON.stringify({ ...candidate, answers: {} }));
  assert.equal(storage.getResult(test), null);
});
check("private mode completes a result without local answer writes or later migration", () => {
  storage.setPrivateMode(true);
  storage.setProgress(test, { nickname: "تجربة", answers });
  assert.deepEqual(storage.getProgress(test).answers, answers);
  storage.setResult(test, { nickname: "تجربة", answers, dimensions: [50, 50, 50, 50, 50, 50] });
  assert.ok(storage.getResult(test));
  assert.equal(window.localStorage.getItem(storage.key.result(test.id)), null);
  storage.setPrivateMode(false);
  assert.equal(storage.getResult(test), null);
});
check("denied storage stays usable and a full clear drops memory fallbacks", () => {
  const local = window.localStorage;
  const session = window.sessionStorage;
  const denied = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); }, get length() { throw Error(); } };
  window.localStorage = denied; window.sessionStorage = denied;
  storage.setPrivateMode(true);
  storage.setProgress(test, { nickname: "تجربة", answers });
  storage.writeSession(storage.sessionKey.safetyCheck, { sc1: "no" });
  assert.ok(storage.getProgress(test));
  assert.deepEqual(storage.readSession(storage.sessionKey.safetyCheck), { sc1: "no" });
  storage.clearSession();
  assert.equal(storage.getProgress(test), null);
  assert.equal(storage.readSession(storage.sessionKey.safetyCheck), null);
  window.localStorage = local; window.sessionStorage = session;
});
check("assessment code projects only six aggregates, never arbitrary derived fields or safety flags", () => {
  const code = encodePairingCode({ ...record, answers, notes: { a: "PRIVATE-NOTE" }, derived: { q1: 2, safety: 2, arbitrary: "private" } });
  const payload = JSON.parse(fromBase64Url(code.slice(4)));
  assert.deepEqual(payload, [1, test.id, "تجربة", record.dimensions, {}, record.completedAt, payload[6]]);
  assert.ok(!JSON.stringify(payload).includes("PRIVATE-NOTE"));
  assert.throws(() => encodePairingCode({ ...record, safetyCheck: { sc1: "often" } }));
});
check("legacy BN1 codes remain accepted, arbitrary derived values fail closed", () => {
  const base = [1, test.id, record.nickname, record.dimensions, { safety: 2 }, record.completedAt];
  assert.equal(decodePairingCode(sign("BN1.", base)).ok, true);
  base[4] = { q1: 2 };
  assert.equal(decodePairingCode(sign("BN1.", base)).ok, false);
});
check("both codecs reject oversized, trailing garbage, truncated and unsupported input", () => {
  const ac = encodePairingCode(record);
  const bc = encodeAlignmentCode({ mapId: map.id, nickname: record.nickname, contentVersion: map.contentVersion, aggregates: buildCategoryAggregates(map, { answers: alignmentAnswers }), completedAt: record.completedAt });
  for (const [code, decode] of [[ac, decodePairingCode], [bc, decodeAlignmentCode]]) {
    assert.equal(decode(code).ok, true);
    for (const value of [code.slice(0, -8), `${code}!`, "x".repeat(5000), "", code.replace("1.", "2.")]) assert.equal(decode(value).ok, false);
  }
  assert.equal(decodePairingCode(ac.replace("BN1.", "BN2.")).code, "version");
});
check("alignment decoder requires every category exactly once and coherent counts", () => {
  const aggregate = buildCategoryAggregates(map, { answers: alignmentAnswers });
  const base = [1, map.id, record.nickname, map.contentVersion, aggregate, record.completedAt];
  for (const invalid of [aggregate.slice(1), [...aggregate.slice(1), aggregate[1]], aggregate.map((a, i) => i ? a : { ...a, n: 64 })]) {
    assert.equal(decodeAlignmentCode(sign("BNA1.", [...base.slice(0, 4), invalid, base[5]]), { map }).ok, false);
  }
});
check("single-item alignment aggregates never disclose an exact position", () => {
  const item = map.items.find(item => item.type === "ordered");
  const aggregates = buildCategoryAggregates(map, { answers: { [item.id]: 4 } });
  assert.equal(aggregates.find(category => category.id === item.cat).p, null);
});
check("stale or missing alignment content versions cannot resume", () => {
  for (const version of [undefined, "1", 999]) {
    assert.equal(sanitizeAlignmentRecord(map, { v: 1, mapId: map.id, contentVersion: version }).stale, true);
  }
});
check("invalid cached partner payloads cannot reach a result view", () => {
  const code = encodePairingCode(record);
  storage.setPair(test.id, code, { dimensions: "broken", nickname: {} });
  assert.deepEqual(storage.getPair(test.id).payload.dimensions, record.dimensions);
  storage.setPair(test.id, "broken", {});
  assert.equal(storage.getPair(test.id), null);
});
check("pending alignment links stay session-only and clear on restart or session deletion", () => {
  const code = encodeAlignmentCode({ mapId: map.id, nickname: record.nickname, contentVersion: map.contentVersion,
    aggregates: buildCategoryAggregates(map, { answers: alignmentAnswers }), completedAt: record.completedAt });
  for (const clear of [() => storage.restartAlignment(map.id), () => storage.clearSession(), () => storage.deleteAll()]) {
    storage.setPendingAlignmentCode(map.id, code);
    assert.equal(storage.getPendingAlignmentCode(map.id), code);
    assert.equal(window.localStorage.length, 0);
    clear();
    assert.equal(storage.getPendingAlignmentCode(map.id), null);
  }
});
check("unknown suffixes reject and sensitive generated routes use neutral identifiers", () => {
  for (const hash of ["#/assessment/emotional-clarity/quiz/extra", "#/questions/category/identity/extra", `#/premarital/align/${map.id}/answer/extra`]) {
    window.location.hash = hash;
    assert.equal(currentRoute().name, "not-found");
  }
  const sensitive = window.BAYNANA_DATA.tests.find(test => test.safety);
  const route = assessmentPath(sensitive.id, "quiz");
  assert.match(route, /assessment\/a\d+\/quiz$/);
  window.location.hash = route;
  assert.equal(currentRoute().assessmentId, sensitive.id);
});
check("quick exit counts deliberate Escape presses, resets across views, and runs once", () => {
  let exits = 0;
  const oldReplace = window.location.replace;
  window.location.replace = () => {};
  const controller = createQuickExit({ onExit: () => { exits++; storage.clearSession(); } });
  const key = (value, repeat = false) => document.dispatchEvent({ type: "keydown", key: value, repeat, preventDefault() {} });
  controller.setSensitive(true);
  key("Escape"); key("Escape", true); assert.equal(exits, 0);
  controller.setSensitive(false); controller.setSensitive(true);
  key("Escape"); assert.equal(exits, 0);
  key("x"); key("Escape"); assert.equal(exits, 0);
  storage.writeSession(storage.sessionKey.safetyCheck, { sc1: "often" });
  key("Escape"); assert.equal(exits, 1);
  assert.equal(storage.readSession(storage.sessionKey.safetyCheck), null);
  controller.exit(); assert.equal(exits, 1);
  controller.destroy(); window.location.replace = oldReplace;
});
console.log(`Hardening tests passed: ${checks} checks.`);
