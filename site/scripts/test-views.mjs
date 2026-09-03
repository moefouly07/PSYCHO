/*
 * Route-level smoke tests.
 *
 * Every route is rendered through the real view modules against a minimal DOM
 * shim. This catches wiring errors, missing exports, bad selectors, and
 * uncaught exceptions that unit tests on pure functions cannot see. Any
 * console.error during a render fails the run.
 */
import assert from "node:assert/strict";
import { installDom } from "./lib/dom-shim.mjs";
import { loadBrowserData } from "./lib/load-data.mjs";

const { window, document, app } = installDom({ hash: "#/" });

/* Load the data bundle into the same window the app will read. */
const browserData = loadBrowserData([]);
Object.entries(browserData).forEach(([key, value]) => { window[key] = value; });

const consoleErrors = [];
const originalError = console.error;
console.error = (...args) => { consoleErrors.push(args.join(" ")); };

await import("../assets/js/app.js");

const { storage } = await import("../assets/js/storage.js");
const { encodeAlignmentCode, buildCategoryAggregates } = await import("../assets/js/alignment.js");

let checks = 0;
function check(name, fn) {
  const before = consoleErrors.length;
  fn();
  const raised = consoleErrors.slice(before);
  assert.equal(raised.length, 0, `console.error during "${name}": ${raised.join(" | ")}`);
  checks += 1;
  console.log(`  ok  ${name}`);
}

/* Confirm dialogs resolve through a promise; flush the microtask queue. */
async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

async function checkAsync(name, fn) {
  const before = consoleErrors.length;
  await fn();
  const raised = consoleErrors.slice(before);
  assert.equal(raised.length, 0, `console.error during "${name}": ${raised.join(" | ")}`);
  checks += 1;
  console.log(`  ok  ${name}`);
}

function visit(hash) {
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    // The shim dispatches hashchange on assignment, exactly like a browser.
    window.location.hash = hash;
  }
  return app;
}

function textOf(node) {
  return node.textContent.replace(/\s+/g, " ").trim();
}

function assertRendered(hash, mustContain) {
  const view = visit(hash);
  assert.ok(view.children.length > 0, `${hash} rendered nothing`);
  const text = textOf(view);
  assert.ok(text.length > 40, `${hash} rendered almost no text`);
  if (mustContain) assert.ok(text.includes(mustContain), `${hash} is missing expected copy: ${mustContain}`);
  assert.ok(!text.includes("undefined"), `${hash} leaked the string "undefined" into the page`);
  assert.ok(!text.includes("[object Object]"), `${hash} leaked "[object Object]" into the page`);
  return view;
}

/* ------------------------------------------------------------ shell routes */

check("home renders", () => assertRendered("#/"));
check("assessment library renders", () => assertRendered("#/assessments"));
check("how it works renders", () => assertRendered("#/how"));
check("privacy renders with the accurate hosting disclosure", () =>
  assertRendered("#/privacy", "تتلقى جهة الاستضافة"));
check("science renders the four-kinds explainer", () =>
  assertRendered("#/science", "مقياس نفسي مُقنَّن"));
check("faq renders", () => assertRendered("#/faq"));
check("terms renders the never-claims list", () =>
  assertRendered("#/terms", "ولا يتنبأ بنجاح الزواج"));
check("safety page renders without inventing hotline numbers", () => {
  const view = assertRendered("#/safety", "خدمات الطوارئ المحلية");
  assert.ok(!/\b(999|911|112|1919)\b/.test(textOf(view)), "must not invent country-specific numbers");
});
check("private safety check renders and promises non-disclosure", () =>
  assertRendered("#/safety/check", "لا تُشارَك"));
check("not-found renders a useful state", () => assertRendered("#/no-such-page", "الصفحة غير موجودة"));

/* --------------------------------------------------------- premarital journey */

check("premarital journey renders all fourteen domains", () => {
  const view = assertRendered("#/premarital", "الرحلة قبل الزواج");
  const text = textOf(view);
  window.BAYNANA_PREMARITAL.domains.forEach((domain) => {
    assert.ok(text.includes(domain.canonical.title), `missing domain module: ${domain.canonical.title}`);
  });
  /* No percentage figure of any kind may appear on the journey overview. */
  assert.ok(!/\d+\s*٪/.test(text), "the journey must not present any percentage");
  assert.ok(text.includes("لا تحسب هذه الرحلة درجة توافق"), "the no-score disclaimer must be visible");
});

check("journey filters switch the visible set", () => {
  const view = visit("#/premarital");
  const chips = view.querySelectorAll(".chip");
  assert.ok(chips.length >= 6, "expected a filter chip per journey filter");
  const skillChip = chips.find((chip) => chip.textContent.includes("مهارات سلوكية"));
  skillChip.click();
  assert.equal(skillChip.getAttribute("aria-pressed"), "true");
  const privateChip = chips.find((chip) => chip.textContent.includes("خاص بك وحدك"));
  privateChip.click();
  assert.ok(textOf(view).includes("مراجعة خاصة للسلامة"));
});

check("empty agenda renders an empty state", () => assertRendered("#/premarital/agenda", "الأجندة فارغة"));

/* --------------------------------------------------------- alignment flow */

const map = window.BAYNANA_ALIGNMENT.maps[0];

check("alignment intro renders", () => assertRendered(`#/premarital/align/${map.id}`, map.title));

check("alignment answering flow completes and stores a result", () => {
  storage.setAlignmentProgress(map, {
    nickname: "نور", answers: {}, importance: {}, index: 0,
    contentVersion: map.contentVersion, startedAt: Date.now()
  });
  const view = visit(`#/premarital/align/${map.id}/answer`);
  for (let step = 0; step < map.items.length; step += 1) {
    const options = app.querySelectorAll(".option-button");
    assert.ok(options.length >= 5, `item ${step + 1} should offer the neutral scale plus skip answers`);
    options[0].click();
    const next = app.querySelectorAll("button")
      .find((button) => /^(التالي|أنهِ الخريطة)$/.test(button.textContent.trim()));
    assert.ok(next, `no advance control on item ${step + 1}`);
    next.click();
  }
  const result = storage.getAlignmentResult(map);
  assert.ok(result && result.completedAt, "completing the map must store a result");
  assert.equal(Object.keys(result.answers).length, map.items.length);
  assert.ok(view);
});

check("alignment result renders a share code but never an item answer", () => {
  const view = assertRendered(`#/premarital/align/${map.id}/result`, "BNA1.");
  const text = textOf(view);
  map.items.forEach((item) => {
    assert.ok(!text.includes(`"${item.id}"`), "item IDs must not leak into the result page code box");
  });
  assert.ok(!/نسبة توافق/.test(text), "no compatibility percentage on an alignment result");
});

check("handoff screen shows no answer from the first partner", () => {
  const view = assertRendered(`#/premarital/align/${map.id}/handoff`, "سلّما الجهاز");
  const text = textOf(view);
  const firstOption = map.items[0].options[0].t;
  assert.ok(!text.includes(firstOption), "the handoff screen must not render a previous answer");
});

check("same-device comparison classifies without a score", () => {
  const answers = {};
  const importance = {};
  map.items.forEach((item, index) => {
    answers[item.id] = index % 5;
    importance[item.id] = index === 0 ? "essential" : "flexible";
  });
  storage.writeSession(storage.sessionKey.alignSlot(map.id, "a"), { nickname: "نور", answers, importance });
  const peerAnswers = {};
  map.items.forEach((item, index) => { peerAnswers[item.id] = (index + 3) % 5; });
  storage.writeSession(storage.sessionKey.alignSlot(map.id, "b"), { nickname: "سلمى", answers: peerAnswers, importance: {} });

  const view = assertRendered(`#/premarital/align/${map.id}/compare`, "بداية مشتركة");
  const text = textOf(view);
  assert.ok(!/\d+\s*٪/.test(text), "the detailed comparison must not present any percentage");
  assert.ok(text.includes("أولوية للحوار") || text.includes("أولويات الحوار"));
});

check("expired comparison session shows a clear state instead of failing", () => {
  storage.removeSession(storage.sessionKey.alignSlot(map.id, "b"));
  assertRendered(`#/premarital/align/${map.id}/compare`, "انتهت جلسة المقارنة");
});

check("two-device comparison accepts a valid partner code", () => {
  const own = storage.getAlignmentResult(map);
  const peerRecord = { answers: {}, importance: {} };
  map.items.forEach((item, index) => { peerRecord.answers[item.id] = (index + 2) % 5; });
  const peerCode = encodeAlignmentCode({
    mapId: map.id,
    nickname: "سلمى",
    contentVersion: map.contentVersion,
    aggregates: buildCategoryAggregates(map, peerRecord),
    completedAt: own.completedAt - 60000
  });
  assertRendered(`#/premarital/align/${map.id}/partner/${peerCode}`, "المقارنة على جهازين");
  const shared = assertRendered(`#/premarital/align/${map.id}/shared`, "على مستوى المجالات");
  assert.ok(!/\d+\s*٪/.test(textOf(shared)), "the remote comparison must not present any percentage");
  assert.ok(textOf(shared).includes("لا توجد نسبة توافق"), "the no-score statement must be explicit");
});

check("an invalid share link shows an error, not a crash", () => {
  const view = assertRendered(`#/premarital/align/${map.id}/partner/BNA1.not-a-real-code`, "");
  assert.ok(/تعذّر قراءة الرمز|لم يُقبل الرمز|فشل التحقق|بنية رمز/.test(textOf(view)),
    "an invalid code must produce an explicit error message");
});

/* ------------------------------------------------------ conversation library */

check("conversation library renders decks and questions", () => {
  const view = assertRendered("#/questions", "أسئلة بيننا");
  assert.ok(view.querySelectorAll(".deck-card").length === 10, "expected ten curated decks");
  assert.ok(view.querySelectorAll(".question-card").length > 0);
});

check("conversation search filters by normalized Arabic", () => {
  const view = visit("#/questions");
  const search = view.querySelector("input[type=search]");
  search.value = "الاهل";
  search.dispatchEvent({ type: "input" });
  const status = view.querySelectorAll(".fine-print").find((node) => node.textContent.includes("يظهر"));
  assert.ok(status, "the result count should be announced");
});

check("category and deck pages render", () => {
  assertRendered("#/questions/category/identity", "الهوية وصورة الذات");
  assertRendered("#/questions/deck/premarital-basics", "قبل الزواج: الأساسيات");
  assertRendered("#/questions/deck/affection", "للبالغين");
});

check("unknown category and deck fall back to not-found", () => {
  assertRendered("#/questions/category/nope", "الصفحة غير موجودة");
  assertRendered("#/questions/deck/nope", "الصفحة غير موجودة");
});

check("a conversation session starts, passes, and ends calmly", () => {
  const deckPage = visit("#/questions/deck/weekly");
  const start = deckPage.querySelectorAll("button").find((button) => button.textContent.includes("ابدآ جلسة"));
  start.click();
  const session = visit("#/questions/session");
  assert.ok(textOf(session).includes("يبدأ الإجابة"), "the first speaker must alternate and be named");
  const pass = session.querySelectorAll("button").find((button) => button.textContent.includes("مرّر بدون إجابة"));
  pass.click();
  const end = app.querySelectorAll("button").find((button) => button.textContent.includes("أنهِ الجلسة"));
  end.click();
  assert.ok(textOf(app).includes("لم يُسجَّل شيء"), "the end screen must state that nothing was recorded");
});

check("favorites page renders and stores IDs only", () => {
  storage.setConversationList("favorites", ["id01", "lv01"]);
  const view = assertRendered("#/questions/favorites", "أرقام أسئلة فقط");
  assert.ok(textOf(view).includes("المفضلة (2)"));
});

/* ------------------------------------------------------- knowledge challenge */

check("knowledge intro states what it does not measure", () =>
  assertRendered("#/know-me", "لا يقيس الحب"));

check("knowledge setup renders category and length choices", () => {
  const view = assertRendered("#/know-me/setup", "طول الجلسة");
  assert.ok(view.querySelectorAll("input[type=checkbox]").length >= 13);
});

check("a short knowledge session runs end to end and keeps directions separate", () => {
  const setup = visit("#/know-me/setup");
  setup.querySelectorAll("input[type=checkbox]").forEach((box) => { box.checked = true; });
  const form = setup.querySelector("form");
  form.dispatchEvent({ type: "submit", preventDefault() {} });

  const guard = 400;
  let steps = 0;
  while (window.location.hash !== "#/know-me/result" && steps < guard) {
    steps += 1;
    const buttons = app.querySelectorAll("button");
    const option = app.querySelectorAll(".option-button")[0];
    const advance = buttons.find((button) => /^(التالي|انتهيت)$/.test(button.textContent.trim()))
      || buttons.find((button) => button.textContent.includes("متابعة"))
      || buttons.find((button) => button.textContent.trim() === "تابع");
    if (option && advance && advance.disabled) option.click();
    const refreshed = app.querySelectorAll("button")
      .find((button) => /^(التالي|انتهيت)$/.test(button.textContent.trim()))
      || app.querySelectorAll("button").find((button) => button.textContent.includes("متابعة"))
      || app.querySelectorAll("button").find((button) => button.textContent.trim() === "تابع");
    assert.ok(refreshed, `no advance control at step ${steps} (${window.location.hash})`);
    refreshed.click();
  }
  assert.ok(steps < guard, "the knowledge session did not reach the result view");

  const view = app;
  const text = textOf(view);
  assert.ok(text.includes("ما عرفته بدقة"), "required result language: ما عرفته بدقة");
  assert.ok(text.includes("إجابات كانت قريبة"), "required result language: إجابات كانت قريبة");
  assert.ok(text.includes("أشياء تستحق سؤالًا"), "required result language: أشياء تستحق سؤالًا");
  assert.ok(text.includes("أمور لم نتكلم عنها بعد"), "required result language: أمور لم نتكلم عنها بعد");
  assert.ok(text.includes("لا يقيس الحب"), "the required disclaimer must appear on the result");
  assert.ok(!/الفائز|فاز|أفضل معرفة/.test(text), "the result must not declare a winner");
});

check("item-level knowledge answers never reach localStorage", () => {
  const namespace = storage.namespace;
  const dump = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(namespace)) dump.push(`${key}=${window.localStorage.getItem(key)}`);
  }
  const serialized = dump.join("\n");
  window.BAYNANA_KNOWLEDGE_ITEMS.items.forEach((item) => {
    assert.ok(!serialized.includes(`"${item.id}"`), `${item.id} must never be written to localStorage`);
  });
});

check("clearing the knowledge session leaves no way back into the answers", () => {
  storage.clearSession();
  const view = visit("#/know-me/handoff");
  const text = textOf(view);
  assert.ok(text.includes("لا توجد جلسة مفتوحة"), "a cleared session must not resume");
  assert.equal(storage.readSession(storage.sessionKey.knowledge), null);
  const review = visit("#/know-me/review");
  assert.ok(textOf(review).includes("لا توجد جلسة مفتوحة"));
});

/* ------------------------------------------------ existing assessment flow */

check("an existing assessment still completes and pairs", () => {
  const test = window.BAYNANA_DATA.tests.find((entry) => entry.id === "emotional-clarity");
  storage.setProgress(test, { nickname: "نور", answers: {}, order: {}, index: 0, startedAt: Date.now() });
  visit("#/assessment/emotional-clarity/quiz");
  for (let step = 0; step < test.questions.length; step += 1) {
    const options = app.querySelectorAll(".option-button");
    assert.equal(options.length, 3, `question ${step + 1} must offer three choices`);
    options[0].click();
    const next = app.querySelectorAll("button").find((button) => /التالي|اعرض نتيجتي/.test(button.textContent));
    next.click();
  }
  const result = storage.getResult(test);
  assert.ok(result, "completing an assessment must store a result");
  const view = assertRendered("#/assessment/emotional-clarity/result", "BN1.");
  assert.ok(textOf(view).includes("الأبعاد الستة"));
});

check("legacy bookmarks still resolve to the new views", () =>
  assertRendered("#/t/emotional-clarity", "اختبار وضوح المشاعر"));

/* ------------------------------------------------------ privacy and cleanup */

check("private mode can be turned on from the privacy page", () => {
  const view = visit("#/privacy");
  const toggle = view.querySelectorAll("button").find((button) => button.textContent.includes("فعّل الوضع الخاص"));
  assert.ok(toggle, "the private-mode control must be present");
  toggle.click();
  assert.equal(storage.isPrivateMode(), true);
  storage.setPrivateMode(false);
});

await checkAsync("delete-all clears every Baynana key", async () => {
  storage.setConversationList("favorites", ["id01"]);
  visit("#/privacy");
  const button = app.querySelectorAll("button").find((entry) => entry.textContent.includes("حذف كل البيانات المحلية"));
  button.click();
  await flush();
  const remaining = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith(storage.namespace)) remaining.push(key);
  }
  assert.deepEqual(remaining, [], `keys left behind: ${remaining.join(", ")}`);
});

/* ------------------------------------------------------- accessibility audit */

const AUDIT_ROUTES = [
  "#/", "#/assessments", "#/how", "#/privacy", "#/science", "#/faq", "#/terms",
  "#/safety", "#/safety/check", "#/premarital", "#/premarital/agenda",
  `#/premarital/align/${map.id}`, `#/premarital/align/${map.id}/result`,
  "#/questions", "#/questions/category/identity", "#/questions/deck/light-start",
  "#/questions/favorites", "#/know-me", "#/know-me/setup",
  "#/assessment/emotional-clarity", "#/no-such-page"
];

check("every view has exactly one H1", () => {
  AUDIT_ROUTES.forEach((hash) => {
    const view = visit(hash);
    const headings = view.querySelectorAll("h1");
    assert.equal(headings.length, 1, `${hash} has ${headings.length} H1 elements`);
    assert.ok(textOf(headings[0]).length > 2, `${hash} has an empty H1`);
  });
});

check("every form control has an accessible name", () => {
  AUDIT_ROUTES.forEach((hash) => {
    const view = visit(hash);
    view.querySelectorAll("input, textarea, select").forEach((control) => {
      const labelled = control.getAttribute("aria-label")
        || control.getAttribute("aria-labelledby")
        || control.closest("label");
      assert.ok(labelled, `${hash}: a form control has no accessible name`);
    });
  });
});

check("every button and link has a discernible label", () => {
  AUDIT_ROUTES.forEach((hash) => {
    const view = visit(hash);
    view.querySelectorAll("button, a").forEach((node) => {
      const name = textOf(node) || node.getAttribute("aria-label") || "";
      assert.ok(name.trim().length > 0, `${hash}: a ${node.tagName} has no discernible label`);
    });
  });
});

check("progress and meter widgets carry complete ARIA state", () => {
  const test = window.BAYNANA_DATA.tests.find((entry) => entry.id === "conflict-style");
  storage.setProgress(test, { nickname: "نور", answers: {}, order: {}, index: 0, startedAt: Date.now() });
  const view = visit("#/assessment/conflict-style/quiz");
  view.querySelectorAll("[role=progressbar]").forEach((node) => {
    ["aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-label"].forEach((attr) => {
      assert.ok(node.getAttribute(attr) !== null, `progressbar missing ${attr}`);
    });
  });
  const radios = view.querySelectorAll("[role=radio]");
  assert.ok(radios.length === 3, "quiz options must be exposed as a radio group");
  radios.forEach((radio) => assert.ok(radio.getAttribute("aria-checked") !== null));
  assert.ok(view.querySelector("[role=radiogroup]").getAttribute("aria-labelledby"),
    "the radio group must be labelled by the question prompt");
  storage.restartAssessment("conflict-style");
});

check("data tables carry a caption and scoped headers", () => {
  /* Re-seed a completed map: the delete-all test above cleared storage. */
  const answers = {};
  const importance = {};
  map.items.forEach((item, index) => { answers[item.id] = index % 5; importance[item.id] = "flexible"; });
  storage.setAlignmentResult(map, {
    nickname: "نور", answers, importance, index: 0,
    contentVersion: map.contentVersion, startedAt: Date.now()
  });
  const view = visit(`#/premarital/align/${map.id}/result`);
  const tables = view.querySelectorAll("table");
  assert.ok(tables.length > 0, "the alignment result should include a text table");
  tables.forEach((table) => {
    assert.ok(table.querySelector("caption"), "table without a caption");
    table.querySelectorAll("th").forEach((header) => {
      assert.ok(header.getAttribute("scope"), "table header without scope");
    });
  });
});

check("status regions are announced politely, not assertively", () => {
  AUDIT_ROUTES.forEach((hash) => {
    const view = visit(hash);
    view.querySelectorAll("[aria-live]").forEach((node) => {
      assert.equal(node.getAttribute("aria-live"), "polite", `${hash}: aria-live must be polite`);
    });
  });
});

check("toggle controls expose pressed state", () => {
  const view = visit("#/premarital");
  const chips = view.querySelectorAll(".chip");
  chips.forEach((chip) => assert.ok(chip.getAttribute("aria-pressed") !== null, "chip missing aria-pressed"));
  assert.equal(chips.filter((chip) => chip.getAttribute("aria-pressed") === "true").length, 1,
    "exactly one filter is active at a time");
});

check("the quick-exit control appears on sensitive views only", () => {
  visit("#/premarital");
  assert.equal(app.querySelectorAll(".quick-exit-bar").length, 0, "not shown on a neutral view");
  visit("#/safety/check");
  const bars = app.querySelectorAll(".quick-exit-bar");
  assert.equal(bars.length, 1, "shown on the private safety view");
  const button = bars[0].querySelector("button");
  assert.ok(button.getAttribute("aria-label").includes("خروج سريع"));
});

check("no route left an uncaught console error", () => {
  assert.deepEqual(consoleErrors, []);
});

console.error = originalError;
console.log(`\nView smoke tests passed: ${checks} checks, 0 console errors.`);
