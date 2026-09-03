# Arabic content guide

The editorial standard for every user-facing string in Baynana. Code
identifiers, schema keys, and developer docs stay in English; everything a
reader sees is Arabic.

---

## 1. Voice

Baynana speaks like a careful, warm adult who is not selling anything.

- **Calm, not clinical.** "قد تمر إشارات الطلب الصغيرة دون أن تلاحظها" —
  not "ضعف في مهارات الاستجابة".
- **Descriptive, not diagnostic.** Describe what happens, not what a person *is*.
- **Second person singular for the individual, dual for the couple.** An
  assessment addresses one person (`أجب عن سلوكك أنت`). A shared activity
  addresses two (`اختارا سؤالًا واحدًا`).
- **Concrete over abstract.** Name the situation and the behavior. Avoid slogans.
- **Short sentences.** One idea per sentence. Long chains of clauses read as
  hedging.
- **No hype.** No exclamation marks, no "اكتشف الآن", no urgency.

---

## 2. Terminology

| Use | Instead of | Why |
|-----|-----------|-----|
| تقييم ذاتي إرشادي | اختبار نفسي / مقياس | "مقياس" implies a validated instrument |
| أداة تأمل أصلية مستندة إلى أدلة | أداة معتمدة | nothing here is certified |
| مؤشر مبلّغ عنه ذاتيًا | نتيجة / تشخيص | self-report is not a finding |
| خريطة توافق محايدة | اختبار توافق | maps record, they do not score |
| أولوية للحوار | علامة خطر / راية حمراء | a difference is a topic, not a warning |
| بداية مشتركة · قريبان | متطابقان | avoid implying sameness is the goal |
| لم نتحدث في هذا بعد | لا أعرف | names the couple's state, not a deficit |
| أفضل عدم الإجابة | تخطي | dignifies the choice |
| مجال يستحق التطوير | نقطة ضعف | growth framing |
| نقطة قوة محتملة | نقطة قوة مؤكدة | self-report cannot confirm |
| مختص محلي مؤهل | طبيب نفسي | broader and accurate across countries |
| خدمات الطوارئ المحلية | a specific number | never invent country numbers |

### Banned outright

`توافق مضمون` · `نسبة الحب` · `درجة الزواج` · `نسبة التوافق الكلية` ·
`شريك مثالي` · `احتمال نجاح الزواج` · `احتمال الانفصال` · `علاقة فاشلة` ·
`نرجسي مؤكد` · `سادي مؤكد` · `شخص سام` · `زوج طبيعي/غير طبيعي` ·
`مقياس مُقنَّن` · `معتمد سريريًا` · `موثّق من مختصين`

The content validators fail the build when these appear in data files.

### Never label a neutral preference

Preferences about children, faith, money, family expectations, career, location,
household roles, and intimacy are **decision topics**. They are never described
as صحي / غير صحي, طبيعي / غير طبيعي, ناضج / غير ناضج, or أفضل / أسوأ — not even
in a negated sentence, because the words themselves frame the topic wrongly.

---

## 3. Sensitive-language rules

**Safety content.** Coercion, threats, surveillance, humiliation, sexual
pressure, financial control, stalking, and fear are never written as playful or
compatibility content. Safety copy:

- addresses the person reading it privately, in the singular;
- never instructs them to confront the other person;
- never blames them or asks them to explain what happened;
- points to a trusted person, a qualified local professional, and local
  emergency services for immediate danger;
- never promises secrecy the browser cannot deliver.

**Intimacy content.** Adult-only, optional, skippable item by item. Asks about
expectations, preferences, consent, and privacy. Never about history, function,
performance, virginity, or bodies. Consent is described as necessary in every
context including marriage, and revocable at any moment.

**Trauma.** Never framed as something the reader owes anyone. Where a question
touches loss or a difficult past, it carries an explicit "لا داعي للتفاصيل إن لم
ترغب."

**Vulnerability.** Never framed as proof of love. Passing on a question is
always available and never needs a reason.

---

## 4. Inclusion rules

Do not assume the reader:

- is a man or a woman, or that a couple is a man and a woman;
- follows a particular religion or sect, or any religion;
- lives in a particular country, or in a house, or alone, or with family;
- has money, a car, a job, a degree, or children;
- can have children, or wants to;
- has parents living, or a family they are in contact with.

Do not assume that a man controls money or that a woman owns domestic work.
Household and financial items are written so either person can answer any of
them. Family involvement is treated as culturally variable — neither closeness
nor distance from family is presented as the correct arrangement.

---

## 5. Typography and RTL mechanics

- The document is `lang="ar" dir="rtl"`. Content is authored RTL-first.
- Use Arabic punctuation: `،` `؛` `؟` — never the Latin `,` `;` `?` in prose.
- Use `…` rather than `...`.
- Use `«»` for quoted UI phrases inside body copy.
- Write numbers as Western Arabic numerals (`18`, `240`) for counts and
  percentages, since they sit inside Arabic sentences without a direction
  conflict. Use Arabic-Indic numerals only for ordinal section markers in
  comments (`١`, `٢`) where no user reads them as data.
- Percentages use the Arabic percent sign `٪` after the number.
- **Any Latin or technical string** — a result code, a DOI, an ID — is wrapped in
  `<bdi dir="ltr">` via `isolatedCode()` in `assets/js/dom.js`, so a mixed
  Arabic/Latin line renders in the right order.
- Never concatenate a number and a unit across a direction boundary without
  isolation.
- Diacritics are used only where a word would otherwise be misread. Search
  normalization strips them, so their presence never breaks matching.

---

## 6. Search normalization

`normalizeArabic()` in `assets/js/dom.js` folds, **on a copy only**:

- Alef forms `أ إ آ ٱ` → `ا`
- Alef maqsura `ى` and Persian ya `ی` → `ي`
- Ta marbuta `ة` → `ه`
- Tatweel `ـ` → removed
- Harakat and tanwin → removed
- Arabic-Indic digits `٠-٩` → Western digits

The displayed source text is never mutated. A user typing `الاهل` finds
`الأهل`; a user typing `مسؤوليه` finds `مسؤولية`.

---

## 7. Editorial checklist

Before any new user-facing string ships:

- [ ] Written originally in Arabic, not translated from an English draft.
- [ ] Reads naturally when spoken aloud.
- [ ] No English words in the Arabic UI unless there is no Arabic equivalent.
- [ ] One idea per sentence; no sentence longer than about 25 words.
- [ ] No banned phrase from section 2.
- [ ] No neutral preference described as healthy, normal, or mature.
- [ ] No assumption from section 4.
- [ ] Arabic punctuation throughout; `…` not `...`.
- [ ] Latin/technical strings isolated with `bdi`.
- [ ] If sensitive: skippable, adult-gated where required, and never shared.
- [ ] If it makes a claim: the claim is supported by `data/sources.js`, or it is
      cut.
- [ ] Renders correctly at 320px width and at 200% text zoom.

---

## 8. Known editorial gaps

- No native-speaker editorial review has been performed. Some phrasing will read
  as stiff or region-specific to a native editor.
- Dialect coverage is untested. MSA was chosen for breadth, not warmth.
- Some option scales reuse a shared label set (`AGREE`, `FREQ`, `SHARE`) across
  maps for consistency; a reviewer should check that each reads naturally in its
  specific question rather than only in the abstract.

These are listed in `RELEASE_CHECKLIST.md` as blocking items for a public launch.
