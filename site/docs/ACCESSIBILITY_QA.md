# Accessibility QA

**Target: WCAG 2.2 Level AA.**

**Conformance is not claimed.** A conformance claim requires manual testing with
real assistive technology in real browsers, and that testing has not been
performed. This document records exactly what *was* checked, by what method, and
what remains open.

---

## 1. What was checked automatically

These run on every `npm test` as part of `scripts/test-views.mjs`, against the
real view modules rendered through a DOM shim. Each failure blocks the build.

| Check | Test name | Covers |
|---|---|---|
| Exactly one `H1` per view, across 21 routes | `every view has exactly one H1` | 1.3.1, 2.4.6 |
| Every `input`/`textarea`/`select` has a label, `aria-label`, or `aria-labelledby` | `every form control has an accessible name` | 1.3.1, 3.3.2, 4.1.2 |
| Every `button` and `a` has discernible text or an `aria-label` | `every button and link has a discernible label` | 2.4.4, 4.1.2 |
| `role="progressbar"` carries min/max/now/label; quiz options form a labelled radio group with `aria-checked` | `progress and meter widgets carry complete ARIA state` | 4.1.2, 1.3.1 |
| Every data table has a `caption` and `scope` on every `th` | `data tables carry a caption and scoped headers` | 1.3.1 |
| Every live region is `aria-live="polite"` | `status regions are announced politely, not assertively` | 4.1.3 |
| Toggle chips expose `aria-pressed`, exactly one active | `toggle controls expose pressed state` | 4.1.2 |
| Quick exit appears on sensitive views only, with an `aria-label` | `the quick-exit control appears on sensitive views only` | 2.4.4 |
| No route throws or logs a console error | `no route left an uncaught console error` | robustness |
| No route leaks `undefined` or `[object Object]` into visible text | `assertRendered` | 3.1 quality |

**Two real defects were found and fixed by these checks:**

1. `#/know-me/setup` rendered with no `H1` at all.
2. In-memory challenge state survived a session wipe, so cleared answers could be
   resumed — a privacy defect surfaced by the session-cleanup test.

---

## 2. What was implemented and verified by code review

| Requirement | Implementation |
|---|---|
| Semantic landmarks | `header` / `nav` / `main` / `footer` in `index.html`; views render `section` + `header` |
| Skip link | `<a class="skip-link" href="#app">` as the first focusable element |
| Focus restoration after route change | `render()` calls `app.focus({ preventScroll: true })` on `#app[tabindex="-1"]` |
| Focus restoration after a dialog | `confirmAction()` records `document.activeElement` and restores it on close |
| Keyboard access to every control | every control is a real `button`, `a`, `input`, `select`, or `textarea`; no `div` click handlers |
| Escape does not conflict with quick exit | the quick-exit handler returns early when `dialog[open]` exists, so Escape still dismisses dialogs |
| Quick exit is keyboard accessible | a real `button`, plus Escape pressed twice within 900ms |
| Screen-reader announcements for question changes and progress | `announce()` writes to `#live-region` (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`); progress bars expose `aria-valuetext` in Arabic |
| No colour-only status | every status carries a text label (`بداية مشتركة`, `أولوية للحوار`, `مكتمل`); content kind carries a text badge as well as a border colour |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables view animation and transitions |
| Touch targets ≥ 44×44 CSS px | `.chip`, `.quick-exit-bar .button`, and card buttons set `min-height: 44px` |
| Reflow without horizontal scrolling | grids use `minmax(min(100%, …), 1fr)`; wide tables are wrapped in `.table-scroll` with `overflow-x: auto` |
| Accessible charts | every chart has an adjacent text table alternative inside a `details` element; the chart itself carries `role="img"` and a descriptive label |
| Arabic language and direction | `<html lang="ar" dir="rtl">` |
| Direction isolation | `isolatedCode()` wraps result codes, DOIs, and Latin identifiers in `<bdi dir="ltr">` |
| Useful error messages | every decode failure returns a specific Arabic message naming the cause and the correction |
| Visible keyboard focus | focus styles are defined in `assets/css/base.css` using `--color-focus` |

---

## 3. Not verified — manual testing still required

None of the following has been done. Each is a blocking item for a public
launch, and none can be established by the automated suite:

- [ ] **Screen readers.** NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari
      (macOS and iOS), TalkBack + Chrome (Android) — with an Arabic voice, in RTL.
- [ ] **Keyboard-only traversal** of every flow in a real browser, including the
      quiz, the alignment handoff, and the knowledge challenge.
- [ ] **Focus not obscured by sticky elements** (WCAG 2.2 SC 2.4.11/2.4.12) —
      the sticky quick-exit bar must be checked against a focused element at the
      bottom of the viewport.
- [ ] **Contrast measurement.** Text and non-text contrast ratios have been
      designed for but not measured with a contrast tool, in both themes.
- [ ] **Text resize to 200%** and **400% reflow at 320px** in a real browser.
- [ ] **Target size (minimum)** (SC 2.5.8) measured on rendered output, not just
      asserted in CSS.
- [ ] **Dragging movements** (SC 2.5.7) — believed not applicable; confirm.
- [ ] **Consistent help** (SC 3.2.6) and **redundant entry** (SC 3.3.7) review.
- [ ] **Accessible authentication** (SC 3.3.8) — believed not applicable; there
      is no authentication.
- [ ] **Automated auditing** with axe-core or Lighthouse against a served build.
      No such run has been performed and no score is claimed.

---

## 4. Known accessibility risks

1. **The sticky quick-exit bar** could obscure a focused control at the bottom of
   a short viewport. It is `position: sticky` inside the flow rather than fixed,
   which reduces but may not eliminate the risk. Needs a real-browser check.
2. **Long option text in a radio group** produces tall targets; confirm the group
   is still navigable with a screen reader's forms mode.
3. **The optional session timer** in the conversation view updates every second.
   It is off by default and lives in a non-live element, so it should not spam a
   screen reader — but this needs verification.
4. **Arabic screen-reader pronunciation** of mixed Arabic/Latin lines (result
   codes) depends on `bdi` support in the assistive technology, not only the
   browser.
5. **The DOM shim is not a browser.** It confirms structure and ARIA attributes;
   it cannot confirm computed accessible names, focus order, contrast, or
   rendering.

---

## 5. How to re-run the automated portion

```powershell
npm test
```

The accessibility checks are the final block of `scripts/test-views.mjs` and are
reported individually in the output.
