# Release checklist

Two lists: what the automated suite already guarantees, and what a human must do
before this goes in front of real couples.

---

## A. Automated gates (run `npm test`)

All of these must pass. They do today.

- [x] `validate-assessments` — the seventeen original IDs and Arabic titles are
      present and unchanged; six dimensions, eighteen questions, three per
      dimension, one each of scores 0/1/2, explicit polarity, distinct
      interpretation levels, complete pair copy, required sources, no banned
      claim.
- [x] `validate-alignment` — eight required maps, six categories and eighteen
      items each, five-position neutral scales, no polarity or scoring field, no
      compatibility copy, complete result copy, correct importance and skip
      handling, intimate maps optional and adult-gated.
- [x] `validate-conversation` — exactly twenty required categories, at least
      twelve questions each and 240 overall, three each of discovery / deep /
      decision / scenario, unique IDs, valid metadata, follow-ups on closed
      questions, no duplicate text, no scoring fields, ten decks referencing
      valid question IDs without duplicating text.
- [x] `validate-knowledge` — exactly twelve required categories, at least eight
      items each and 96 overall, four to six substantive options, ordered versus
      nominal semantics, adjacency only on ordered items, valid sensitivity and
      skip handling, and **no share-code or localStorage path** in the knowledge
      modules.
- [x] `validate-sources` — every reference has an ID, title, authors, HTTPS URL,
      type, and description; DOIs are well formed; commercial instruments record
      item-use status; no reliability, validity, norm, licensing, or
      expert-review claim appears anywhere.
- [x] `test-core` — existing scoring, negative-polarity semantics, comparison
      bands, BN1 round-trip, checksum corruption, mismatched assessment,
      hash-only links.
- [x] `test-engines` — 49 checks: alignment classification, nominal versus
      ordered, not-discussed and private exclusions, priority selection, no
      overall number, category aggregates, BNA1 versioning and rejection paths,
      both knowledge directions, zero denominator, ambiguous/outdated exclusion,
      storage sanitization, private mode, session cleanup, routing, and the
      safety guard.
- [x] `test-views` — 45 checks: every route renders, the full alignment flow, the
      same-device handoff and comparison, the two-device aggregate comparison, a
      complete knowledge session, a conversation session, an existing assessment
      end to end, legacy bookmarks, delete-all, plus the accessibility audit.
- [x] No uncaught console error on any route.

---

## B. Human review gates — none of these has been done

### B1. Licensed relationship or mental-health professional — **BLOCKING**

- [ ] Review every assessment's dimensions, items, and interpretation copy for
      clinical safety and for language that could be misread as diagnostic.
- [ ] Review the safety model, thresholds, and messages, ideally with someone
      experienced in intimate-partner violence.
- [ ] Review the intimacy map and the intimacy conversation category.
- [ ] Confirm the product's claim ceiling ("evidence-informed and original") is
      not exceeded anywhere in the UI.

### B2. Native Arabic editorial reviewer — **BLOCKING**

- [ ] Read all 360 assessment questions, 144 alignment items, 240 conversation
      questions, and 96 knowledge items for naturalness, register, and
      unintended connotation.
- [ ] Check dialect neutrality and whether any situation reads as specific to one
      country or class.
- [ ] Verify Arabic punctuation, diacritics, and number presentation throughout.
- [ ] Confirm the shared option scales read naturally inside each specific
      question, not just in the abstract.

### B3. Privacy and safety reviewer — **BLOCKING**

- [ ] Independently confirm that no item-level answer leaves the device in either
      share-code format.
- [ ] Confirm the private safety self-check cannot reach an agenda, code, export,
      or handoff screen.
- [ ] Review the privacy page against actual observed network behaviour.
- [ ] Review the quick-exit limitations copy for accuracy.

### B4. Manual accessibility testing — **BLOCKING**

- [ ] Complete every unchecked item in `ACCESSIBILITY_QA.md` section 3.
- [ ] Run axe-core or Lighthouse against a served build and record the actual
      results. Do not publish a score that was not measured.

### B5. Legal review — required only for commercial deployment

- [ ] Terms of use and limitation of liability for the target jurisdictions.
- [ ] Confirm no trademark or copyright issue arises from naming the instruments
      cited on the scientific-basis page.
- [ ] Confirm the age gate and adult-only content handling meet local
      requirements.

---

## C. Content-review checklist (per item, for B1 and B2)

For each new or edited item:

- [ ] Original Arabic, not translated, and not close to any published item.
- [ ] Asks about observable behavior or a stated preference, not identity.
- [ ] One construct; not double-barrelled.
- [ ] No absolutes ("دائمًا"، "أبدًا") and no moralising.
- [ ] Options are all plausible; no obvious good/bad pair.
- [ ] No assumption about gender, religion, income, family structure, fertility,
      or living arrangement.
- [ ] "أفضل عدم الإجابة" offered where sensitivity requires it.
- [ ] For scored items: scores 0/1/2 appear exactly once each, and polarity is
      explicit and correct.
- [ ] For alignment items: no polarity, no better end of the scale.
- [ ] For conversation questions: open where possible; a meaningful follow-up if
      the form is closed.
- [ ] For knowledge items: ordered versus nominal is correct, and adjacency is
      only allowed where the options truly form a continuum.

---

## D. Pre-deploy technical checks

- [ ] `npm test` passes with exit code 0.
- [ ] Serve locally (`npm run serve`) and open `#/` in Chrome, Firefox, and
      Safari; confirm no console error and no horizontal overflow at 320px.
- [ ] Confirm every route opens directly and survives a refresh, including from a
      subdirectory.
- [ ] Confirm the CSP does not break clipboard copy, text export, charts, or hash
      routing. `style-src-attr 'none'` requires that **no** inline `style`
      attribute is emitted; use the `.spaced-*` utilities instead.
- [ ] Confirm the favicon, social preview, and `robots.txt` are served.
- [ ] Do **not** add a sitemap until a canonical production domain exists.
- [ ] Confirm no third-party request is made from any page.

---

## E. Claims audit before launch

Read the entire UI and confirm none of these appears:

- [ ] a compatibility, marriage, or relationship score
- [ ] a prediction about the relationship's future
- [ ] a diagnosis, disorder name, or personality verdict
- [ ] a reliability or validity coefficient, norm, percentile, or cutoff
- [ ] a claim of professional review, endorsement, certification, or licensing
- [ ] a claim that the content is a validated Arabic instrument
- [ ] a promise of secrecy the browser cannot keep
- [ ] an invented emergency number or country-specific service

---

## F. Browser support statement

Baynana targets current versions of Chrome, Edge, Firefox, and Safari on desktop
and mobile, and requires:

- ES modules (`<script type="module">`)
- Optional chaining and nullish coalescing
- `Object.hasOwn`
- `Array.prototype.flat`
- `<dialog>` with `showModal()` — a `window.confirm` fallback is used where it is
  unavailable
- `localStorage` and `sessionStorage` — every access is wrapped in try/catch, so
  restrictive modes degrade rather than crash
- `navigator.clipboard.writeText` — a `document.execCommand("copy")` fallback and
  a manual-copy message are provided

JavaScript is required; a `noscript` notice explains why. Internet Explorer and
pre-2021 browsers are not supported.
