# Legacy assessment recovery audit — 2026-09-03

This document exists because a task assumed the original 17-assessment
library had been accidentally deleted and needed reconstruction from git
history and the pre-rebuild archive. The forensic audit below found that
**assumption did not hold**: nothing was deleted. This records the evidence,
so the question does not need re-investigating from scratch next time it
comes up.

## 1. What the audit checked

The working repository root is `D:\PSYCHO` (remote `github.com/moefouly07/PSYCHO`,
branch `master`). Its git history is a single squashed "Initial commit" —
there is no prior commit history to mine for deleted content, so recovery
had to be evidence-based against what the repository actually contains:
the live data files, the pre-rebuild archive, and the automated validators.

```
git log --all --oneline    → one commit: 6ed72ed "Initial commit: بيننا..."
git reflog                 → same single commit, nothing dangling
```

Because there is no deeper history, the archive at
`_archive/pre-baynana-rebuild-2026-08-01/` is the only independent copy of
the pre-rebuild state, and it was compared line-by-line against the live
`data/tests.js`.

## 2. Finding: the legacy 17 are present, unchanged, and validated

Running the existing validator against the live data:

```
node scripts/validate-assessments.js
Assessment validation passed.
20 assessments · 120 dimensions · 360 questions · 1080 answer options
17 original required IDs present and unchanged
```

`scripts/validate-assessments.js` already pins the 17 original IDs and their
exact Arabic titles (it has done so since before this audit — see the
`requiredIds` / `requiredTitles` constants in that file) and fails the build
if any go missing or get renamed. The math matches the legacy baseline
exactly:

- 17 legacy assessments × 6 dimensions × 18 questions × 3 options
  = 102 dimensions, 306 questions, 918 options — the historical baseline.
- Plus 3 assessments added for the premarital journey
  (`partner-responsiveness`, `shared-decision-making`,
  `trust-autonomy-boundaries`) × the same shape
  = 18 more dimensions, 54 more questions, 162 more options.
- 20 × 6 × 18 × 3 = **120 dimensions, 360 questions, 1080 options** — exactly
  what the validator reports today.

### Where each of the 17 legacy assessments lives

| # | ID | File |
|---|----|------|
| 1 | `emotional-clarity` | `data/tests.js` |
| 2 | `attachment-style` | `data/tests.js` |
| 3 | `conflict-style` | `data/tests.js` |
| 4 | `emotional-communication` | `data/tests.js` |
| 5 | `partner-compatibility` | `data/tests.js` |
| 6 | `emotional-needs` | `data/tests.js` |
| 7 | `romantic-jealousy` | `data/tests.js` |
| 8 | `empathy` | `data/tests.js` |
| 9 | `self-compassion` | `data/tests.js` |
| 10 | `resilience` | `data/tests.js` |
| 11 | `relationship-readiness` | `data/tests.js` |
| 12 | `anger-management` | `data/tests.js` |
| 13 | `narcissistic-traits` | `data/additional-tests.js` |
| 14 | `cruelty-sadism-indicators` | `data/additional-tests.js` |
| 15 | `anxious-attachment` | `data/additional-tests.js` |
| 16 | `avoidant-attachment` | `data/additional-tests.js` |
| 17 | `mahdi-claim-critical-thinking` | `data/additional-tests.js` |

Each carries its original six dimensions (three questions per dimension,
three scored options 0/1/2 per question), original polarity, original
interpretation copy (low/developing/strong), a practical tip, two-person
comparison copy where `partner: true`, and a mapped scientific source entry
in `data/sources.js`. Every example the task's screenshots referenced —
"الأمان والثبات", "الانتباه والحضور", "التقدير والاعتراف", "الاستقلال
والمساحة", "الدعم العملي", "المودة والقرب" (all six dimensions of
`emotional-needs`), and "التعاون في حل الخلاف", "التعبير الحازم", "الاستماع
أثناء الخلاف", "التوازن الصحي" (`compromise`), "الانسحاب والتجنب"
(negative), "التصعيد والسيطرة" (negative) (all six dimensions of
`conflict-style`) — is present in the live data with the described polarity.

The three added assessments (`partner-responsiveness`,
`shared-decision-making`, `trust-autonomy-boundaries`) live in
`data/premarital/skill-assessments.js` and were built for the premarital
journey; they are not part of the legacy 17 and are tracked separately.

## 3. Why this could look like a deletion happened

Two things in the project's history plausibly caused the belief that content
was lost, even though the data itself was never removed:

1. **A homepage/visual-shell rebuild** (tracked separately, see the site's
   CSS/homepage commits) changed the *site around* the assessments —
   colors, layout, navigation — without touching `data/tests.js` or
   `data/additional-tests.js`. A visually very different site can read as
   "things are missing" even when the underlying content list is unchanged.
2. **The git remote changed** from `moefouly07/PSYCHOO` (a repository that
   now returns "Repository not found" on fetch) to `moefouly07/PSYCHO`, with
   history squashed into a single initial commit. Anyone who last looked at
   the old remote, or at a stale deployment pointed at it, would see a
   different (or broken) state than what `D:\PSYCHO\site` currently
   contains — but that is a hosting/remote issue, not a content-loss issue.

## 4. Regression protection added by this audit

`scripts/validate-assessments.js` already protected the *set* of 17 IDs,
titles, and structural shape (6 dimensions × 18 questions × 3 options,
scores 0/1/2, distinct interpretation levels, comparison copy, source
mapping). It did **not** protect against a dimension being silently
renamed, a negative dimension's polarity being flipped (which would invert
how a risk indicator reads without breaking any existing check), or a
question being reassigned to the wrong dimension while every count still
balanced.

This audit added:

- **`scripts/lib/legacy-fingerprint.mjs`** — a pinned snapshot, captured
  from the live data on 2026-09-03, of every assessment's exact dimension
  IDs, their polarity, and the exact question-ID set belonging to each
  dimension.
- **`scripts/validate-legacy-preservation.js`** — compares live data against
  that fingerprint on every `npm run validate` / `npm test` and fails with a
  specific, named error (which assessment, which dimension, old value vs.
  new value) if any of it drifts. It also fails if a new assessment is added
  without being added to the fingerprint, so the guard cannot silently go
  stale.

A deliberate mismatch is not a bug in the checker — it means the data
changed. Before editing the fingerprint to match, confirm the change was
intentional.

## 5. What is genuinely new vs. recovered

Nothing needed reconstruction, so there is no "recovered with lower
confidence" or "unrecoverable, reconstructed" content to flag — every
legacy item is the original. The only new content in the assessment library
is the three premarital-journey assessments listed above, which were
designed for this project and are documented as new in
`docs/PREMARITAL_COVERAGE.md` and `docs/CONTENT_METHODOLOGY.md`.

See `docs/PREMARITAL_COVERAGE.md` for how all 20 assessments map onto the
fourteen premarital journey domains (canonical / supporting / kept outside
the couple journey for safety-scope reasons), and `docs/SAFETY_MODEL.md` for
the safety gating applied to the sensitive assessments
(`romantic-jealousy`, `anger-management`, `narcissistic-traits`,
`cruelty-sadism-indicators`, `mahdi-claim-critical-thinking`).
