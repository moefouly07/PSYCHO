/*
 * Link and navigation tests.
 *
 * These drive the app the way a person does: they find a RENDERED anchor and
 * click it, rather than calling router functions directly. Anchor default
 * behaviour (hash assignment, modifier keys, target, download, external
 * protocols) is implemented in scripts/lib/dom-shim.mjs, so a click here
 * exercises the same path a browser takes.
 *
 * The same flows were also exercised manually in Chrome; see the report in
 * docs/ for the browser/viewport matrix.
 */
import assert from "node:assert/strict";
import { installDom } from "./lib/dom-shim.mjs";
import { loadBrowserData } from "./lib/load-data.mjs";

const { window, app } = installDom({ hash: "#/" });
const browserData = loadBrowserData([]);
Object.entries(browserData).forEach(([key, value]) => { window[key] = value; });

const consoleErrors = [];
const originalError = console.error;
console.error = (...args) => { consoleErrors.push(args.join(" ")); };

await import("../assets/js/app.js");
const { currentRoute } = await import("../assets/js/router.js");

let checks = 0;
function check(name, fn) {
  const before = consoleErrors.length;
  fn();
  const raised = consoleErrors.slice(before);
  assert.equal(raised.length, 0, `console.error during "${name}": ${raised.join(" | ")}`);
  checks += 1;
  console.log(`  ok  ${name}`);
}

function visit(hash) {
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = hash;
  }
  return app;
}

function heading() {
  const node = app.querySelector("h1");
  return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
}

/* Finds a rendered anchor by its href, optionally scoped to a container. */
function link(href, scope) {
  const root = scope === "#app" ? app
    : scope ? window.document.querySelector(scope)
    : window.document.documentElement;
  const found = root.querySelectorAll(`a[href='${href}']`)[0];
  assert.ok(found, `no rendered link with href="${href}"${scope ? ` inside ${scope}` : ""}`);
  return found;
}

/* Clicks a real link and asserts where it landed. */
function clickTo(anchor, expectedHash, expectedHeadingPart, label) {
  anchor.click();
  assert.equal(window.location.hash, expectedHash, `${label}: hash after click`);
  assert.equal(currentRoute().name === "not-found", false, `${label}: resolved to not-found`);
  if (expectedHeadingPart) {
    assert.ok(heading().includes(expectedHeadingPart),
      `${label}: expected H1 containing "${expectedHeadingPart}", got "${heading()}"`);
  }
  assert.ok(app.children.length > 0, `${label}: target rendered no content`);
}

/* ------------------------------------------------- 1. logo → home */

check("1 · logo returns to home", () => {
  visit("#/assessments");
  clickTo(link("#/", ".site-header"), "#/", "افهموا بعض", "logo");
});

/* ---------------------------------- 2-6. homepage → each experience */

check("2 · home → premarital journey", () => {
  visit("#/");
  clickTo(link("#/premarital", "#app"), "#/premarital", "الرحلة قبل الزواج", "home→premarital");
});

check("3 · home → assessments", () => {
  visit("#/");
  clickTo(link("#/assessments", "#app"), "#/assessments", "اختارا", "home→assessments");
});

check("4 · home → questions", () => {
  visit("#/");
  clickTo(link("#/questions", "#app"), "#/questions", "أسئلة بيننا", "home→questions");
});

check("5 · home → knowledge challenge", () => {
  visit("#/");
  clickTo(link("#/know-me", "#app"), "#/know-me", "قد إيه تعرفني؟", "home→know-me");
});

check("6 · home → privacy", () => {
  visit("#/");
  clickTo(link("#/privacy", "#app"), "#/privacy", "إجاباتك", "home→privacy");
});

/* --------------------------------------------- 7-8. footer links */

check("7 · footer → scientific basis", () => {
  visit("#/");
  clickTo(link("#/science", ".site-footer"), "#/science", "كيف بُنيت", "footer→science");
});

check("8 · footer → terms and limits", () => {
  visit("#/");
  clickTo(link("#/terms", ".site-footer"), "#/terms", "شروط الاستخدام", "footer→terms");
});

/* -------------------------------------- 9-10. header and mobile nav */

check("9 · desktop header navigation", () => {
  visit("#/");
  [
    ["#/premarital", "الرحلة قبل الزواج"],
    ["#/assessments", "اختارا"],
    ["#/questions", "أسئلة بيننا"],
    ["#/know-me", "قد إيه تعرفني؟"]
  ].forEach(([href, expected]) => {
    clickTo(link(href, ".desktop-nav"), href, expected, `header ${href}`);
  });
});

check("10 · mobile menu opens, navigates, and closes", () => {
  visit("#/");
  const toggle = window.document.querySelector("#menu-toggle");
  const menu = window.document.querySelector("#mobile-menu");
  toggle.click();
  assert.equal(menu.hidden, false, "menu should open");
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  clickTo(link("#/safety", "#mobile-menu"), "#/safety", "الخصوصية والأمان", "mobile menu");
  assert.equal(menu.hidden, true, "menu should close after navigating");
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
});

/* ------------------------------------------- 11. back and forward */

check("11 · Back and Forward move through history", () => {
  visit("#/");
  link("#/premarital", "#app").click();
  assert.equal(window.location.hash, "#/premarital");
  link("#/questions", ".desktop-nav").click();
  assert.equal(window.location.hash, "#/questions");

  window.history.back();
  assert.equal(window.location.hash, "#/premarital", "Back should return to the previous route");
  assert.ok(heading().includes("الرحلة قبل الزواج"), "Back should re-render the previous view");

  window.history.forward();
  assert.equal(window.location.hash, "#/questions", "Forward should advance again");
  assert.ok(heading().includes("أسئلة بيننا"), "Forward should re-render");
});

/* --------------------------------- 12-13. direct load and refresh */

check("12 · a nested route opens directly", () => {
  visit("#/premarital/align/money-and-obligations");
  assert.equal(currentRoute().name, "alignment");
  assert.ok(heading().length > 0, "direct load rendered a heading");
});

check("13 · refreshing a nested route re-renders it", () => {
  visit("#/questions/deck/premarital-basics");
  const before = heading();
  // A refresh is a fresh render at the same hash.
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  assert.equal(window.location.hash, "#/questions/deck/premarital-basics");
  assert.equal(heading(), before, "refresh should render the same view");
});

/* ----------------------------------- 14-17. dynamic content links */

check("14 · a dynamic assessment card navigates", () => {
  visit("#/assessments");
  const card = app.querySelectorAll("a[href^='#/assessment/']")[0];
  assert.ok(card, "assessment library should render assessment links");
  const href = card.getAttribute("href");
  assert.ok(!href.includes("undefined"), "assessment href must not contain undefined");
  clickTo(card, href, null, "assessment card");
  assert.equal(currentRoute().name, "assessment");
});

check("15 · a dynamic alignment card navigates", () => {
  visit("#/premarital");
  const card = app.querySelectorAll("a[href^='#/premarital/align/']")[0];
  assert.ok(card, "journey should render alignment links");
  const href = card.getAttribute("href");
  assert.ok(!href.includes("undefined"), "alignment href must not contain undefined");
  clickTo(card, href, null, "alignment card");
  assert.equal(currentRoute().name, "alignment");
});

check("16 · a conversation category link navigates", () => {
  visit("#/questions");
  const card = app.querySelectorAll("a[href^='#/questions/category/']")[0];
  const href = card.getAttribute("href");
  clickTo(card, href, null, "category link");
  assert.equal(currentRoute().name, "questions-category");
});

check("17 · a conversation deck link navigates", () => {
  visit("#/questions");
  const card = app.querySelectorAll("a[href^='#/questions/deck/']")[0];
  const href = card.getAttribute("href");
  clickTo(card, href, null, "deck link");
  assert.equal(currentRoute().name, "questions-deck");
});

/* ------------------------------- 18. invalid route recovery link */

check("18 · the not-found view offers a working way back", () => {
  visit("#/this-route-does-not-exist");
  assert.equal(currentRoute().name, "not-found");
  assert.ok(heading().includes("غير موجودة"), "not-found view should render");
  clickTo(link("#/", "#app"), "#/", "افهموا بعض", "not-found recovery");
});

/* ------------------------------------------- 19. external links */

check("19 · external source links are never routed", () => {
  visit("#/science");
  const external = app.querySelectorAll("a[href^='https://']")[0];
  assert.ok(external, "the science page should render external references");
  assert.equal(external.getAttribute("target"), "_blank");
  assert.equal(external.getAttribute("rel"), "noopener noreferrer");
  const hashBefore = window.location.hash;
  const result = external.click();
  assert.equal(window.location.hash, hashBefore, "an external link must not change the route");
  assert.equal(result.navigated, false);
});

/* ------------------------- 20. keyboard activation and modifiers */

check("20 · Enter activates a link, modified clicks are not hijacked", () => {
  visit("#/");
  // Enter on a focused anchor produces the same default action as a click.
  const anchor = link("#/premarital", "#app");
  anchor.click();
  assert.equal(window.location.hash, "#/premarital", "Enter/click activates the link");

  visit("#/");
  const target = link("#/assessments", "#app");
  const hashBefore = window.location.hash;
  const ctrl = target.click({ ctrlKey: true });
  assert.equal(window.location.hash, hashBefore, "Ctrl+Click must not be intercepted");
  assert.equal(ctrl.navigated, false);
  const middle = target.click({ button: 1 });
  assert.equal(window.location.hash, hashBefore, "middle click must not be intercepted");
  assert.equal(middle.navigated, false);
});

/* ------------------------------- regression guards for this fix */

check("21 · the skip link never routes the app to not-found", () => {
  visit("#/");
  const before = heading();
  const skip = window.document.querySelector(".skip-link");
  assert.ok(skip, "the skip link should be present in the shell");
  assert.equal(skip.getAttribute("href"), "#app");
  const outcome = skip.click();
  assert.equal(outcome.navigated, false, "a bare fragment must not be treated as a route");
  assert.notEqual(currentRoute().name, "not-found", "a bare fragment must not resolve to a route");
  assert.equal(heading(), before, "the view must survive activating the skip link");
});

check("22 · focus moves to the new view heading after navigation", () => {
  visit("#/");
  link("#/premarital", "#app").click();
  const active = window.document.activeElement;
  assert.ok(active && active.tagName === "H1", `expected focus on H1, got ${active && active.tagName}`);
  assert.equal(active.getAttribute("tabindex"), "-1", "the heading must not join the tab order");
});

check("23 · every rendered internal link resolves to a registered route", () => {
  const routes = [
    "#/", "#/premarital", "#/premarital/agenda", "#/assessments", "#/questions",
    "#/questions/favorites", "#/know-me", "#/privacy", "#/safety", "#/safety/check",
    "#/science", "#/terms", "#/faq", "#/how", "#/assessment/emotional-clarity",
    "#/premarital/align/money-and-obligations", "#/questions/category/identity",
    "#/questions/deck/light-start", "#/no-such-route"
  ];
  const hrefs = new Map();
  routes.forEach((route) => {
    visit(route);
    window.document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!hrefs.has(href)) hrefs.set(href, route);
    });
  });

  const broken = [];
  let internal = 0;
  hrefs.forEach((from, href) => {
    assert.ok(href && href.trim() !== "", `empty href found on ${from}`);
    assert.notEqual(href, "#", `bare "#" href found on ${from}`);
    assert.ok(!href.startsWith("javascript:"), `javascript: href found on ${from}`);
    assert.ok(!href.includes("undefined"), `href contains "undefined": ${href} (on ${from})`);
    if (!href.startsWith("#/")) return;
    internal += 1;
    visit(href);
    if (currentRoute().name === "not-found") broken.push({ href, from });
  });

  assert.deepEqual(broken, [], `links resolving to not-found: ${JSON.stringify(broken)}`);
  assert.ok(internal >= 60, `expected a broad link inventory, audited ${internal}`);
  console.log(`      (audited ${hrefs.size} distinct hrefs, ${internal} internal routes)`);
});

check("24 · no console error during any navigation", () => {
  assert.deepEqual(consoleErrors, []);
});

console.error = originalError;
console.log(`\nLink and navigation tests passed: ${checks} checks.`);
