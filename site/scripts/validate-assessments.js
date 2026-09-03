/*
 * Structural validator for scored behavioral assessments.
 *
 * The product may grow, so the count of assessments is NOT pinned. What is
 * pinned is the original required set: those seventeen IDs and titles must keep
 * working forever, because stored results, saved routes, and shared BN1 codes
 * reference them.
 */
import { loadBrowserData, report } from "./lib/load-data.mjs";

const errors = [];
const warnings = [];
const win = loadBrowserData(errors);
const data = win.BAYNANA_DATA;
if (!data) errors.push("window.BAYNANA_DATA was not created");

/* The original seventeen. Never remove an entry from this list. */
const requiredIds = [
  "emotional-clarity",
  "attachment-style",
  "conflict-style",
  "emotional-communication",
  "partner-compatibility",
  "emotional-needs",
  "romantic-jealousy",
  "empathy",
  "self-compassion",
  "resilience",
  "relationship-readiness",
  "anger-management",
  "narcissistic-traits",
  "cruelty-sadism-indicators",
  "anxious-attachment",
  "avoidant-attachment",
  "mahdi-claim-critical-thinking"
];

const requiredTitles = {
  "emotional-clarity": "اختبار وضوح المشاعر",
  "attachment-style": "اختبار نمط التعلق العاطفي",
  "conflict-style": "اختبار أسلوب إدارة الخلاف",
  "emotional-communication": "اختبار التواصل العاطفي",
  "partner-compatibility": "اختبار توافق الشريكين",
  "emotional-needs": "اختبار الاحتياجات العاطفية",
  "romantic-jealousy": "اختبار الغيرة العاطفية",
  empathy: "اختبار التعاطف",
  "self-compassion": "اختبار التعاطف مع الذات",
  resilience: "اختبار المرونة النفسية",
  "relationship-readiness": "اختبار الاستعداد لعلاقة صحية",
  "anger-management": "اختبار إدارة الغضب",
  "narcissistic-traits": "اختبار مؤشرات السمات النرجسية في العلاقة",
  "cruelty-sadism-indicators": "اختبار مؤشرات القسوة والسلوك السادي",
  "anxious-attachment": "اختبار التعلق القلق",
  "avoidant-attachment": "اختبار التعلق التجنبي",
  "mahdi-claim-critical-thinking": "اختبار التفكير النقدي في ادعاءات المهدوية",
  "partner-responsiveness": "اختبار الاستجابة والدعم",
  "shared-decision-making": "اختبار اتخاذ القرار المشترك",
  "trust-autonomy-boundaries": "اختبار الثقة والاستقلال والحدود"
};

const bannedPhrases = [
  "اكتشف المهدي المنتظر",
  "نرجسي مؤكد",
  "سادي مؤكد",
  "احتمال نجاح الزواج",
  "نسبة الحب",
  "ضمان التوافق",
  "احتمال الانفصال",
  "درجة الزواج",
  "نسبة التوافق الكلية",
  "شريك مثالي",
  "توافق مضمون",
  "مقياس مُقنَّن",
  "معتمد سريريًا",
  "موثّق من مختصين"
];

const validPolarities = new Set(["positive", "negative"]);
const validScoreModes = new Set(["skill", "profile", "risk", "attachment", "critical-thinking"]);

if (data) {
  const tests = data.tests || [];
  const ids = tests.map((test) => test.id);

  if (tests.length < requiredIds.length) {
    errors.push(`Expected at least ${requiredIds.length} assessments, found ${tests.length}`);
  }
  if (new Set(ids).size !== ids.length) errors.push("Assessment IDs are not unique");
  requiredIds.forEach((id) => {
    if (!ids.includes(id)) errors.push(`Missing required assessment: ${id}`);
  });

  const categoryNames = (data.categories || []).map((category) => category.name);
  const expectedCategoryNames = [
    "فهم الذات",
    "أنماط التعلق",
    "التواصل والخلاف",
    "الاحتياجات والتوافق",
    "السمات والسلوكيات",
    "المعتقدات والتفكير النقدي"
  ];
  if (categoryNames.length !== 6 || expectedCategoryNames.some((name) => !categoryNames.includes(name))) {
    errors.push("The six required Arabic categories are not present exactly");
  }

  let questionCount = 0;
  let optionCount = 0;
  let dimensionCount = 0;
  let highestLongest = 0;

  tests.forEach((test) => {
    if (requiredTitles[test.id] && requiredTitles[test.id] !== test.title) {
      errors.push(`${test.id}: unexpected Arabic title`);
    }
    if (test.partner !== true) errors.push(`${test.id}: partner workflow must be enabled`);
    if (!data.categories.some((category) => category.id === test.category)) errors.push(`${test.id}: invalid category ${test.category}`);
    if (!validScoreModes.has(test.scoreMode)) errors.push(`${test.id}: unknown scoreMode ${test.scoreMode}`);
    if (!test.disclaimer || test.disclaimer.length < 40) errors.push(`${test.id}: missing or short disclaimer`);
    if (!Array.isArray(test.instructions) || test.instructions.length < 3) errors.push(`${test.id}: missing instructions`);
    if (!Array.isArray(test.bands) || test.bands.length !== 4) {
      if (test.scoreMode !== "profile") errors.push(`${test.id}: expected 4 descriptive bands`);
    }
    if (!Array.isArray(test.dimensions) || test.dimensions.length !== 6) errors.push(`${test.id}: expected 6 dimensions`);
    if (!Array.isArray(test.questions) || test.questions.length !== 18) errors.push(`${test.id}: expected 18 questions`);
    questionCount += test.questions?.length || 0;
    dimensionCount += test.dimensions?.length || 0;

    const dimensionIds = new Set((test.dimensions || []).map((dimension) => dimension.id));
    if (dimensionIds.size !== 6) errors.push(`${test.id}: dimension IDs are not unique`);

    for (const dimension of test.dimensions || []) {
      const count = (test.questions || []).filter((question) => question.dim === dimension.id).length;
      if (count !== 3) errors.push(`${test.id}/${dimension.id}: expected 3 questions, found ${count}`);
      if (!validPolarities.has(dimension.polarity)) {
        errors.push(`${test.id}/${dimension.id}: polarity must be "positive" or "negative"`);
      }
      if (!dimension.interp?.low || !dimension.interp?.developing || !dimension.interp?.strong) {
        errors.push(`${test.id}/${dimension.id}: missing dimension-specific interpretations`);
      }
      /* The three interpretation levels must be genuinely different text. */
      const texts = [dimension.interp?.low, dimension.interp?.developing, dimension.interp?.strong];
      if (new Set(texts).size !== 3) errors.push(`${test.id}/${dimension.id}: interpretation levels are not distinct`);
      if (!dimension.tip) errors.push(`${test.id}/${dimension.id}: missing practical tip`);
      if (!dimension.desc) errors.push(`${test.id}/${dimension.id}: missing description`);
      if (!dimension.pair?.gap || !dimension.pair?.bothLow || !dimension.pair?.bothHigh) {
        errors.push(`${test.id}/${dimension.id}: missing two-person comparison copy`);
      }
    }

    const questionIds = new Set();
    for (const question of test.questions || []) {
      if (questionIds.has(question.id)) errors.push(`${test.id}: duplicate question ID ${question.id}`);
      questionIds.add(question.id);
      if (!dimensionIds.has(question.dim)) errors.push(`${test.id}/${question.id}: unknown dimension ${question.dim}`);
      if (!question.prompt || question.prompt.length < 10) errors.push(`${test.id}/${question.id}: prompt is too short`);
      if (!Array.isArray(question.options) || question.options.length !== 3) {
        errors.push(`${test.id}/${question.id}: expected 3 options`);
        continue;
      }
      optionCount += question.options.length;
      const scores = question.options.map((option) => option.s).sort((a, b) => a - b);
      if (scores.join(",") !== "0,1,2") errors.push(`${test.id}/${question.id}: option scores must be 0, 1, and 2 exactly once`);
      if (question.options.some((option) => !option.t || option.t.length < 4)) errors.push(`${test.id}/${question.id}: option text is missing or too short`);
      const longest = Math.max(...question.options.map((option) => option.t.length));
      const highest = question.options.find((option) => option.s === 2);
      if (highest && highest.t.length === longest) highestLongest += 1;
    }
  });

  if (questionCount !== tests.length * 18) errors.push(`Expected ${tests.length * 18} questions, found ${questionCount}`);
  if (optionCount !== questionCount * 3) errors.push(`Expected ${questionCount * 3} options, found ${optionCount}`);
  if (highestLongest / Math.max(questionCount, 1) > 0.65) {
    warnings.push(`Score-2 option is longest in ${highestLongest}/${questionCount} questions`);
  }

  const visibleData = JSON.stringify({
    config: data.config,
    tests: tests.map(({ id, title, short, disclaimer, dimensions, questions, bands, notes }) =>
      ({ id, title, short, disclaimer, dimensions, questions, bands, notes }))
  });
  bannedPhrases.forEach((phrase) => {
    if (visibleData.includes(phrase)) errors.push(`Banned phrase found: ${phrase}`);
  });

  const sourceMap = data.sources?.byAssessment || {};
  ids.forEach((id) => {
    const entry = sourceMap[id];
    const refs = Array.isArray(entry) ? entry : entry?.references;
    if (!Array.isArray(refs) || !refs.length) errors.push(`${id}: missing verified scientific source entry`);
    for (const ref of refs || []) {
      if (!/^https:\/\//.test(ref.url || ref.href || "")) errors.push(`${id}: invalid source URL`);
    }
  });

  report("Assessment validation", errors, warnings, [
    `${tests.length} assessments · ${dimensionCount} dimensions · ${questionCount} questions · ${optionCount} answer options`,
    `${requiredIds.length} original required IDs present and unchanged`
  ]);
} else {
  report("Assessment validation", errors, warnings);
}
