# Premarital coverage audit

Baseline recorded before any edit in this expansion:

```text
npm test
Assessment validation passed.
17 assessments · 102 dimensions · 306 questions · 918 answer options
Core scoring and pairing tests passed.
```

This document maps every pre-existing assessment onto the fourteen premarital
domains, records which domain each one can serve as a **canonical** module,
which gaps required new content, and where a duplication risk exists.

Legend for the "journey role" column:

- **canonical** — the single module the premarital journey links for that domain.
- **supporting** — offered as optional depth inside the domain, never as the domain itself.
- **outside journey** — kept in the assessment library, not mapped into the journey.

---

## 1. Existing assessments

| # | ID | Construct (Arabic title) | Six dimensions | Premarital domain | Journey role |
|---|----|--------------------------|----------------|-------------------|--------------|
| 1 | `emotional-clarity` | اختبار وضوح المشاعر — noticing, naming and expressing one's own emotional states | ملاحظة المشاعر · قراءة إشارات الجسد · تسمية المشاعر · تمييز المشاعر المتقاربة · فهم الأسباب والاحتياجات · التعبير العاطفي | D1 emotional responsiveness (self-side prerequisite) | supporting |
| 2 | `attachment-style` | اختبار نمط التعلق العاطفي — continuous anxiety/avoidance reading | أمان التعلق · قلق الفقد · طلب الطمأنينة المتكرر · الارتياح للقرب العاطفي · الثقة والاعتماد الصحي · الابتعاد التجنّبي | D1 + D5 (closeness, trust, dependence) | supporting |
| 3 | `conflict-style` | اختبار أسلوب إدارة الخلاف | التعاون · التعبير الحازم · الاستماع أثناء الخلاف · التنازل الصحي · الانسحاب والتجنب · التصعيد والسيطرة | **D3 conflict management and repair** | **canonical** |
| 4 | `emotional-communication` | اختبار التواصل العاطفي | قراءة الرسالة خلف الشعور · وضوح التعبير · الاستماع الفعّال · الاعتراف بمشاعر الآخر · التعبير عن الاحتياج والحدود · الإصلاح بعد سوء الفهم | **D2 constructive communication** | **canonical** |
| 5 | `partner-compatibility` | اختبار توافق الشريكين (profile mode, no aggregate) | القيم الأساسية · التواصل · القرب العاطفي · نمط الحياة · المال وتخطيط المستقبل · إصلاح الخلاف | Touches D8, D9, D10, D13 at a **shallow, scored** level | supporting only — superseded for decision topics by the alignment maps |
| 6 | `emotional-needs` | اختبار الاحتياجات العاطفية (profile mode) | الأمان والثبات · الانتباه والحضور · التقدير والاعتراف · الاستقلال والمساحة · الدعم العملي · المودة والقرب | D1 (what support each person wants) | supporting |
| 7 | `romantic-jealousy` | اختبار الغيرة العاطفية | الوعي بمثيرات الغيرة · تفسير التهديد · الثقة الأساسية · تنظيم الانفعال · سلوك المراقبة والتحقق · المصارحة المباشرة | D5 partial — trust and monitoring only | supporting |
| 8 | `empathy` | اختبار التعاطف | تبنّي وجهة نظر الآخر · المشاركة الوجدانية · الاهتمام الرحيم · الإنصات المنتبه · الحدود العاطفية · تنظيم الضيق الشخصي | D1 partial — understanding, not responding | supporting |
| 9 | `self-compassion` | اختبار التعاطف مع الذات | اللطف مع الذات · الحكم على الذات · الإنسانية المشتركة · الانعزال · الوعي المتوازن · الاندماج المفرط | D6 partial — self-directed coping | supporting |
| 10 | `resilience` | اختبار المرونة النفسية | التعافي بعد الانتكاسات · القدرة على التكيّف · المثابرة · تنظيم الانفعال · التفاؤل الواقعي · **طلب الدعم واستخدامه** | **D6 stress response, resilience, help-seeking** | **canonical** |
| 11 | `relationship-readiness` | اختبار الاستعداد لعلاقة صحية | التوافر العاطفي · الوعي بالذات · الحدود الصحية · الاستقلال العاطفي · التواصل والإصلاح · التوقعات الواقعية والالتزام | D7 partial (readiness), D5 partial (boundaries) | supporting |
| 12 | `anger-management` | اختبار إدارة الغضب | الوعي بالمثيرات · الإشارات الجسدية · ضبط الاندفاع · التعبير الحازم · التهدئة · الإصلاح وتحمّل المسؤولية | D3 partial — escalation control | supporting |
| 13 | `narcissistic-traits` | اختبار مؤشرات السمات النرجسية (risk mode) | طلب الإعجاب · الاستحقاق · فجوات التعاطف · الدفاعية · الاستغلال أو التحكم · التبادلية | Safety-adjacent; not a journey domain | outside journey |
| 14 | `cruelty-sadism-indicators` | اختبار مؤشرات القسوة والسلوك السادي (risk mode) | الهيمنة/الإذلال · اللامبالاة بالضيق · الفكاهة العدوانية · العقاب القسري · الندم · احترام الموافقة والحدود | Safety-adjacent | outside journey |
| 15 | `anxious-attachment` | اختبار التعلق القلق | الخوف من الهجر · فرط الانتباه للمسافة · طلب الطمأنة · سلوك الاحتجاج · صعوبة تهدئة الذات · الهوية والحدود | Deep dive under D1/D5 | supporting |
| 16 | `avoidant-attachment` | اختبار التعلق التجنبي | عدم الارتياح للاعتماد · كبت المشاعر · الانسحاب · الاعتماد المفرط على الذات · عدم الارتياح للحميمية · العودة والإصلاح | Deep dive under D1/D5 | supporting |
| 17 | `mahdi-claim-critical-thinking` | اختبار التفكير النقدي في ادعاءات المهدوية | جودة الأدلة · استقلال المصادر · قابلية الاختبار · التلاعب والإكراه · الأثر في الحياة · الاستعداد للمراجعة | Not a premarital domain | outside journey |

---

## 2. Domain-by-domain result

### Behavioral skill domains (scored assessments)

| Domain | Existing coverage | Decision |
|--------|-------------------|----------|
| D1 — Emotional responsiveness and support | `empathy` covers *understanding*; `emotional-needs` covers *what is wanted*; neither measures the **responding** behavior (noticing a bid, validating, delivering the support the partner actually asked for). | **New assessment** `partner-responsiveness` |
| D2 — Constructive communication | `emotional-communication` covers clarity, listening, acknowledgment, needs/boundaries, repair. Substantially complete. | **Reuse as canonical.** No new assessment — building one would duplicate it. |
| D3 — Conflict management and repair | `conflict-style` covers collaboration, assertiveness, listening, compromise, withdrawal, escalation. `anger-management` adds arousal control. | **Reuse `conflict-style` as canonical**, `anger-management` as supporting. |
| D4 — Collaborative decision-making | **Not covered.** No existing module asks how a decision is actually reached: information sharing, influence acceptance, veto handling, reversibility, follow-through. | **New assessment** `shared-decision-making` |
| D5 — Trust, autonomy, privacy, boundaries | `romantic-jealousy` covers trust and monitoring; `relationship-readiness` has one boundaries dimension. Autonomy, privacy expectations, device/social boundaries, and boundary repair are unowned. | **New assessment** `trust-autonomy-boundaries` |
| D6 — Stress response, resilience, caregiving, help-seeking | `resilience` covers recovery, adaptability, persistence, regulation, realistic optimism, and help-seeking. | **Reuse as canonical.** Residual gap noted below. |

### Neutral alignment domains (not scored — new engine)

None of the seventeen existing assessments can serve these domains, because every
existing module scores answers on a supportive/risk polarity. Preferences about
children, money, faith, household roles, or location are **decision topics, not
skill deficits**, so scoring them would be a category error. Each of D7–D14
therefore receives a new alignment map with neutral ordered options.

| Domain | New alignment map ID |
|--------|----------------------|
| D7 — Marriage expectations and commitment clarity | `marriage-expectations` |
| D8 — Core values, ethics, faith, spirituality, culture | `values-faith-culture` |
| D9 — Money, debt, saving, spending, family obligations | `money-and-obligations` |
| D10 — Household roles, standards, time, mental load | `home-and-mental-load` |
| D11 — Family of origin, in-laws, friends, social boundaries | `family-and-social-boundaries` |
| D12 — Children, fertility intentions, parenting | `children-and-parenting` |
| D13 — Career, education, location, migration, leisure | `work-place-lifestyle` |
| D14 — Affection, emotional intimacy, sexual expectations, consent, privacy | `affection-and-intimacy` |

`partner-compatibility` overlaps D8/D9/D10/D13 at a shallow level. It is **not**
deleted (its ID, routes, and stored results stay valid), but it is presented in
the journey as a supporting "quick profile" and the alignment maps are the
canonical modules for those decision topics. This is the main duplication risk in
the product and is handled by labelling, not by removal.

---

## 3. Gaps deliberately left open

1. **Dyadic coping / caregiving as a couple.** `resilience` measures individual
   stress response including help-seeking. A dedicated dyadic-coping module
   (how the pair copes *together*) would overlap `resilience` and
   `partner-responsiveness` by roughly two-thirds of its content, so it was not
   created. D6 is served by `resilience` as canonical with
   `partner-responsiveness` and `self-compassion` as supporting.
2. **Sexual function.** Out of scope. The intimacy alignment map covers
   expectations, consent, frequency preferences, and privacy — never function,
   history, or performance.
3. **Religious jurisprudence.** The values map records how much shared practice
   each person expects; it never rules on doctrine.

---

## 4. Duplication risks and how each is contained

| Risk | Containment |
|------|-------------|
| `partner-compatibility` vs. the eight alignment maps | Alignment maps are canonical for D7–D14. `partner-compatibility` is shown as a supporting scored profile and its copy states it is a quick overview, not a decision map. |
| `empathy` vs. new `partner-responsiveness` | `empathy` measures perspective-taking and felt concern. `partner-responsiveness` measures observable responding behavior. No dimension ID or item is shared. |
| `romantic-jealousy` vs. new `trust-autonomy-boundaries` | Jealousy measures threat appraisal and checking behavior. The new module measures autonomy tolerance, privacy expectations, boundary statement and repair. Monitoring behavior appears in `romantic-jealousy` only. |
| `conflict-style` vs. new `shared-decision-making` | Conflict is about disagreement heat and repair. Decision-making is about the process of reaching a joint choice, including reversibility and follow-through, and applies to decisions with no conflict at all. |
| `relationship-readiness` vs. `marriage-expectations` alignment map | Readiness is a scored skill self-report. The alignment map records neutral expectations (timing, ceremony, residence, commitment meaning) with no better/worse ordering. |
| Conversation library vs. assessments | Conversation questions carry no scoring fields at all; the validator rejects any scoring field on a conversation question. |

---

## 5. Net content change

| Layer | Before | After |
|-------|--------|-------|
| Behavioral assessments | 17 | 20 (all 17 original IDs untouched) |
| Alignment maps | 0 | 8 |
| Conversation categories / questions | 0 | 20 / 240 |
| Knowledge categories / items | 0 | 12 / 96 |
