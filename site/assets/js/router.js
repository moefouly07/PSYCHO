/*
 * Static-hosting-safe hash routing.
 *
 * All application state lives after `#`, never in a query string, so every
 * route opens directly, survives a refresh, and works from a subdirectory on
 * Vercel and on GitHub Pages. Result codes are carried in the hash only.
 */

/*
 * A hash is only a route when it is empty or begins with "#/".
 *
 * Plain fragment identifiers such as the skip link's "#app" are NOT routes.
 * They previously fell through the parser as a single segment "app" and
 * resolved to the not-found view, so activating the skip link — the first
 * focusable element on every page — replaced the page with "الصفحة غير موجودة".
 */
export function isRouteHash(hash = window.location.hash) {
  const value = String(hash || "");
  return value === "" || value === "#" || value.startsWith("#/");
}

function segments() {
  const raw = window.location.hash || "#/";
  return raw
    // Tolerate an optional trailing slash so "#/privacy/" === "#/privacy".
    .replace(/\/+$/, "")
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try { return decodeURIComponent(segment); }
      catch { return segment; }
    });
}

const STATIC_PAGES = new Set([
  "assessments", "how", "privacy", "science", "faq", "premarital", "terms", "safety"
]);

const ASSESSMENT_SUBPAGES = ["intro", "quiz", "result", "partner", "shared"];
const ALIGNMENT_SUBPAGES = ["intro", "answer", "result", "handoff", "compare", "partner", "shared"];
const KNOWLEDGE_SUBPAGES = ["setup", "play", "handoff", "review", "result"];

function isSafeId(value) {
  return typeof value === "string" && /^[a-z0-9-]{2,64}$/i.test(value);
}

export function currentRoute() {
  // Non-route fragments are handled natively by the browser, not by the router.
  if (!isRouteHash()) return { name: "fragment" };

  const parts = segments();
  if (!parts.length) return { name: "home" };

  if (STATIC_PAGES.has(parts[0]) && parts.length === 1) return { name: parts[0] };

  /* ------------------------------------------------------ premarital journey */
  if (parts[0] === "premarital") {
    if (parts[1] === "agenda" && parts.length === 2) return { name: "premarital-agenda" };
    if (parts[1] === "align" && isSafeId(parts[2])) {
      const subpage = parts[3] || "intro";
      if (ALIGNMENT_SUBPAGES.includes(subpage)) {
        return {
          name: "alignment",
          mapId: parts[2],
          subpage,
          code: subpage === "partner" && parts[4] ? parts.slice(4).join("/") : ""
        };
      }
    }
    return { name: "not-found" };
  }

  /* ------------------------------------------------------ conversation library */
  if (parts[0] === "questions") {
    if (parts.length === 1) return { name: "questions" };
    if (parts[1] === "favorites" && parts.length === 2) return { name: "questions-favorites" };
    if (parts[1] === "session" && parts.length === 2) return { name: "questions-session" };
    if (parts[1] === "category" && isSafeId(parts[2])) return { name: "questions-category", categoryId: parts[2] };
    if (parts[1] === "deck" && isSafeId(parts[2])) return { name: "questions-deck", deckId: parts[2] };
    return { name: "not-found" };
  }

  /* ------------------------------------------------------ knowledge challenge */
  if (parts[0] === "know-me") {
    if (parts.length === 1) return { name: "know-me", subpage: "intro" };
    if (KNOWLEDGE_SUBPAGES.includes(parts[1]) && parts.length === 2) {
      return { name: "know-me", subpage: parts[1] };
    }
    return { name: "not-found" };
  }

  /* ------------------------------------------------------ private safety check */
  if (parts[0] === "safety" && parts[1] === "check" && parts.length === 2) {
    return { name: "safety-check" };
  }

  /* ------------------------------------------------------ existing assessments */
  if (parts[0] === "assessment" && parts[1]) {
    const subpage = parts[2] || "intro";
    if (ASSESSMENT_SUBPAGES.includes(subpage)) {
      return {
        name: "assessment",
        assessmentId: parts[1],
        subpage,
        code: subpage === "partner" && parts[3] ? parts.slice(3).join("/") : ""
      };
    }
  }

  // Old bookmarks are redirected to the equivalent new hash routes.
  if (parts[0] === "t" && parts[1]) {
    const legacySubpage = { q: "quiz", r: "result", p: "partner" }[parts[2]] || "intro";
    return {
      name: "assessment",
      assessmentId: parts[1],
      subpage: legacySubpage,
      code: legacySubpage === "partner" && parts[3] ? parts.slice(3).join("/") : "",
      legacy: true
    };
  }

  return { name: "not-found" };
}

/*
 * One navigation model: the URL hash.
 *
 * The default path assigns `location.hash`, which fires `hashchange` natively
 * and pushes a history entry, so Back and Forward behave normally.
 *
 * `replace: true` is the single deliberate exception. It uses replaceState to
 * avoid leaving a dead entry behind (for example after deleting all data) and
 * therefore MUST dispatch `hashchange` itself, because history methods never
 * fire it. This is the only place the two are mixed, and it is explicit.
 */
export function navigate(hash, options = {}) {
  const target = hash.startsWith("#") ? hash : `#${hash}`;
  if (options.replace) {
    window.history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  if (window.location.hash === target) {
    // Same-route activation still re-renders, so a nav link is never inert.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

export function assessmentPath(assessmentId, subpage = "") {
  const root = `#/assessment/${encodeURIComponent(assessmentId)}`;
  return subpage ? `${root}/${subpage}` : root;
}

export function alignmentPath(mapId, subpage = "") {
  const root = `#/premarital/align/${encodeURIComponent(mapId)}`;
  return subpage ? `${root}/${subpage}` : root;
}

const NAV_GROUPS = {
  assessment: "assessments",
  premarital: "premarital",
  "premarital-agenda": "premarital",
  alignment: "premarital",
  questions: "questions",
  "questions-category": "questions",
  "questions-deck": "questions",
  "questions-session": "questions",
  "questions-favorites": "questions",
  "know-me": "know-me",
  "safety-check": "safety"
};

export function updateActiveNavigation(route) {
  const active = NAV_GROUPS[route.name] || route.name;

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  /*
   * The mobile menu and footer use plain hrefs rather than data-nav, so the
   * current page is matched from the href itself. Without this, a mobile user
   * never receives an aria-current cue.
   */
  const currentHash = window.location.hash || "#/";
  document.querySelectorAll(".mobile-menu a[href^='#/'], .site-footer a[href^='#/']").forEach((link) => {
    if (link.getAttribute("href") === currentHash) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
