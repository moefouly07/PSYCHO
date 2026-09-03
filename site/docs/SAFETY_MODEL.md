# Safety model

Safety outranks engagement everywhere in this product. Where the two conflict,
engagement loses.

---

## 1. What is treated as a safety matter

Not a difference in style — a safety matter:

- threats, or hinting at harm
- coercion that removes a real choice
- deliberate humiliation
- surveillance, or demanding access to devices, accounts, or location
- fear of the other person's reaction
- financial control or exploitation
- sexual pressure
- taking pleasure in the other person's distress
- behavior that puts either person at risk

These are never turned into playful compatibility content, a shared score, or a
conversation prompt that assumes a safe conversation is possible.

---

## 2. Three places safety is detected

### 2.1 Item-level risk flags (existing assessments)

Certain answer options carry a `risk` tag (`threats`, `coercion`,
`humiliation`, `surveillance`, `fear`, `financial-exploitation`,
`pleasure-in-distress`, `unsafe-behavior`). Selecting one raises the result to
`high` immediately, regardless of the aggregate. Implemented in
`assets/js/safety.js` → `evaluateSafety()`.

### 2.2 Dimension-level rules (assessment registry)

`safetyConfig(message, rules)` in `data/assessment-registry.js` attaches
threshold rules to specific dimensions. `trust-autonomy-boundaries` raises a
high-severity flag when `boundary_pressure` reaches 50% of the named indicator.

### 2.3 The private safety self-check

`#/safety/check` — eight short reflection items in `assets/js/safety.js`. This
is the only content in the product written specifically to ask about coercion,
and it is **private self-reflection only**.

---

## 3. The private-only guarantee

Private safety answers must never:

| Must never | Enforced by |
|---|---|
| be shared with the partner | never rendered outside `#/safety/check` |
| enter a couple score | not part of any scoring engine |
| enter the discussion agenda | `addAgendaEntry()` calls `assertNoSafetyContent()` |
| be encoded into a result code | `encodeAlignmentCode()` calls `assertNoSafetyContent()` on the **payload** |
| appear on a handoff screen | handoff views render no stored answer at all |
| be exported | agenda export text is passed through `assertNoSafetyContent()` |
| persist past the session | stored only under `baynana:v1:session:safety-check` in `sessionStorage` |

`assertNoSafetyContent(payload, context)` **throws** rather than filtering. A
leak is a bug that must fail loudly, not degrade silently. It is applied to the
payload *before* encoding, because a substring check on a Base64URL string
cannot see inside it — a mistake caught by `scripts/test-engines.mjs`.

Covering tests:

- `the safety guard refuses to release private safety content`
- `safety content cannot be encoded into an alignment code`
- `the safety self-check stays private and escalates on severity`
- `skipped safety items never count toward a level`

---

## 4. What happens when a threshold is triggered

The product:

1. **Suppresses playful compatibility language.** The shared view stops framing
   differences as an interesting comparison.
2. **Does not advise confrontation.** Copy explicitly says
   "لا تبدأ مواجهة إذا كنت تخشى رد الفعل."
3. **Prioritises private support** — a trusted person first, then a qualified
   local professional.
4. **Directs immediate danger to local emergency services**, without naming a
   number. Numbers differ by country and a wrong number costs time in an
   emergency. A test asserts no number is printed.
5. **Never blames the person experiencing harm**, and never asks them to justify
   or explain.
6. **Promises nothing the browser cannot deliver.** No claim of secrecy,
   untraceability, or deletion beyond what actually happens.

Severity levels: `none` → `caution` → `high`. `high` is reached by any single
item-level risk flag, by a triggered dimension rule, or in the self-check by one
"كثيرًا" answer or three or more flagged answers.

---

## 5. Quick exit

Available on every sensitive view via a persistent control, and by pressing
**Escape twice** within 900ms.

On activation it:

1. covers the page with a neutral opaque overlay immediately;
2. clears the namespaced `sessionStorage` keys and the in-memory challenge state;
3. calls `location.replace()` to a configurable neutral destination
   (`config.quickExitDestination`, default `https://www.wikipedia.org/`), so the
   current page does not remain in the back history.

**Escape never conflicts with dialogs.** The handler returns early when
`dialog[open]` exists, so Escape still dismisses an open dialog normally. This
matters for both accessibility and predictability.

### What quick exit cannot do — stated in the UI

- It does not erase browser history.
- It does not stop network monitoring or device monitoring software.
- It does not remove screenshots or clipboard history.
- It does not hide that the device was in use at that time.

A person who believes their device is monitored should use a different device.
The product says so.

---

## 6. Private mode

`#/privacy` offers a private mode that disables **all** persistent writes:
progress, results, pairings, favorites, discussed marks, summaries, agenda.
Session-only features keep working — that is the point.

The preference flag itself is stored so the choice survives a refresh, and the
UI says so. Turning private mode on does not delete what is already saved; the
UI says that too, and offers the delete controls next to it.

Honest limits stated in the UI: private mode does not hide activity from browser
history, network monitoring, or anyone with device access.

---

## 7. Handoff screens

Both the alignment same-device comparison and the knowledge challenge hand the
device between two people. Every handoff screen:

- renders **no** answer, prediction, or mark from the previous person;
- is a full-screen state, not a banner;
- says explicitly that the screen is blank on purpose;
- offers an exit that clears the session instead of continuing.

Because the router clears `#app` before rendering, the previous partner's
answers are removed from the DOM at the handoff, not merely hidden.

Covering tests: `handoff screen shows no answer from the first partner`,
`clearing the knowledge session leaves no way back into the answers`.

---

## 8. Deliberate non-features

- **No safety score.** A number would invite comparison and minimisation.
- **No risk prediction.** Nothing here forecasts what a person will do.
- **No labels.** The product never concludes that someone is an abuser, a
  narcissist, or dangerous. It describes reported behavior and stops.
- **No automated escalation.** Nothing is reported anywhere, because there is no
  server and no third party — and the UI does not imply otherwise.
- **No country-specific resources.** Inventing a hotline is worse than naming
  none.

---

## 9. Known limitations

1. Self-report cannot establish that someone is safe or unsafe. A person under
   coercion may answer to avoid consequences.
2. The eight self-check items are a prompt for reflection, not a screening
   instrument, and have no validation of any kind.
3. `location.replace()` removes the current entry but cannot clear the whole
   session history.
4. Nothing in a browser protects against a monitored device.
5. The safety copy has not been reviewed by a specialist in intimate-partner
   violence. That review is a blocking item in `RELEASE_CHECKLIST.md`.
