# Baynana (بيننا)

Baynana is a static, Arabic-first, RTL site for two adults in a romantic or
committed relationship, focused on the period before marriage. Each person
answers privately on their own device, and the product turns what they answered
into a clearer conversation — never into a verdict.

The product does **not** diagnose either person, label a partner, produce a
compatibility or marriage score, predict marriage success or divorce, verify a
religious identity, or replace qualified professional support.

---

## The four content engines

They are deliberately separate, and the UI never presents them as
scientifically equivalent.

| Engine | Kind | Scored | What it produces |
|---|---|---|---|
| **Behavioral assessments** | `assessment` | yes (0/1/2 items) | six dimension percentages, descriptive bands, dimension-level reading |
| **Neutral alignment maps** | `alignment` | **no** | same / close / different / not-yet-discussed / private per item — no number of any kind |
| **Conversation library** | `conversation` | no | questions and optional device-only notes |
| **Knowledge challenge** | `knowledge` | within one session only | two separate direction results, never combined |

Why alignment maps are not scored, and why differences are not deficits:
`docs/CONTENT_METHODOLOGY.md`.

---

## Content counts

| | Count |
|---|---|
| Behavioral assessments | **20** (the 17 original IDs, unchanged, plus 3 new) |
| Dimensions · questions · options | 120 · 360 · 1080 |
| Alignment maps | **8** (premarital domains 7–14) |
| Alignment categories · items | 48 · 144 |
| Conversation categories · questions | **20** · **240** |
| Curated conversation decks | 10 |
| Knowledge categories · items | **12** · **96** |
| Premarital domains covered | 14 |
| Verified scientific references | 45 |

The three new assessments — `partner-responsiveness`,
`shared-decision-making`, `trust-autonomy-boundaries` — exist because
`docs/PREMARITAL_COVERAGE.md` found those behavioral domains genuinely
uncovered. Domains already covered reuse the existing assessment rather than
duplicating it.

---

## Routes

Routes live in the URL hash, so every route opens directly, survives a
refresh, and works from a subdirectory on Vercel and GitHub Pages.

```text
#/                                          home
#/premarital                                the premarital journey (14 domains)
#/premarital/agenda                         discussion agenda (user-selected topics only)
#/premarital/align/:id                      alignment map introduction
#/premarital/align/:id/answer               answering the map
#/premarital/align/:id/result               your own map + share options
#/premarital/align/:id/handoff              same-device handoff screen
#/premarital/align/:id/compare              detailed same-device comparison (session-only)
#/premarital/align/:id/partner              two-device aggregate code entry
#/premarital/align/:id/partner/:code        share link that preloads a partner code
#/premarital/align/:id/shared               two-device aggregate comparison
#/questions                                 conversation library
#/questions/category/:id                    one of the twenty categories
#/questions/deck/:id                        one of the ten curated decks
#/questions/session                         guided session
#/questions/favorites                       favorites · later · discussed
#/know-me                                   knowledge challenge introduction
#/know-me/setup · /play · /handoff · /review · /result
#/safety                                    safety and quick exit
#/safety/check                              private safety self-check (session-only)
#/terms                                     terms and limitations
#/assessments                               assessment library
#/assessment/:id · /quiz · /result · /partner · /partner/:code · /shared
#/how · #/privacy · #/science · #/faq
```

Legacy `#/t/:id` bookmarks still resolve to the equivalent view.

---

## Architecture

No runtime dependencies or third-party runtime code. A small Node build copies only production assets into `dist`; Playwright and axe are development-only dependencies.

```text
index.html
assets/
  css/    tokens · base · components · pages
  js/
    app.js               shell, routing dispatch, assessment views
    home.js              editorial homepage and engine entry points
    sensitive-gate.js    session-scoped consent for sensitive routes
    dom.js               shared DOM helpers + Arabic search normalization
    router.js            hash routing for every area
    storage.js           namespaced local/session persistence, schema guards, private mode
    scoring.js           assessment scoring and pair comparison
    pairing.js           BN1 assessment result codes
    alignment.js         neutral alignment engine + BNA1 aggregate codes
    premarital.js        journey, agenda, and alignment views
    conversation.js      conversation library and session
    knowledge.js         knowledge scoring engine (pure)
    knowledge-views.js   knowledge challenge flow
    safety.js            safety gating, private self-check, quick exit, boundary guard
    safety-views.js      safety page and private self-check views
    charts.js            accessible charts with text-table alternatives
data/
  tests.js · additional-tests.js · config.js · assessment-registry.js · sources.js
  premarital/  skill-assessments.js · alignment-maps.js · registry.js
  conversation/ categories.js · questions.js · decks.js
  knowledge/    categories.js · items.js
scripts/
  lib/load-data.mjs · lib/dom-shim.mjs
  validate-assessments.js · validate-alignment.js · validate-conversation.js
  validate-knowledge.js · validate-sources.js
  test-core.mjs · test-engines.mjs · test-views.mjs
docs/
  PREMARITAL_COVERAGE.md · CONTENT_METHODOLOGY.md · ARABIC_CONTENT_GUIDE.md
  SAFETY_MODEL.md · PRIVACY_DATA_MAP.md · ACCESSIBILITY_QA.md · RELEASE_CHECKLIST.md
robots.txt · vercel.json
```

---

## Scoring

Assessment scoring is unchanged:

```text
dimension raw     = sum of three item scores           (0…6)
dimension percent = round(raw / 6 * 100)               (0…100)

```

The legacy comparison helper remains internally compatible; its overall similarity
is never displayed or exported. Results show six separate dimensions.

Interpretive copy always follows the **named raw percentage**, so a negative
dimension at 100% reads as *a lot of the named indicator*, never as a good
result.

> **Fixed in this release:** `data/additional-tests.js` mapped its
> elevated-risk text into `interp.low`, so all five risk-mode assessments showed
> inverted dimension interpretations. The `riskDimension` helper now maps
> `elevated → interp.strong` and `minimal → interp.low`. No content was rewritten
> and no ID changed.

Alignment maps have **no scoring at all** — no polarity, no percentage, no
overall number. Classification only:

```text
ordered   distance 0 → same · 1 → close · 2+ → different
nominal   equal → same · otherwise → different   (closeness is never invented)
either    "لم نتحدث في هذا بعد" → not discussed
          "أفضل عدم الإجابة"    → private, excluded
```

A difference where either partner marked the topic important or essential is a
**priority conversation**, not a red flag.

Knowledge scoring: accurate = 1, close = 0.5 (ordered items only), different = 0.
"Not sure", "prefer not to answer", ambiguous, and outdated items leave the
denominator entirely; a zero denominator yields `null` and is explained in words
rather than shown as `0%`. The two directions are never combined.

---

## Result-code formats

### BN1 — assessments (backward compatible)

```text
[ version, assessmentId, nickname, [6 percentages], derived, completedAt, checksum ]
```

New BN1 codes leave `derived` empty; raw answers, notes, and safety flags are excluded.
The decoder accepts allowlisted fields in historical codes.

### BNA1 — alignment maps

```text
[ version, mapId, nickname, contentVersion, [category aggregates], completedAt, checksum ]
```

Each aggregate carries only: category id, mean position across **answered
ordered items**, with at least two contributors (otherwise `null`), how many contributed, how many ordered items exist,
how many were not discussed, how many were kept private, and how many the sender
marked essential.

**No item-level answer and no free text is ever encoded.** That is enforced in
`encodeAlignmentCode()` itself, which runs the safety guard on the payload
before encoding.

Both decoders reject oversized, malformed, corrupted, checksum-failing,
unsupported-version, unknown-module, mismatched-module, mismatched
content-version, out-of-range, future-dated, and self-imported codes. Codes live
in the hash, never a query string.

Base64URL is transport encoding, **not encryption**. The FNV-1a checksum detects
corruption and casual tampering; it is not a signature.

---

## Two privacy levels for comparison

| | Same-device | Two-device |
|---|---|---|
| Detail | item by item | category level only |
| Where answers live | `sessionStorage`, purged when the session ends | never leave the originating device |
| Handoff | full-screen screen showing no previous answer | not applicable |
| What is shared | nothing | a BNA1 aggregate code |

The UI states plainly that the remote comparison is **less detailed on purpose**,
and why.

---

## Local storage keys

```text
baynana:v1:theme · nickname · private-mode
baynana:v1:progress:<assessmentId> · result:<assessmentId> · pair:<assessmentId> · pending:<assessmentId>
baynana:v1:align:progress:<mapId> · align:result:<mapId> · align:pair:<mapId>
baynana:v1:conversation:favorites · conversation:discussed · conversation:later   (question IDs only)
baynana:v1:knowledge:summaries      (counts only, opt-in)
baynana:v1:premarital:agenda        (topics the users explicitly added)
```

Session-only:

```text
baynana:v1:session:align:<mapId>:a · :b · :mode
baynana:v1:session:knowledge
baynana:v1:session:safety-check
```

Every read is schema-validated. A record written under a different content
version is returned marked `stale` and **not reinterpreted** — the UI offers a
restart instead of silently mapping old answers onto changed options.

**Private mode** disables every persistent write while leaving session features
working. Full map: `docs/PRIVACY_DATA_MAP.md`.

---

## Safety

Safety outranks engagement. Private safety answers can never enter a couple
score, a discussion agenda, a share code, an export, or a handoff screen — the
guard throws rather than filtering, and it runs on the payload before encoding.

Quick exit is available on every sensitive view and by pressing **Escape twice**.
It covers the page, clears sensitive session state, and calls
`location.replace()` to a configurable neutral destination. The UI states what
quick exit cannot do: it cannot erase browser history, network or device
monitoring, screenshots, or clipboard history.

Immediate danger is directed to **local emergency services**; no country-specific
number is ever invented. Full model: `docs/SAFETY_MODEL.md`.

---

## Scientific limitations

These are **evidence-informed, original self-assessments**, not validated Arabic
adaptations of anything.

- No cognitive interviews, item analysis, reliability estimates, validity
  evidence, invariance testing, or norms exist for this Arabic wording.
- Band labels are descriptive product ranges, not clinical cutoffs.
- Published measures informed the construct map only. **No item was copied,
  translated, or closely paraphrased** from PREPARE/ENRICH, Gottman products, the
  CSI, ECR-R, DAS, or any other instrument, and no licence was sought or granted.
- Every reference in `data/sources.js` records its title, authors, year, DOI
  where one exists, canonical URL, source type, what construct it supports, its
  item-use status, and an access date. `validate-sources.js` fails the build on
  any invented reliability, validity, norm, licensing, or expert-review claim.

Details: `docs/CONTENT_METHODOLOGY.md`.

---

## Run, build, and verify

From `site/`, with Node 20+:

```powershell
npm ci
npm run dev        # local source, http://127.0.0.1:5173/#/
npm run check      # syntax checks, not a lint or TypeScript claim
npm test           # six content validators + core/engine/view/link/hardening checks
npm run test:e2e   # builds dist, then real-browser journeys and axe
npm run build      # static dist: HTML, CSS, JS, content, fonts, host config
```

Windows tests use installed Microsoft Edge; Linux CI installs Chromium with
`npx playwright install --with-deps chromium`. Browser tests run under `/baynana/`
to cover subdirectory hosting. DOM-shim tests remain a fast structural layer;
they do not replace browser or assistive-technology testing.

`.github/workflows/quality.yml` runs install, syntax, content, unit, view, link,
and browser checks on pull requests. It does not deploy anything.

## Deploy the static build

Set Vercel's project root to `site`, framework **Other**, install `npm ci`.
`vercel.json` defines `npm run build` and output `dist`. Alternatively publish
the contents of `dist` to GitHub Pages or any static host. Never publish the
repository root or `node_modules`. No deployment was performed for this change.

Vercel applies strict CSP (no inline scripts/eval, `connect-src 'none'`),
no-referrer, permissions and isolation headers. The HTML includes a matching
meta CSP and referrer policy for hosts without response-header configuration;
frame-ancestor protection requires response headers. No view may emit inline
style attributes; chart CSSOM widths remain supported.

Fonts are self-hosted IBM Plex Sans Arabic and Markazi Text, reused from the
existing design preview. Their SIL OFL licenses ship beside them in
`assets/fonts`. Upstream license sources: [IBM Plex Sans Arabic](https://github.com/google/fonts/blob/main/ofl/ibmplexsansarabic/OFL.txt)
and [Markazi Text](https://github.com/google/fonts/blob/main/ofl/markazitext/OFL.txt).
No external font request occurs. Production excludes the design preview,
test fixtures, tooling, and documentation. A sitemap awaits a canonical domain.

See `docs/ENGINEERING_HANDOFF.md` for changes, evidence, and remaining limits.

---

## Human review still required

The code and content are technically ready for a private beta. They are **not**
professionally or clinically approved, and the product does not claim to be.
Blocking reviews before a public launch — a licensed relationship or
mental-health professional, a native Arabic editorial reviewer, a privacy and
safety reviewer, and manual accessibility testing — are itemised in
`docs/RELEASE_CHECKLIST.md`.
