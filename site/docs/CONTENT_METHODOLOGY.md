# Content methodology

How Baynana's content was built, what each engine does, and — just as
importantly — what this product must never claim.

---

## 1. How constructs were selected

The fourteen premarital domains were assembled from three inputs:

1. **The domain list published by established premarital programs.** The
   PREPARE/ENRICH public description of its assessment areas was used as a
   *checklist of topics couples are commonly advised to discuss*. Only the topic
   list informed us. No item, wording, scale, scoring rule, or report structure
   was taken, because that instrument is proprietary and no licence was sought
   or granted.
2. **Primary research on specific couple processes**, where a construct is well
   described in the literature: perceived partner responsiveness, constructive
   communication and conflict repair, decision clarity versus drift, financial
   conflict, and perceived fairness in household labour. These informed which
   *behaviors* a scored assessment should ask about.
3. **A coverage audit of what already existed.** Before writing anything, every
   one of the seventeen original assessments was mapped onto the fourteen
   domains (see `PREMARITAL_COVERAGE.md`). Only four domains were genuinely
   uncovered by a behavioral module, and three new assessments were written for
   three of them. Domain 6 reuses the existing `resilience` assessment rather
   than duplicating it.

The bar for writing a new assessment was deliberately high: **if an existing
module substantially covers a construct, it is reused.** Two modules that
measure essentially the same thing would inflate the product and give a false
impression of breadth.

---

## 2. How original questions were written

Every item is original Arabic text written for this project. The rules applied:

- Ask about **observable behavior in a described situation**, not identity.
  "حين يطلب الحديث وأنت في ذروة ضغط عملك، ماذا تفعل؟" — not "هل أنت شخص متاح؟"
- One construct per question. No double-barrelled items.
- No "دائمًا" / "أبدًا" absolutes, and no moralising wording.
- Answer choices are three realistic behaviors, not an obvious good/bad pair.
  A reader should be able to imagine a reasonable person choosing any of them.
- Hidden scores (`0`, `1`, `2`) are never displayed, and displayed option order
  is randomized per session while the hidden score order is preserved.
- No assumption of the reader's gender, religion, sect, nationality, income,
  education, living arrangement, sexual orientation, or family structure.
- Culturally recognisable situations are used (family visits, expectations
  around the wedding, support for parents) without presenting one culture's
  arrangement as the correct one.
- "أفضل عدم الإجابة" is offered wherever sensitivity requires it, and a skipped
  answer is never silently scored.

The same rules were applied to alignment items, conversation questions, and
knowledge items, with the differences described below.

**No item was copied, translated, back-translated, or closely paraphrased from
PREPARE/ENRICH, any Gottman product, the CSI, ECR-R, DAS, or any other published
instrument.** Published measures informed the *construct map* only.

---

## 3. How the four engines differ

| | Behavioral assessment | Alignment map | Conversation | Knowledge challenge |
|---|---|---|---|---|
| What it records | how often a behavior happens | which option a person prefers | nothing | one session's answers and predictions |
| Scored | yes, 0/1/2 per item | **no** | **no** | yes, but only within the session |
| Polarity | explicit positive/negative | **none** | none | none |
| Aggregate | six dimension percentages | none | none | two separate direction percentages |
| Comparison | dimension gaps | same / close / different / not discussed / private | none | per-direction counts |
| Persistence | localStorage | localStorage (answers stay on the device) | question IDs only | sessionStorage only |

The four are visually and textually distinguished throughout the UI, and the
journey page carries an explicit legend saying they are **not** scientifically
equivalent.

### Why alignment maps are not scored

A scored dimension needs a defensible "more of this is better" direction. For
children, faith, money, in-laws, household roles, location, and intimacy, no
such direction exists. Wanting three children is not better or worse than
wanting none; preferring separate finances is not a deficit. Scoring these would
manufacture a verdict out of a preference.

So alignment maps carry:

- no polarity field (the validator rejects one),
- no supportive/risk value,
- no percentage of any kind, and
- no overall compatibility number.

Each eligible item is classified only as:

```text
ordered items    distance 0 → same
                 distance 1 → close
                 distance 2+ → different
nominal items    equal → same
                 otherwise → different      (closeness is never invented)
either           "لم نتحدث في هذا بعد" → not yet discussed
                 "أفضل عدم الإجابة"     → private, excluded
```

If two answers differ **and** either partner marked the topic as important or
essential, the topic is labelled a **priority conversation** — not a red flag,
not a warning, not a risk.

### Why differences are not deficits

The product's language is deliberate. It says "أولوية للحوار", "لم نتحدث في هذا
بعد", "بداية مشتركة". It does not say "healthy", "unhealthy", "normal",
"abnormal", "red flag", "perfect match", or "compatibility score". The
copy validators reject those phrases in content files.

---

## 4. How the knowledge challenge is scored

Two directions are scored **separately** and never combined:

```text
B's recognition of A   from A's self-answers, B's predictions, A's review marks
A's recognition of B   from B's self-answers, A's predictions, B's review marks
```

The reviewer — the person the item is about — has the final say on every mark:

| Mark | Value | In denominator |
|------|-------|----------------|
| دقيق (accurate) | 1 | yes |
| قريب بما يكفي (close) | 0.5 | yes |
| مختلف (different) | 0 | yes |
| غامض أو لم يعد يصفني | — | **no** |
| خاص | — | **no** |

An automatic suggestion is offered (exact = accurate; adjacent on an explicitly
ordered item = close; otherwise different), but the reviewer can always override
it. "لست متأكدًا" and "أفضل عدم الإجابة" are excluded from the denominator
entirely.

**Zero-denominator guard:** if no item remains eligible, the percentage is
`null` and the UI says so in words rather than displaying `0%`. A session where
everything was skipped is not a bad score; it is nothing to score.

**Category detail is withheld** unless at least three eligible items exist in
that category, so no number is shown that cannot bear interpretation.

**Confidence is for reflection only.** A high-confidence miss is surfaced as
"افتراضات تستحق مراجعة". No calibration index is computed or displayed, because
a clinical-looking calibration number from a dozen items would be meaningless.

---

## 5. Cultural and Arabic-language limitations

- The content is Modern Standard Arabic aimed at a broad Arabic-speaking
  audience. It will read slightly formally in some dialect contexts.
- Situations were chosen to be recognisable across several Arabic-speaking
  societies, but norms around family involvement, wedding expectations, housing,
  and financial obligation vary enormously. The maps therefore **record** those
  expectations instead of judging them.
- Religious practice is treated as a variable, not a constant. Religious and
  non-religious users are both addressed without dismissing either.
- The intimacy module is optional, adult-only, skippable item by item, and asks
  about expectations and consent only — never history, function, or performance.
- No cognitive interviews have been run. Some items will be understood
  differently than intended in some dialects and communities. This is a real
  limitation, not a formality.

---

## 6. Self-report limitations

Everything here is self-report, and self-report:

- reflects how a person sees themself today, which may differ from how they
  behave, and from how a partner experiences them;
- shifts with mood, recent events, fatigue, and who might read the answer;
- is vulnerable to socially desirable answering, especially on sensitive items;
- cannot establish that a behavior happened, or that a person is safe.

The product says this in the UI, not only here.

---

## 7. What validation would actually require

To claim anything stronger than "evidence-informed and original", this content
would need, at minimum:

1. **Cognitive interviews** with Arabic-speaking adults across several dialects
   to confirm each item is understood as intended.
2. **Item analysis** on a real sample: response distributions, item-total
   correlations, and removal of items that do not behave.
3. **Reliability estimates** for each dimension.
4. **Validity evidence** — convergent and discriminant, against measures that
   are themselves validated in Arabic.
5. **Measurement invariance** testing across gender, country, and religiosity
   before comparing groups.
6. **Norms**, if any band label is ever to mean more than a descriptive range.

The ITC Guidelines for Translating and Adapting Tests describe the procedures
required before a translated or adapted instrument can be treated as equivalent
to its source. None of these steps has been performed.

---

## 8. Claims this product must never make

Baynana must never state or imply that it:

- diagnoses a person or a relationship, or measures mental illness;
- certifies compatibility, or produces a marriage or compatibility score;
- predicts marriage success, divorce, infidelity, or violence;
- identifies a narcissist, an abuser, an ideal spouse, or a "toxic" person;
- provides medical, psychological, legal, religious, or financial advice;
- is a validated Arabic psychological instrument;
- substitutes for premarital counselling, couples therapy, or professional support;
- has been reviewed, approved, endorsed, or certified by any professional or body.

It may state that its content is **original and evidence-informed**. That is the
ceiling until the human reviews in `RELEASE_CHECKLIST.md` are complete.

Reliability coefficients, validity coefficients, norms, percentiles, clinical
thresholds, statistical claims, professional endorsements, expert-review claims,
licences, permissions, and citations were **not invented anywhere in this
project.** `scripts/validate-sources.js` fails the build if such a claim appears
in the source data.
