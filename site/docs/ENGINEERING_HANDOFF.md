# Engineering handoff — 2026-09-08

## Scope and baseline

Started from clean `master` at `5f37e07`. Existing `npm test` passed before edits:
six content validators, core scoring/pairing smoke tests, 49 engine checks,
45 view checks and 24 navigation checks. There were no build, lint, formatter,
TypeScript or browser-test configurations. No pre-existing automated failure
was carried forward. No files under `site/data/` were changed.

## Changed

The product remains dependency-free static HTML/CSS/JavaScript at runtime.
The homepage now orients visitors to four distinct experiences, using the
existing Arabic editorial direction, self-hosted IBM Plex Sans Arabic and
Markazi Text, reusable theme/spacing/type tokens, and restrained plum/olive.
Dimension comparisons use separate participant colors; preference differences
have neutral labels and borders. Overall relationship/similarity gauges and
exports were removed. Authentic assessment/question content remains intact.

Extracted homepage and shared sensitive gates; centralized DOM and RTL radio
behavior; removed obsolete homepage/orbit CSS and duplicate DOM helpers.
Added an allowlisted static build, local server with production headers,
syntax checks, lockfile, Playwright/axe development tools, CI, and AGENTS.md.

## Concrete fixes

- Private mode previously prevented saved progress from being read back, breaking
  active journeys. Memory fallbacks now keep the session usable without later
  migrating temporary answers into persistent storage.
- Corrupt/incomplete/stale results cannot render invented scores: validate raw
  answers and content schema, then recompute dimensions and safety locally.
- Partner-code parsing now bounds input, rejects trailing garbage and invalid
  versions, validates six dimensions/full map categories/count consistency,
  and revalidates cached payloads. Legacy BN1 formats remain accepted.
- New assessment codes remove derived/safety metadata; BNA1 suppresses means
  from a single contributor. Neither codec includes item answers or free notes.
- Sensitive deep links require per-activity consent; stable neutral aliases and
  titles reduce incidental history exposure. Consumed code fragments are removed.
- Double-Escape works through dialogs, ignores held-key repeats, resets correctly,
  closes top-layer dialogs and clears temporary state before neutral navigation.
- Option rerenders preserve focus; RTL arrow keys and Enter/Backspace work;
  next/previous question navigation focuses the new heading. Ordinary buttons,
  dialogs and text inputs retain their native keyboard behavior.
- Optional assessment notes survive refresh only in the tab session and clear on
  completion/restart. Conversation notes stay memory-only; raw-text conversation
  code sharing was replaced by local review to honor the privacy contract.
- Alignment/knowledge sessions reject stale or malformed restored state;
  same-device partner B never becomes a persistent result.
- Corrected dark-theme primary-link hover contrast and removed width animation.

## Privacy and safety evidence

No backend, account, analytics, remote font, answer request, or runtime API was
added. CSP restricts connections and third-party resources. Runtime source scan
found no fetch/XHR/beacon, user-HTML injection or answer logging. Tracked-file
scan found no environment/credential files. These are scoped engineering checks,
not a penetration-test or professional safety approval.

Codes are readable Base64URL aggregates, not encrypted or authenticated.
Small aggregates and repeated sharing can reveal inferences. Quick exit clears
temporary data, not persistent results, earlier history, screenshots or clipboard.
Browser session restore/duplication can preserve sessionStorage; explicit end-
session controls provide application-level cleanup. These limits remain explicit.

## Validation

Commands: `npm ci`, `npm run check`, `npm test`, `npm run test:e2e` (includes
`npm run build`), and `git diff --check`.

The browser suite uses synthetic data in isolated Edge contexts and the built
site hosted below `/baynana/`. It covers assessment edit/reload/restart, sensitive
exit/dialogs, valid/self/corrupt partner imports, same-device lifecycle,
conversation filters/notes, both knowledge directions, deep links/back/forward,
private-mode reload and corrupted sessions. Responsive checks cover 320, 390,
430, 768, 1024, 1440 and 1920px across six routes. axe checks seven routes in both
themes; no automated WCAG conformance claim is made.

In-app-browser manual checks caught and then verified the Enter fix, RTL arrow
selection, keyboard backtracking, answer edits and completion of all 18 assessment
questions with heading focus. Sensitive-route manual checks confirmed neutral
alias/title, a non-exiting single Escape and a double Escape opening Wikipedia.
Full manual A–H and assistive-technology coverage
are not claimed; automated real-browser A–H coverage remains reproducible.
Screenshots were inspected at desktop/mobile. Independent design review found
mobile comparison tables hiding partner answers; narrow layouts now show wrapped
per-item questions, both answers and neutral descriptions. Result metadata moved
below headings and nested insights became ruled reading rows.

Verified: clean `npm ci` (5 packages, zero audit findings), syntax checks on 47
files, all six validators, core smoke, 49 engine checks, 45 view checks (zero
console errors), 24 link checks (121 hrefs/75 routes), 14 hardening checks,
and 9 Edge browser tests. The final discussion-row styling also passed the
focused C/D browser test after rebuild. `git diff --check` passed.
No lint/formatter/TypeScript configuration exists; those checks are inapplicable.
Git delivery is reported with the pull request.

## Remaining release gates

Licensed professional safety/content review, native Arabic editorial review,
comprehensive manual keyboard/screen-reader testing, actual Safari/iOS testing,
and host-specific post-deployment smoke tests remain open. No production
deployment, scientific validation, public-launch approval or performance score
is claimed. Font assets total approximately 1 MB (self-hosted TTF, swap loading);
no new raster artwork is shipped.

## Delivery verification — 2026-09-09

Re-ran the existing suite before further changes. Review found that opening an
alignment share link before completing the recipient's own map discarded the
partner code when navigating or refreshing. Pending BNA1 codes now stay in tab
session storage until paired, restarted, or cleared; private mode uses the same
session path. Two browser regressions reproduced the failure before the fix and
now complete the full recipient journey in normal and private modes. A hardening
check verifies pending-code cleanup and the absence of persistent writes.

Updated privacy/FAQ copy to match the aggregate-only assessment payload and to
explain browser session restoration. Original `site/data/` files are unchanged.

Final local checks passed: `npm ci` (zero audit findings), `npm run check` (47
files), `npm test` (all six validators, core scoring/pairing, 49 engine checks,
45 view checks, 24 navigation checks, and 15 hardening checks), and
`npm run test:e2e` (11 Edge browser tests, including responsive and axe checks).
`git diff --check` passed. Production output contains only `assets/`, `data/`,
`index.html`, `robots.txt`, and `vercel.json`; local screenshots and browser
artifacts remain ignored. The manual and specialist release gates above remain
open.

The first GitHub Actions run exposed a test-harness incompatibility with Node
22's getter-only global `navigator`. The DOM shim now installs its mock with
`Object.defineProperty`; a local getter-only reproduction failed before this
change and passed after it. This change affects test tooling only.
