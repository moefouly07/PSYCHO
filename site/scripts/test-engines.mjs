/*
 * Unit tests for the alignment, knowledge, storage, routing, safety, and
 * search engines. No runtime dependencies: a minimal window/storage stub is
 * built here so the browser modules can be imported directly.
 */
import assert from "node:assert/strict";
import { loadBrowserData } from "./lib/load-data.mjs";

/* ------------------------------------------------------------------ stubs */

function makeStorage() {
  const map = new Map();
  return {
    get length() { return map.size; },
    key(index) { return Array.from(map.keys())[index] ?? null; },
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    clear() { map.clear(); },
    _map: map
  };
}

const browserData = loadBrowserData([]);

globalThis.window = {
  BAYNANA_CONFIG: browserData.BAYNANA_CONFIG,
  localStorage: makeStorage(),
  sessionStorage: makeStorage(),
  location: { origin: "https://example.test", pathname: "/app/", href: "https://example.test/app/#/", hash: "#/" }
};
globalThis.location = window.location;
globalThis.document = {
  body: { classList: { toggle() {}, add() {}, contains() { return false; } } },
  querySelector() { return null; },
  addEventListener() {},
  createElement() { return { className: "", setAttribute() {}, append() {}, textContent: "" }; }
};

const { storage } = await import("../assets/js/storage.js");
const alignmentEngine = await import("../assets/js/alignment.js");
const knowledgeEngine = await import("../assets/js/knowledge.js");
const { currentRoute, alignmentPath, assessmentPath } = await import("../assets/js/router.js");
const { normalizeArabic } = await import("../assets/js/dom.js");
const safety = await import("../assets/js/safety.js");
const { encodePairingCode, decodePairingCode } = await import("../assets/js/pairing.js");

const {
  STATUS, classifyItem, compareAlignment, buildCategoryAggregates, compareCategoryAggregates,
  classifyCategoryAggregate, encodeAlignmentCode, decodeAlignmentCode, isSameAlignmentResult,
  alignmentShareLink, alignmentConstants
} = alignmentEngine;

const { MARK, autoCompare, scoreDirection } = knowledgeEngine;

const alignmentData = browserData.BAYNANA_ALIGNMENT;
const knowledgeItems = browserData.BAYNANA_KNOWLEDGE_ITEMS.items;
const testMap = alignmentData.maps.find((map) => map.id === "marriage-expectations");

let checks = 0;
function check(name, fn) {
  fn();
  checks += 1;
  console.log(`  ok  ${name}`);
}

/* ================================================= alignment classification */

const orderedItem = { id: "x1", cat: "c", type: "ordered", options: [0, 1, 2, 3, 4].map((v) => ({ v, t: `o${v}` })), allowUnsure: true, allowPrivate: true };
const nominalItem = { id: "x2", cat: "c", type: "nominal", options: [0, 1, 2, 3, 4].map((v) => ({ v, t: `n${v}` })), allowUnsure: true, allowPrivate: true };

check("ordered: identical answers are the same", () => {
  assert.equal(classifyItem(orderedItem, 2, 2).status, STATUS.same);
});
check("ordered: one position apart is close", () => {
  assert.equal(classifyItem(orderedItem, 1, 2).status, STATUS.close);
  assert.equal(classifyItem(orderedItem, 3, 2).status, STATUS.close);
});
check("ordered: two or more positions apart is different", () => {
  assert.equal(classifyItem(orderedItem, 0, 2).status, STATUS.different);
  assert.equal(classifyItem(orderedItem, 0, 4).status, STATUS.different);
});
check("nominal: closeness is never invented between categories", () => {
  assert.equal(classifyItem(nominalItem, 1, 1).status, STATUS.same);
  assert.equal(classifyItem(nominalItem, 1, 2).status, STATUS.different);
  assert.equal(classifyItem(nominalItem, 1, 2).distance, null);
});
check("not-discussed answers are reported, never scored", () => {
  assert.equal(classifyItem(orderedItem, "unsure", 2).status, STATUS.unsure);
  assert.equal(classifyItem(orderedItem, 2, "unsure").status, STATUS.unsure);
  assert.equal(classifyItem(orderedItem, undefined, 2).status, STATUS.unsure);
});
check("private answers are excluded, and privacy wins over not-discussed", () => {
  assert.equal(classifyItem(orderedItem, "private", 2).status, STATUS.skipped);
  assert.equal(classifyItem(orderedItem, "private", "unsure").status, STATUS.skipped);
});

/* ------------------------------------------------- priority conversations */

function recordFor(map, answerFn, importanceFn = () => "flexible") {
  const answers = {};
  const importance = {};
  map.items.forEach((item, index) => {
    answers[item.id] = answerFn(item, index);
    importance[item.id] = importanceFn(item, index);
  });
  return { mapId: map.id, nickname: "نور", answers, importance, contentVersion: map.contentVersion, completedAt: 1700000000000 };
}

check("a difference becomes a priority only when someone marked it important", () => {
  const own = recordFor(testMap, () => 0, (item, index) => (index === 0 ? "essential" : "flexible"));
  const peer = recordFor(testMap, () => 4);
  peer.nickname = "سلمى";
  const comparison = compareAlignment(testMap, own, peer);
  const first = comparison.rows[0];
  assert.equal(first.status, STATUS.different);
  assert.equal(first.priority, true, "essential + different is a priority conversation");
  const second = comparison.rows[1];
  assert.equal(second.status, STATUS.different);
  assert.equal(second.priority, false, "flexible differences are not priorities");
});

check("a same/close answer is never a priority, however important", () => {
  const own = recordFor(testMap, () => 2, () => "essential");
  const peer = recordFor(testMap, () => 2, () => "essential");
  const comparison = compareAlignment(testMap, own, peer);
  assert.equal(comparison.priorities.length, 0);
  assert.equal(comparison.counts.same, testMap.items.length);
});

check("comparison never produces an overall compatibility number", () => {
  const own = recordFor(testMap, (item, index) => index % 5);
  const peer = recordFor(testMap, (item, index) => (index + 1) % 5);
  const comparison = compareAlignment(testMap, own, peer);
  const keys = Object.keys(comparison);
  ["similarity", "percentage", "score", "overall", "compatibility"].forEach((banned) => {
    assert.ok(!keys.includes(banned), `comparison must not expose "${banned}"`);
  });
});

/* ------------------------------------------------------ category aggregates */

check("nominal items never contribute to a category mean", () => {
  const record = recordFor(testMap, () => 4);
  const aggregates = buildCategoryAggregates(testMap, record);
  aggregates.forEach((entry) => {
    const items = testMap.items.filter((item) => item.cat === entry.id);
    const orderedCount = items.filter((item) => item.type === "ordered").length;
    assert.equal(entry.n, orderedCount, `${entry.id}: only ordered items contribute`);
    assert.equal(entry.o, orderedCount);
  });
});

check("a category with no answered ordered item yields a null mean, not zero", () => {
  const record = recordFor(testMap, () => "unsure");
  const aggregates = buildCategoryAggregates(testMap, record);
  aggregates.forEach((entry) => assert.equal(entry.p, null));
  const peer = buildCategoryAggregates(testMap, recordFor(testMap, () => 2));
  const comparison = compareCategoryAggregates(testMap, aggregates, peer);
  comparison.rows.forEach((row) => assert.equal(row.status, STATUS.unsure));
});

check("category distance bands are ordered and total-free", () => {
  assert.equal(classifyCategoryAggregate({ p: 50 }, { p: 50 }).status, STATUS.same);
  assert.equal(classifyCategoryAggregate({ p: 50 }, { p: 70 }).status, STATUS.close);
  assert.equal(classifyCategoryAggregate({ p: 0 }, { p: 100 }).status, STATUS.different);
});

/* ------------------------------------------------------ alignment codes (BNA1) */

const baseRecord = {
  mapId: testMap.id,
  nickname: "نور",
  contentVersion: testMap.contentVersion,
  aggregates: buildCategoryAggregates(testMap, recordFor(testMap, (item, index) => index % 5)),
  completedAt: 1700000000000
};
const alignCode = encodeAlignmentCode(baseRecord);

check("BNA1 codes round-trip and are versioned separately from BN1", () => {
  assert.match(alignCode, /^BNA1\.[A-Za-z0-9_-]+$/);
  assert.equal(alignmentConstants.PREFIX, "BNA1.");
  const decoded = decodeAlignmentCode(alignCode, { expectedMapId: testMap.id });
  assert.equal(decoded.ok, true);
  assert.equal(decoded.payload.contentVersion, testMap.contentVersion);
});

check("BN1 assessment codes still decode and are unaffected by BNA1", () => {
  const legacy = encodePairingCode({
    assessmentId: "emotional-clarity",
    nickname: "نور",
    dimensions: [0, 17, 33, 50, 67, 100],
    derived: { security: 71 },
    completedAt: 1700000000000
  });
  assert.match(legacy, /^BN1\./);
  assert.equal(decodePairingCode(legacy, { expectedAssessmentId: "emotional-clarity" }).ok, true);
  // A BN1 code must not be accepted by the alignment decoder, and vice versa.
  assert.equal(decodeAlignmentCode(legacy).ok, false);
  assert.equal(decodePairingCode(alignCode).ok, false);
});

check("corrupted alignment codes are rejected", () => {
  const tampered = `${alignCode.slice(0, -1)}${alignCode.endsWith("A") ? "B" : "A"}`;
  const result = decodeAlignmentCode(tampered);
  assert.equal(result.ok, false);
  assert.ok(["checksum", "corrupted", "structure", "aggregates"].includes(result.code));
});

check("oversized payloads are rejected before parsing", () => {
  const oversized = `BNA1.${"A".repeat(alignmentConstants.MAX_CODE_LENGTH + 10)}`;
  const result = decodeAlignmentCode(oversized);
  assert.equal(result.ok, false);
  assert.equal(result.code, "size");
});

check("a code from another module is rejected", () => {
  const result = decodeAlignmentCode(alignCode, { expectedMapId: "money-and-obligations" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "wrong-map");
});

check("a code for an unknown module is rejected", () => {
  const result = decodeAlignmentCode(alignCode, { availableIds: ["nonexistent-map"] });
  assert.equal(result.ok, false);
  assert.equal(result.code, "unknown-map");
});

check("a code from a different content version is rejected, not reinterpreted", () => {
  const result = decodeAlignmentCode(alignCode, { expectedContentVersion: testMap.contentVersion + 1 });
  assert.equal(result.ok, false);
  assert.equal(result.code, "content-mismatch");
});

check("a future-dated code is rejected", () => {
  const future = encodeAlignmentCode({ ...baseRecord, completedAt: Date.now() + 90 * 24 * 60 * 60 * 1000 });
  const result = decodeAlignmentCode(future);
  assert.equal(result.ok, false);
  assert.equal(result.code, "timestamp");
});

check("a self-imported code is detected as the same result", () => {
  const decoded = decodeAlignmentCode(alignCode);
  assert.equal(isSameAlignmentResult(baseRecord, decoded.payload), true);
  assert.equal(isSameAlignmentResult(baseRecord, { ...decoded.payload, completedAt: 1 }), false);
});

check("alignment share links stay in the hash, never a query string", () => {
  const link = alignmentShareLink(testMap.id, alignCode);
  assert.ok(link.includes("#/premarital/align/"));
  assert.ok(link.includes(alignCode));
  assert.ok(!link.includes("?"), "share links must not use a query string");
});

check("the alignment code carries no item-level answer", () => {
  const record = recordFor(testMap, () => 3);
  const code = encodeAlignmentCode({ ...baseRecord, aggregates: buildCategoryAggregates(testMap, record) });
  const decoded = decodeAlignmentCode(code);
  const serialized = JSON.stringify(decoded.payload);
  testMap.items.forEach((item) => {
    assert.ok(!serialized.includes(`"${item.id}"`), `${item.id} must not appear in a share code`);
  });
});

/* ============================================================== knowledge */

const orderedKnowledge = knowledgeItems.find((item) => item.type === "ordered");
const nominalKnowledge = knowledgeItems.find((item) => item.type === "nominal");

check("exact prediction scores 1", () => {
  assert.equal(autoCompare(orderedKnowledge, 2, 2), MARK.accurate);
});
check("adjacent scores 0.5 only on explicitly ordered items", () => {
  assert.equal(autoCompare(orderedKnowledge, 2, 3), MARK.close);
  assert.equal(autoCompare(nominalKnowledge, 2, 3), MARK.different);
});
check("not sure and prefer-not-to-answer are excluded, not wrong", () => {
  assert.equal(autoCompare(orderedKnowledge, "unsure", 2), MARK.ambiguous);
  assert.equal(autoCompare(orderedKnowledge, 2, "private"), MARK.ambiguous);
});

check("both directions score separately and are never combined", () => {
  const items = knowledgeItems.slice(0, 6);
  const bKnowsA = scoreDirection(items, items.map((item, index) => ({
    itemId: item.id, selfAnswer: 1, prediction: 1, confidence: "high", mark: index < 3 ? MARK.accurate : MARK.different
  })));
  const aKnowsB = scoreDirection(items, items.map((item) => ({
    itemId: item.id, selfAnswer: 1, prediction: 1, confidence: "low", mark: MARK.accurate
  })));
  assert.equal(bKnowsA.exact, 3);
  assert.equal(bKnowsA.different, 3);
  assert.equal(bKnowsA.percentage, 50);
  assert.equal(aKnowsB.percentage, 100);
  assert.notEqual(bKnowsA.percentage, aKnowsB.percentage);
});

check("ambiguous and outdated items leave the denominator", () => {
  const items = knowledgeItems.slice(0, 4);
  const result = scoreDirection(items, [
    { itemId: items[0].id, selfAnswer: 0, prediction: 0, mark: MARK.accurate },
    { itemId: items[1].id, selfAnswer: 0, prediction: 1, mark: MARK.ambiguous },
    { itemId: items[2].id, selfAnswer: 0, prediction: 1, mark: MARK.private },
    { itemId: items[3].id, selfAnswer: 0, prediction: 1, mark: MARK.different }
  ]);
  assert.equal(result.eligible, 2, "excluded marks must not count in the denominator");
  assert.equal(result.excluded, 2);
  assert.equal(result.percentage, 50);
});

check("a zero denominator yields null, never a divide-by-zero or a zero score", () => {
  const items = knowledgeItems.slice(0, 3);
  const result = scoreDirection(items, items.map((item) => ({
    itemId: item.id, selfAnswer: "unsure", prediction: "unsure", mark: MARK.ambiguous
  })));
  assert.equal(result.eligible, 0);
  assert.equal(result.percentage, null);
  assert.ok(Number.isFinite(result.excluded));
});

check("category detail is withheld when too few eligible items exist", () => {
  const items = knowledgeItems.filter((item) => item.cat === "routines").slice(0, 2);
  const result = scoreDirection(items, items.map((item) => ({
    itemId: item.id, selfAnswer: 0, prediction: 0, mark: MARK.accurate
  })));
  assert.equal(result.byCategory[0].reportable, false);
  assert.equal(result.byCategory[0].percentage, null);
});

check("confidence is kept for reflection and never turned into a score", () => {
  const items = knowledgeItems.slice(0, 2);
  const result = scoreDirection(items, [
    { itemId: items[0].id, selfAnswer: 0, prediction: 1, confidence: "high", mark: MARK.different },
    { itemId: items[1].id, selfAnswer: 0, prediction: 0, confidence: "low", mark: MARK.accurate }
  ]);
  assert.equal(result.confidentMisses.length, 1);
  assert.ok(!("calibration" in result));
  assert.ok(!("confidenceScore" in result));
});

/* ================================================================ storage */

check("progress is sanitized against the active schema", () => {
  const test = browserData.BAYNANA_DATA.tests[0];
  window.localStorage.setItem(storage.key.progress(test.id), JSON.stringify({
    v: 1,
    testId: test.id,
    nickname: "نور ",
    answers: { [test.questions[0].id]: 2, "not-a-question": 2, [test.questions[1].id]: 99 },
    order: { [test.questions[0].id]: [9, 9, 9] },
    index: 999
  }));
  const progress = storage.getProgress(test);
  assert.equal(progress.nickname, "نور");
  assert.deepEqual(Object.keys(progress.answers), [test.questions[0].id]);
  assert.equal(progress.order[test.questions[0].id], undefined, "invalid option order is dropped");
  assert.equal(progress.index, 0, "an out-of-range index falls back to zero");
});

check("stored data from a different content version is not reinterpreted", () => {
  window.localStorage.setItem(storage.key.alignResult(testMap.id), JSON.stringify({
    v: 1, mapId: testMap.id, contentVersion: 999, answers: { me01: 4 }, importance: {}
  }));
  const stale = storage.getAlignmentResult(testMap);
  assert.equal(stale.stale, true);
  assert.deepEqual(stale.answers, {}, "old answers must not be mapped onto new options");
  window.localStorage.removeItem(storage.key.alignResult(testMap.id));
});

check("alignment answers outside the option range are dropped", () => {
  const record = { v: 1, mapId: testMap.id, contentVersion: testMap.contentVersion, answers: { me01: 9, me02: 3, me03: "private" }, importance: { me01: "bogus", me02: "essential" } };
  window.localStorage.setItem(storage.key.alignProgress(testMap.id), JSON.stringify(record));
  const clean = storage.getAlignmentProgress(testMap);
  assert.equal(clean.answers.me01, undefined);
  assert.equal(clean.answers.me02, 3);
  assert.equal(clean.answers.me03, undefined, "private is only allowed where the item allows it");
  assert.equal(clean.importance.me01, undefined);
  assert.equal(clean.importance.me02, "essential");
  window.localStorage.removeItem(storage.key.alignProgress(testMap.id));
});

check("conversation lists accept only well-formed IDs", () => {
  window.localStorage.setItem(storage.key.conversationFavorites, JSON.stringify(["id01", "<script>", 42, "id01", "ok-2"]));
  assert.deepEqual(storage.getConversationList("favorites"), ["id01", "ok-2"]);
});

check("private mode blocks every persistent write but keeps the app usable", () => {
  storage.deleteAll();
  storage.setPrivateMode(true);
  assert.equal(storage.isPrivateMode(), true);
  const test = browserData.BAYNANA_DATA.tests[0];
  assert.equal(storage.setProgress(test, { nickname: "نور", answers: {}, order: {}, index: 0 }), false);
  assert.equal(storage.getProgress(test), null);
  assert.equal(storage.setConversationList("favorites", ["id01"]), false);
  assert.deepEqual(storage.getConversationList("favorites"), []);
  // Session storage still works: that is the point of private mode.
  storage.writeSession(storage.sessionKey.knowledge, { itemIds: ["kr01"] });
  assert.deepEqual(storage.readSession(storage.sessionKey.knowledge), { itemIds: ["kr01"] });
  storage.setPrivateMode(false);
  assert.equal(storage.isPrivateMode(), false);
  assert.equal(storage.setConversationList("favorites", ["id01"]), true);
});

check("clearing the session removes only namespaced session keys", () => {
  window.sessionStorage.setItem("unrelated-app-key", "keep me");
  storage.writeSession(storage.sessionKey.knowledge, { itemIds: ["kr01"] });
  storage.writeSession(storage.sessionKey.safetyCheck, { sc1: "often" });
  storage.writeSession(storage.sessionKey.alignSlot(testMap.id, "b"), { answers: { me01: 1 } });
  storage.clearSession();
  assert.equal(storage.readSession(storage.sessionKey.knowledge), null);
  assert.equal(storage.readSession(storage.sessionKey.safetyCheck), null);
  assert.equal(storage.readSession(storage.sessionKey.alignSlot(testMap.id, "b")), null);
  assert.equal(window.sessionStorage.getItem("unrelated-app-key"), "keep me");
});

check("deleting all data also purges session state", () => {
  storage.setConversationList("favorites", ["id01"]);
  storage.writeSession(storage.sessionKey.knowledge, { itemIds: ["kr01"] });
  storage.deleteAll();
  assert.deepEqual(storage.getConversationList("favorites"), []);
  assert.equal(storage.readSession(storage.sessionKey.knowledge), null);
});

check("knowledge summaries persist counts only, never item answers", () => {
  storage.addKnowledgeSummary({ savedAt: Date.now(), direction: "أ ← ب", exact: 5, close: 2, different: 3, excluded: 1, selfAnswers: { kr01: 2 } });
  const saved = storage.getKnowledgeSummaries();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].exact, 5);
  assert.ok(!("selfAnswers" in saved[0]), "item-level answers must be stripped on read");
  storage.deleteKnowledgeSummaries();
});

/* ================================================================= safety */

check("the safety guard refuses to release private safety content", () => {
  assert.throws(() => safety.assertNoSafetyContent({ id: safety.SAFETY_CHECK_ID }, "agenda"));
  assert.throws(() => safety.assertNoSafetyContent(JSON.stringify({ answers: { sc1: "often" } }), "export"));
  assert.doesNotThrow(() => safety.assertNoSafetyContent({ id: "align:money-and-obligations:mo01" }, "agenda"));
});

check("the safety self-check stays private and escalates on severity", () => {
  const none = safety.evaluateSafetyCheck({ sc1: "no", sc2: "no" });
  assert.equal(none.level, "none");
  assert.equal(none.private, true);
  const caution = safety.evaluateSafetyCheck({ sc1: "sometimes" });
  assert.equal(caution.level, "caution");
  const high = safety.evaluateSafetyCheck({ sc2: "often" });
  assert.equal(high.level, "high");
  assert.ok(high.message.includes("لن يُشارَك"), "the high message must promise non-disclosure explicitly");
  assert.ok(high.message.includes("لا تبدأ مواجهة"), "must explicitly advise against confrontation");
  assert.ok(high.message.includes("مختص محلي مؤهل"), "must point to qualified local support");
  assert.ok(!/اتصل بالرقم|رقم الطوارئ \d/.test(high.message), "must not invent country-specific numbers");
});

check("skipped safety items never count toward a level", () => {
  const skipped = safety.evaluateSafetyCheck({ sc1: "skip", sc2: "skip", sc3: "skip" });
  assert.equal(skipped.answered, 0);
  assert.equal(skipped.level, "none");
});

check("safety content cannot be encoded into an alignment code", () => {
  const poisoned = { ...baseRecord, aggregates: [...baseRecord.aggregates] };
  poisoned.aggregates[0] = { ...poisoned.aggregates[0], id: safety.SAFETY_CHECK_ID };
  assert.throws(() => encodeAlignmentCode(poisoned), /private safety content/);
  assert.doesNotThrow(() => encodeAlignmentCode(baseRecord));
});

/* ================================================================ routing */

check("every new route parses and survives a refresh", () => {
  const cases = [
    ["#/", "home"],
    ["#/premarital", "premarital"],
    ["#/premarital/agenda", "premarital-agenda"],
    ["#/premarital/align/money-and-obligations", "alignment"],
    ["#/premarital/align/money-and-obligations/answer", "alignment"],
    ["#/premarital/align/money-and-obligations/handoff", "alignment"],
    ["#/premarital/align/money-and-obligations/compare", "alignment"],
    ["#/premarital/align/money-and-obligations/shared", "alignment"],
    ["#/questions", "questions"],
    ["#/questions/category/identity", "questions-category"],
    ["#/questions/deck/light-start", "questions-deck"],
    ["#/questions/session", "questions-session"],
    ["#/questions/favorites", "questions-favorites"],
    ["#/know-me", "know-me"],
    ["#/know-me/setup", "know-me"],
    ["#/know-me/review", "know-me"],
    ["#/safety", "safety"],
    ["#/safety/check", "safety-check"],
    ["#/terms", "terms"],
    ["#/assessment/emotional-clarity/quiz", "assessment"],
    ["#/premarital/align/unknown/nonsense", "not-found"],
    ["#/questions/deck", "not-found"],
    ["#/totally-unknown", "not-found"]
  ];
  cases.forEach(([hash, expected]) => {
    window.location.hash = hash;
    assert.equal(currentRoute().name, expected, `${hash} should route to ${expected}`);
  });
});

check("legacy #/t/:id bookmarks still resolve", () => {
  window.location.hash = "#/t/emotional-clarity/q";
  const route = currentRoute();
  assert.equal(route.name, "assessment");
  assert.equal(route.assessmentId, "emotional-clarity");
  assert.equal(route.subpage, "quiz");
});

check("a partner code is read from the hash path, never a query string", () => {
  window.location.hash = `#/premarital/align/${testMap.id}/partner/${alignCode}`;
  const route = currentRoute();
  assert.equal(route.name, "alignment");
  assert.equal(route.subpage, "partner");
  assert.equal(route.code, alignCode);
  assert.ok(alignmentPath(testMap.id, "result").startsWith("#/"));
  assert.ok(assessmentPath("emotional-clarity", "result").startsWith("#/"));
});

/* ================================================== Arabic search normalization */

check("Arabic normalization folds alef, ya, ta marbuta, tatweel, and harakat", () => {
  const target = normalizeArabic("الأهْل والأصدقــاء والحدودُ الاجتماعية");
  assert.equal(normalizeArabic("الاهل"), "الاهل");
  assert.ok(target.includes(normalizeArabic("الأهل")));
  assert.ok(target.includes(normalizeArabic("الاصدقاء")));
  assert.equal(normalizeArabic("مسؤوليه"), normalizeArabic("مسؤولية"));
  assert.equal(normalizeArabic("علي"), normalizeArabic("على"));
  assert.equal(normalizeArabic("١٢٣"), "123");
});

check("normalization never mutates the displayed source text", () => {
  const source = "الأهل والأصدقاء";
  const copy = normalizeArabic(source);
  assert.notEqual(copy, source);
  assert.equal(source, "الأهل والأصدقاء", "the original string is untouched");
});

check("search matches a query typed without diacritics or hamza", () => {
  const question = browserData.BAYNANA_CONVERSATION_QUESTIONS.questions.find((entry) => entry.id === "fm01");
  const index = normalizeArabic(question.prompt);
  assert.ok(index.includes(normalizeArabic("العائليه")) || index.includes(normalizeArabic("العائلية")));
});

console.log(`\nEngine tests passed: ${checks} checks.`);
