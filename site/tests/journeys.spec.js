import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const base = "http://127.0.0.1:4173/baynana/";
const review = path.resolve("../.impeccable/review");
const view = page => page.locator("#app");
async function visit(page, hash) { await page.goto(`${base}${hash}`); await expect(view(page).locator("h1")).toHaveCount(1); }
async function beginAssessment(page, id = "emotional-clarity", name = "تجربة") {
  await visit(page, `#/assessment/${id}`);
  if (await page.getByRole("button", { name: "متابعة باختياري" }).count()) {
    await view(page).getByRole("checkbox").check();
    await page.getByRole("button", { name: "متابعة باختياري" }).click();
  }
  await view(page).locator('input[type="text"]').fill(name);
  await view(page).getByRole("checkbox").check();
  await view(page).getByRole("button", { name: "ابدأ الاختبار", exact: true }).click();
  await expect(page.getByRole("radiogroup")).toBeVisible();
}
async function finishAssessment(page) {
  for (let i = 0; i < 18; i++) {
    await page.getByRole("radio").nth(i % 3).click();
    await page.getByRole("button", { name: i === 17 ? "اعرض نتيجتي" : "التالي", exact: true }).click();
  }
  await expect(view(page).locator(".code-box")).toHaveCount(1);
}
async function beginAlignment(page) {
  await visit(page, "#/premarital/align/marriage-expectations");
  await view(page).locator('input[type="text"]').fill("تجربة أولى");
  await view(page).getByRole("checkbox").check();
  await page.getByRole("button", { name: "ابدأ الخريطة", exact: true }).click();
}
async function answerAlignment(page, option = 2) {
  for (let i = 0; i < 18; i++) {
    await page.getByRole("radio").nth(option).click();
    await page.getByRole("button", { name: i === 17 ? "أنهِ الخريطة" : "التالي", exact: true }).click();
  }
}

test.beforeEach(async ({ page }) => {
  await mkdir(review, { recursive: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.__errors = errors;
});
test.afterEach(async ({ page }) => { expect(page.__errors, "browser errors").toEqual([]); });

test("A: assessment supports keyboard choice, edits, notes, refresh, completion and restart", async ({ page }) => {
  await beginAssessment(page);
  await expect(page.getByRole("button", { name: "التالي", exact: true })).toBeDisabled();
  await page.keyboard.press("1");
  await expect(page.getByRole("radio").first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio").nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(view(page)).toContainText("السؤال 2 من 18");
  await expect(view(page).locator("h1")).toBeFocused();
  await page.keyboard.press("Backspace");
  await expect(view(page)).toContainText("السؤال 1 من 18");
  await page.getByText("أضف ملاحظة حرة (اختياري)", { exact: true }).click();
  await page.getByRole("textbox", { name: "ملاحظة حرة" }).fill("SYNTHETIC-PRIVATE-NOTE");
  await page.reload();
  await page.locator(".note-toggle summary").click();
  await expect(page.getByRole("textbox", { name: "ملاحظة حرة" })).toHaveValue("SYNTHETIC-PRIVATE-NOTE");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "السابق", exact: true }).click();
  await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");
  await finishAssessment(page);
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.includes(":notes:")))).toEqual([]);
  const code = await view(page).locator(".code-box").innerText();
  const payload = JSON.parse(Buffer.from(code.slice(4), "base64url").toString());
  expect(payload[3]).toHaveLength(6);
  expect(payload[4]).toEqual({});
  expect(JSON.stringify(payload)).not.toContain("SYNTHETIC");
  await expect(page.locator(".score-orbit, .similarity-value")).toHaveCount(0);
  await view(page).getByRole("button", { name: "إعادة الاختبار", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "تراجع", exact: true })).toBeFocused();
  await page.getByRole("dialog").getByRole("button", { name: "احذف وابدأ من جديد" }).click();
  await expect(view(page).getByRole("button", { name: "ابدأ الاختبار", exact: true })).toBeVisible();
});

test("B: sensitive deep links gate access; Escape repeats and dialogs preserve double-press exit", async ({ page }) => {
  // Intercept the neutral destination so this synthetic test never leaves localhost.
  await page.route("https://www.wikipedia.org/**", route => route.fulfill({ contentType: "text/html", body: "<html><head><title>Neutral</title></head><body>Neutral destination</body></html>" }));
  await visit(page, "#/assessment/romantic-jealousy/quiz");
  await expect(page.getByRole("heading", { name: "قبل الدخول إلى محتوى حساس" })).toBeVisible();
  expect(page.url()).toMatch(/assessment\/a\d+\/quiz$/);
  await expect(page).toHaveTitle("مساحة خاصة — بيننا");
  await page.keyboard.press("Escape");
  expect(page.url()).toContain("127.0.0.1");
  await beginAssessment(page, "romantic-jealousy");
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "حذف التقدّم", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("https://www.wikipedia.org/");
  await visit(page, "#/assessment/romantic-jealousy/quiz");
  await expect(page.getByRole("heading", { name: "قبل الدخول إلى محتوى حساس" })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith("baynana:v1:session:")))).toEqual([]);
});

test("C/D: partner result imports, self import and malformed input fail, shared view has no overall score", async ({ page }) => {
  await beginAssessment(page);
  await finishAssessment(page);
  const ownCode = await page.locator(".code-box").innerText();
  await visit(page, "#/assessment/emotional-clarity/partner");
  const input = page.getByRole("textbox", { name: "رمز نتيجة شريكك" });
  for (const code of ["broken", ownCode, ownCode.slice(0, -8)]) {
    await input.fill(code);
    await page.getByRole("button", { name: "أنشئ المقارنة" }).click();
    await expect(input).toHaveAttribute("aria-invalid", "true");
  }
  const peer = await page.evaluate(async () => {
    const { encodePairingCode } = await import("./assets/js/pairing.js");
    return encodePairingCode({ assessmentId: "emotional-clarity", nickname: "تجربة ثانية", dimensions: [0, 17, 33, 50, 67, 100], completedAt: 1700000000000 });
  });
  await input.fill(peer);
  await page.getByRole("button", { name: "أنشئ المقارنة" }).click();
  await expect(view(page).getByRole("heading", { level: 1 })).toHaveText("قراءتان، وحوار بينكما");
  await expect(page.locator(".comparison-row")).toHaveCount(6);
  await expect(page.locator(".similarity-value, .score-orbit")).toHaveCount(0);
  await page.screenshot({ path: path.join(review, "comparison-desktop.png"), fullPage: true });
});

test("E: same-device comparison is session-only; fresh contexts and ended sessions cannot recover it", async ({ page, browser }) => {
  await beginAlignment(page);
  await answerAlignment(page);
  const persistent = await page.evaluate(() => JSON.stringify(localStorage));
  await page.getByRole("button", { name: "ابدآ المقارنة على هذا الجهاز" }).click();
  await expect(page.locator(".option-button")).toHaveCount(0);
  await page.getByRole("button", { name: "أنا الطرف الثاني — ابدأ" }).click();
  await answerAlignment(page, 0);
  await expect(view(page)).toContainText("مقارنة على هذا الجهاز");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(persistent);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(review, "alignment-mobile.png"), fullPage: true });
  await expect(page.locator(".alignment-items").first()).toBeVisible();
  await expect(page.locator(".alignment-items .alignment-item")).toHaveCount(18);
  expect(await page.locator(".alignment-items").first().evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  const context = await browser.newContext();
  const fresh = await context.newPage();
  await visit(fresh, "#/premarital/align/marriage-expectations/compare");
  await expect(view(fresh)).toContainText("انتهت جلسة المقارنة");
  await context.close();
  await page.getByRole("button", { name: "أنهِ الجلسة وامسح إجابات المقارنة" }).click();
  await visit(page, "#/premarital/align/marriage-expectations/compare");
  await expect(view(page)).toContainText("انتهت جلسة المقارنة");
});

for (const privateMode of [false, true]) {
  test(`alignment share link survives answering and refresh (private mode: ${privateMode})`, async ({ page }) => {
    await visit(page, "#/privacy");
    if (privateMode) await page.getByRole("button", { name: "فعّل الوضع الخاص" }).click();
    const peer = await page.evaluate(async () => {
      const { buildCategoryAggregates, encodeAlignmentCode } = await import("./assets/js/alignment.js");
      const map = window.BAYNANA_ALIGNMENT.maps.find(map => map.id === "marriage-expectations");
      return encodeAlignmentCode({
        mapId: map.id, nickname: "تجربة ثانية", contentVersion: map.contentVersion,
        aggregates: buildCategoryAggregates(map, { answers: Object.fromEntries(map.items.map(item => [item.id, 0])) }),
        completedAt: 1700000000000
      });
    });
    await visit(page, `#/premarital/align/marriage-expectations/partner/${peer}`);
    await expect(page).toHaveURL(/marriage-expectations\/partner$/);
    await page.reload();
    await expect(view(page)).toContainText("تجربة ثانية");
    await view(page).getByRole("link", { name: "ابدأ بإجابتي" }).click();
    await view(page).locator('input[type="text"]').fill("تجربة أولى");
    await view(page).getByRole("checkbox").check();
    await page.getByRole("button", { name: "ابدأ الخريطة", exact: true }).click();
    await answerAlignment(page);
    await page.getByRole("link", { name: "ألصق رمز الطرف الآخر", exact: true }).click();
    await expect(view(page)).toContainText("رمز تجربة ثانية محفوظ");
    await expect(page.getByRole("textbox", { name: "رمز خريطة الطرف الآخر" })).toHaveValue(peer);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.includes(":pending:align:")))).toEqual([]);
    if (privateMode) expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(["baynana:v1:private-mode"]);
    await page.getByRole("link", { name: "اعرض المقارنة", exact: true }).click();
    await expect(page).toHaveURL(/marriage-expectations\/shared$/);
    await expect(view(page)).toContainText("تجربة ثانية");
  });
}

test("F: conversation filters, empty state and private notes stay local", async ({ page }) => {
  await visit(page, "#/questions");
  const search = view(page).getByRole("searchbox");
  await search.fill("ZZZ-NO-SUCH-QUESTION");
  await expect(page.locator(".question-card")).toHaveCount(0);
  await search.fill("الاهل");
  await expect(page.locator(".question-card").first()).toBeVisible();
  await visit(page, "#/questions/deck/weekly");
  await page.getByRole("button", { name: /ابدآ جلسة/ }).click();
  await page.getByRole("textbox", { name: "إجابتك على هذا السؤال" }).fill("SYNTHETIC-CONVERSATION-NOTE");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await page.getByRole("button", { name: "مرّر بدون إجابة" }).click();
  await page.getByRole("button", { name: "أنهِ الجلسة", exact: true }).click();
  await page.getByText("مراجعة ملاحظاتي على هذا الجهاز").click();
  await expect(view(page)).toContainText("SYNTHETIC-CONVERSATION-NOTE");
  await expect(view(page).locator("textarea, .code-box")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain("SYNTHETIC-CONVERSATION");
  await page.reload();
  await expect(view(page)).not.toContainText("SYNTHETIC-CONVERSATION-NOTE");
});

test("G: partner knowledge completes both directions with clean handoffs", async ({ page }) => {
  await visit(page, "#/know-me/setup");
  await view(page).getByRole("checkbox").last().check();
  await view(page).getByRole("button", { name: /ابد/ }).click();
  for (let phase = 0; phase < 11; phase++) {
    if (phase === 1 || phase === 3 || phase === 5 || phase === 7 || phase === 9) {
      await expect(page.locator(".option-button")).toHaveCount(0);
      await view(page).getByRole("button", { name: /— متابعة/ }).click();
    } else if (phase === 4 || phase === 10) {
      await view(page).getByRole("button", { name: "تابع", exact: true }).click();
    } else {
      for (let i = 0; i < 12; i++) {
        await page.getByRole("radio").first().click();
        await page.getByRole("button", { name: i === 11 ? "انتهيت" : "التالي", exact: true }).click();
      }
    }
  }
  await expect(page).toHaveURL(/know-me\/result$/);
  await expect(view(page)).toContainText("اتجاهان منفصلان");
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.includes("knowledge")))).toEqual([]);
});

test("H: subdirectory deep links, refresh, back/forward and malformed routes", async ({ page }) => {
  await visit(page, "#/questions/category/identity");
  await page.reload();
  await expect(view(page)).toContainText("الهوية وصورة الذات");
  await page.locator(".brand").first().click();
  await expect(view(page).locator("h1")).toBeFocused();
  await page.goBack();
  await expect(view(page)).toContainText("الهوية وصورة الذات");
  await page.goForward();
  await expect(view(page).locator(".home-opening")).toBeVisible();
  await visit(page, "#/questions/category/identity/unknown");
  await expect(view(page)).toContainText("الصفحة غير موجودة");
});

test("private mode and corrupt session state degrade without losing the active flow", async ({ page }) => {
  await visit(page, "#/privacy");
  await page.getByRole("button", { name: "فعّل الوضع الخاص" }).click();
  await beginAssessment(page);
  await finishAssessment(page);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(["baynana:v1:private-mode"]);
  await page.reload();
  await expect(view(page).getByRole("button", { name: "ابدأ الاختبار", exact: true })).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem("baynana:v1:session:knowledge", JSON.stringify({ itemIds: ["unknown"], phaseIndex: -1 })));
  await visit(page, "#/know-me/play");
  await expect(view(page)).toContainText("لا توجد جلسة مفتوحة");
});

test("responsive layouts, Arabic direction, static network privacy and axe accessibility", async ({ page }) => {
  test.setTimeout(240000);
  await mkdir(review, { recursive: true });
  const requests = [];
  page.on("request", request => requests.push({ url: request.url(), method: request.method() }));
  for (const width of [320, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["#/", "#/assessments", "#/premarital", "#/questions", "#/know-me/setup", "#/privacy"]) {
      await visit(page, route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${route} overflows`).toBe(true);
      await expect(view(page).locator("h1")).toHaveCount(1);
      if (route === "#/" && [390, 1440].includes(width)) await page.screenshot({ path: path.join(review, width === 390 ? "mobile.png" : "desktop.png"), fullPage: true });
    }
  }
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const route of ["#/", "#/assessments", "#/premarital", "#/questions", "#/know-me/setup", "#/privacy", "#/safety/check"]) {
      await visit(page, route);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), `${theme}: ${route}`).toEqual([]);
    }
  }
  expect(requests.filter(request => !request.url.startsWith(base) || request.method !== "GET")).toEqual([]);
});
