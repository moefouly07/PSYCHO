/*
 * The premarital journey registry.
 *
 * Maps the fourteen premarital domains onto canonical modules. A module is one
 * of four clearly distinct content kinds, and the registry never treats them as
 * scientifically equivalent:
 *
 *   assessment   scored behavioral self-report  (six dimensions, 0/1/2 items)
 *   alignment    neutral preference map         (no score of any kind)
 *   conversation non-scored question activity
 *   knowledge    same-device recognition game
 *
 * Existing assessments are REUSED here. Nothing is duplicated: see
 * docs/PREMARITAL_COVERAGE.md for the audit behind every mapping.
 */
(function () {
  "use strict";

  var SCHEMA_VERSION = 1;
  var CONTENT_VERSION = 1;

  var data = window.BAYNANA_DATA;
  var alignment = window.BAYNANA_ALIGNMENT;
  if (!data || !alignment) {
    throw new Error("assessment-registry.js and alignment-maps.js must load before premarital/registry.js");
  }

  var testsById = Object.create(null);
  data.tests.forEach(function (test) { testsById[test.id] = test; });

  var mapsById = Object.create(null);
  alignment.maps.forEach(function (map) { mapsById[map.id] = map; });

  var KINDS = [
    {
      id: "assessment",
      label: "تقييم سلوكي",
      short: "تقييم",
      description: "تقييم ذاتي إرشادي لمهارة سلوكية، بستة أبعاد ونسب وصفية. ليس تشخيصًا ولا أداة مُقنّنة.",
      scored: true
    },
    {
      id: "alignment",
      label: "خريطة توافق محايدة",
      short: "خريطة",
      description: "تسجيل تفضيلات وخطط بلا درجات وبلا إجابة أفضل. الاختلاف هنا موضوع قرار لا نقص.",
      scored: false
    },
    {
      id: "conversation",
      label: "نشاط حواري",
      short: "حوار",
      description: "أسئلة للحديث لا تُحسب ولا تُقارن ولا تُخزَّن إجاباتها.",
      scored: false
    },
    {
      id: "knowledge",
      label: "تحدٍّ على جهاز واحد",
      short: "تحدٍّ",
      description: "لعبة تعرّف على إجابات هذه الجلسة فقط. لا تقيس الحب ولا التوافق ولا جودة العلاقة.",
      scored: false
    }
  ];

  function assessmentModule(domain, id, options) {
    var test = testsById[id];
    if (!test) throw new Error("Unknown assessment in premarital registry: " + id);
    return {
      key: "assessment:" + id,
      kind: "assessment",
      refId: id,
      domain: domain,
      title: test.title,
      short: test.short,
      minutes: test.minutes || 7,
      track: "skill",
      sensitivity: (options && options.sensitivity) || "standard",
      optional: Boolean(options && options.optional),
      route: "#/assessment/" + encodeURIComponent(id)
    };
  }

  function alignmentModule(domain, id, options) {
    var map = mapsById[id];
    if (!map) throw new Error("Unknown alignment map in premarital registry: " + id);
    return {
      key: "alignment:" + id,
      kind: "alignment",
      refId: id,
      domain: domain,
      title: map.title,
      short: map.short,
      minutes: map.minutes || 8,
      track: "decision",
      sensitivity: map.sensitivity || "standard",
      optional: Boolean(map.optional || (options && options.optional)),
      adultOnly: Boolean(map.adultOnly),
      route: "#/premarital/align/" + encodeURIComponent(id)
    };
  }

  /* The fourteen domains, in the recommended order. Order is a suggestion only:
     every module opens directly and nothing is locked. */
  var domains = [
    {
      number: 1,
      id: "responsiveness",
      title: "الاستجابة والدعم",
      description: "كيف تصل إشارة الطلب، وكيف يصل الدعم بالشكل المطلوب.",
      track: "skill",
      canonical: assessmentModule(1, "partner-responsiveness"),
      supporting: ["empathy", "emotional-needs", "emotional-clarity"]
    },
    {
      number: 2,
      id: "communication",
      title: "التواصل البنّاء",
      description: "وضوح التعبير والإنصات والاعتراف والإصلاح بعد سوء الفهم.",
      track: "skill",
      canonical: assessmentModule(2, "emotional-communication"),
      supporting: ["emotional-clarity"]
    },
    {
      number: 3,
      id: "conflict",
      title: "إدارة الخلاف والإصلاح",
      description: "ما يحدث أثناء الخلاف وبعده: التعاون والحزم والتهدئة والعودة.",
      track: "skill",
      canonical: assessmentModule(3, "conflict-style"),
      supporting: ["anger-management"]
    },
    {
      number: 4,
      id: "decisions",
      title: "القرار المشترك",
      description: "كيف يُتخذ القرار: المعلومات والبدائل وقبول التأثير والمراجعة.",
      track: "skill",
      canonical: assessmentModule(4, "shared-decision-making"),
      supporting: []
    },
    {
      number: 5,
      id: "trust",
      title: "الثقة والاستقلال والحدود",
      description: "تسمية الحدود واحترامها، والخصوصية، وإصلاح الثقة.",
      track: "skill",
      canonical: assessmentModule(5, "trust-autonomy-boundaries", { sensitivity: "personal" }),
      supporting: ["romantic-jealousy", "relationship-readiness"]
    },
    {
      number: 6,
      id: "stress",
      title: "الضغط والمرونة وطلب الدعم",
      description: "التعافي والتكيّف وتنظيم الانفعال وطلب الدعم واستخدامه.",
      track: "skill",
      canonical: assessmentModule(6, "resilience"),
      supporting: ["self-compassion", "partner-responsiveness"]
    },
    {
      number: 7,
      id: "marriage",
      title: "توقعات الزواج ووضوح الالتزام",
      description: "التوقيت والمعنى والاحتفال والسكن ومراجعة التوقعات.",
      track: "decision",
      canonical: alignmentModule(7, "marriage-expectations"),
      supporting: ["relationship-readiness"]
    },
    {
      number: 8,
      id: "values",
      title: "القيم والدين والثقافة",
      description: "القيم والممارسة والعادات، والتعامل مع اختلاف القناعة.",
      track: "decision",
      canonical: alignmentModule(8, "values-faith-culture"),
      supporting: []
    },
    {
      number: 9,
      id: "money",
      title: "المال والالتزامات",
      description: "تنظيم المال والإنفاق والادخار والدين والتزامات الأهل.",
      track: "decision",
      canonical: alignmentModule(9, "money-and-obligations"),
      supporting: ["partner-compatibility"]
    },
    {
      number: 10,
      id: "home",
      title: "البيت والوقت والعبء الذهني",
      description: "تقسيم المهام والمعايير والتخطيط والإنصاف.",
      track: "decision",
      canonical: alignmentModule(10, "home-and-mental-load"),
      supporting: ["partner-compatibility"]
    },
    {
      number: 11,
      id: "family",
      title: "الأهل والأصدقاء والحدود",
      description: "مساحة الأهل والزيارات والخصوصية والأصدقاء ومن يضع الحد.",
      track: "decision",
      canonical: alignmentModule(11, "family-and-social-boundaries"),
      supporting: []
    },
    {
      number: 12,
      id: "children",
      title: "الأطفال والإنجاب والتربية",
      description: "الرغبة والتوقيت والعدد والمسارات البديلة وأسلوب التربية.",
      track: "decision",
      canonical: alignmentModule(12, "children-and-parenting"),
      supporting: []
    },
    {
      number: 13,
      id: "work",
      title: "العمل والمكان ونمط الحياة",
      description: "الطموح والتعليم والانتقال والتوازن والترفيه والعادات.",
      track: "decision",
      canonical: alignmentModule(13, "work-place-lifestyle"),
      supporting: ["partner-compatibility"]
    },
    {
      number: 14,
      id: "intimacy",
      title: "المودة والحميمية والموافقة",
      description: "المودة والقرب والتوقعات والموافقة والخصوصية. وحدة اختيارية للبالغين.",
      track: "decision",
      canonical: alignmentModule(14, "affection-and-intimacy", { optional: true }),
      supporting: []
    }
  ];

  var companions = [
    {
      key: "conversation:library",
      kind: "conversation",
      title: "أسئلة بيننا",
      short: "مكتبة أسئلة للحديث، بعشرين فئة و240 سؤالًا أصليًا. لا تُحسب ولا تُخزَّن إجاباتها.",
      route: "#/questions",
      minutes: 20,
      sensitivity: "standard"
    },
    {
      key: "knowledge:challenge",
      kind: "knowledge",
      title: "قد إيه تعرفني؟",
      short: "تحدٍّ على جهاز واحد للتعرف على إجابات الطرف الآخر في هذه الجلسة فقط.",
      route: "#/know-me",
      minutes: 25,
      sensitivity: "personal"
    }
  ];

  var filters = [
    { id: "all", label: "كل الوحدات" },
    { id: "skill", label: "مهارات سلوكية" },
    { id: "decision", label: "موضوعات قرار" },
    { id: "recommended", label: "المقترح البدء به" },
    { id: "sensitive", label: "وحدات حساسة" },
    { id: "private", label: "خاص بك وحدك" }
  ];

  var recommendedKeys = [
    "assessment:emotional-communication",
    "alignment:marriage-expectations",
    "assessment:partner-responsiveness",
    "alignment:money-and-obligations",
    "assessment:conflict-style",
    "alignment:children-and-parenting"
  ];

  var totalMinutes = domains.reduce(function (total, domain) {
    return total + (domain.canonical.minutes || 0);
  }, 0);

  window.BAYNANA_PREMARITAL = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    id: "premarital-journey",
    title: "الرحلة قبل الزواج",
    intro: "أربعة عشر موضوعًا يستحق أن يُقال قبل الزواج لا بعده. بعضها مهارات سلوكية لها تقييم إرشادي، وبعضها موضوعات قرار تُعرض على شكل خريطة محايدة بلا درجات. لا يوجد في هذه الرحلة رقم واحد للتوافق ولا درجة للزواج.",
    kinds: KINDS,
    domains: domains,
    companions: companions,
    filters: filters,
    recommendedKeys: recommendedKeys,
    estimatedMinutes: totalMinutes,
    /* Private, local-only reflection. Never enters an agenda, code, or export. */
    privateSafetyRoute: "#/safety/check",
    disclaimer: "لا تحسب هذه الرحلة درجة توافق ولا تتنبأ بنجاح الزواج أو فشله. تُبنى أجندة الحوار من الموضوعات التي تختارانها أنتما فقط، ولا تدخل فيها أي إجابة خاصة بالسلامة."
  };
}());
