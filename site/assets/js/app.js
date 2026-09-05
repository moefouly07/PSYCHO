import { storage } from "./storage.js";
import {
  scoreAssessment,
  scoreFromPercentages,
  compareScores,
  comparisonLabel,
  formatPercentage
} from "./scoring.js";
import {
  encodePairingCode,
  decodePairingCode,
  isSameResult,
  resultRecordForCode,
  shareLinkFor
} from "./pairing.js";
import { evaluateSafety, sharedSafetyLevel, sharedSafetyMessage, createQuickExit, setSensitiveView } from "./safety.js";
import { createDimensionMeters, createComparisonChart } from "./charts.js";
import { currentRoute, navigate, assessmentPath, updateActiveNavigation } from "./router.js";
import {
  element, clear, announce, statusNode, setStatus, sectionHeading, breadcrumbs,
  copyText, exportText, confirmAction, normalizeArabic, isolatedCode
} from "./dom.js";
import { renderPremarital, renderAgenda, renderAlignmentRoute, quickExitBar, resetAlignmentAnswerState } from "./premarital.js";
import {
  renderQuestions, renderQuestionsCategory, renderQuestionsDeck,
  renderQuestionsFavorites, renderQuestionsSession, endSession
} from "./conversation.js";
import { renderKnowMeRoute, clearKnowledgeSession } from "./knowledge-views.js";
import { renderSafety, renderSafetyCheck } from "./safety-views.js";

const data = window.BAYNANA_DATA;
const app = document.querySelector("#app");
const liveRegion = document.querySelector("#live-region");

if (!data || !Array.isArray(data.tests)) {
  throw new Error("Baynana assessment data was not loaded");
}

const { config, tests, categories, sources } = data;
const testIds = new Set(tests.map((test) => test.id));
const testsById = new Map(tests.map((test) => [test.id, test]));
const categoriesById = new Map(categories.map((category) => [category.id, category]));

let quizState = null;
const libraryState = { category: "all", query: "" };

const faqItems = [
  {
    question: "هل هذه اختبارات تشخيصية؟",
    answer: "لا. هي اختبارات تقييم ذاتي إرشادية مستندة إلى أطر نفسية منشورة، وليست أدوات تشخيص أو بديلًا عن تقييم مختص. لا تُستخدم لإثبات اضطراب لدى أي طرف."
  },
  {
    question: "هل يستطيع شريكي رؤية إجاباتي؟",
    answer: "لا. رمز النتيجة يحمل اسمًا مختصرًا ونسب الأبعاد الستة والمؤشرات المشتقة الضرورية فقط. لا يحمل إجابات الأسئلة ولا الملاحظات الخاصة."
  },
  {
    question: "ماذا تعني نسبة تقارب الإجابات؟",
    answer: "هي وصف حسابي لمدى قرب نسبكما في الأبعاد الستة. لا تقيس الحب أو جودة العلاقة، ولا تتنبأ بنجاح الزواج أو فشله."
  },
  {
    question: "أين تُحفظ بياناتي؟",
    answer: "داخل ذاكرة هذا المتصفح فقط. لا توجد حسابات أو تحليلات أو خوادم نتائج، ويمكنك حذف التقدّم والنتائج والاقتران في أي وقت."
  },
  {
    question: "هل رمز النتيجة مشفّر أمنيًا؟",
    answer: "لا. رمز النتيجة مشفّر ترميزيًا للنقل فقط، وليس تشفيرًا أمنيًا. من يحصل عليه يستطيع قراءة نسب الأبعاد، لذلك شاركه فقط مع الشخص المقصود."
  },
  {
    question: "هل يمكن لاختبار التفكير النقدي إثبات هوية دينية أو غيبية؟",
    answer: "لا. لا يستطيع أي استبيان نفسي إثبات أو نفي أو كشف هوية دينية أو غيبية. الاختبار يراجع طريقة فحص الدليل، وقابلية التحقق، وأثر الادعاء على الحياة والعلاقة فقط."
  },
  {
    question: "ماذا أفعل إذا ظهر تنبيه سلامة؟",
    answer: "اقرأه على انفراد، ولا تبدأ مواجهة إذا كنت تخشى رد الفعل. تواصل مع شخص موثوق ومختص محلي مؤهل، واتصل بخدمات الطوارئ المحلية إذا كان الخطر فوريًا."
  },
  {
    question: "هل يمكنني إعادة الاختبار؟",
    answer: "نعم. يمكنك حذف التقدّم الحالي أو إعادة الاختبار كاملًا. إعادة الاختبار تمحو نتيجته واقترانه المحفوظين على هذا المتصفح لذلك الاختبار فقط."
  }
];

function categoryFor(test) {
  return categoriesById.get(test.category) || { id: test.category, name: "اختبار إرشادي" };
}

function createAssessmentCard(test, { featured = false } = {}) {
  const category = categoryFor(test);
  const saved = storage.getResult(test);
  const progress = storage.getProgress(test);
  const answered = Object.keys(progress?.answers || {}).length;
  const action = saved ? "اعرض النتيجة" : answered ? "أكمل من حيث توقفت" : "ابدأ الاختبار";
  const card = element("a", {
    class: `assessment-card ${featured ? "assessment-card--featured" : ""} tone-${test.tone || "cream"}`.trim(),
    href: assessmentPath(test.id),
    "aria-label": `${action}: ${test.title}`
  }, [
    element("div", { class: "assessment-card-top" }, [
      element("span", { class: "badge", text: category.name }),
      element("span", { class: "assessment-index", text: String(test.index || tests.indexOf(test) + 1).padStart(2, "0") })
    ]),
    element("div", { class: "assessment-card-body" }, [
      element("h3", { text: test.title }),
      element("p", { text: test.short })
    ]),
    element("div", { class: "assessment-card-footer" }, [
      element("span", { text: "18 سؤالًا · نحو 7 دقائق" }),
      element("span", { text: saved ? "نتيجة محفوظة ←" : answered ? `${answered} من 18 ←` : "لشخصين ←" })
    ])
  ]);
  return card;
}

function createAssessmentGrid(list, options = {}) {
  const grid = element("div", { class: options.featured ? "featured-grid" : "assessment-grid" });
  list.forEach((test) => grid.append(createAssessmentCard(test, options)));
  return grid;
}

function workflowGrid() {
  const steps = [
    ["اختيار مشترك", "اختارا الاختبار نفسه، ثم يجيب كل شخص عن نفسه بصورة مستقلة."],
    ["إجابة خاصة", "لا يرى أي منكما إجابات الآخر، وتبقى الإجابات داخل متصفح صاحبها."],
    ["رمز نتيجة", "يحصل الطرف الأول على رمز يحمل نسب الأبعاد فقط ويرسله للطرف الثاني."],
    ["حوار أوضح", "تظهر خريطة مشتركة للتقارب والاختلاف مع أسئلة حوار محايدة وآمنة."]
  ];
  return element("div", { class: "workflow-grid" }, steps.map(([title, text]) =>
    element("article", { class: "workflow-step" }, [
      element("div", { class: "stack--sm" }, [element("h3", { text: title }), element("p", { text })])
    ])
  ));
}

function faqAccordion(items = faqItems) {
  return element("div", { class: "accordion" }, items.map((item, index) =>
    element("details", { ...(index === 0 ? { open: true } : {}) }, [
      element("summary", { text: item.question }),
      element("div", { class: "accordion-content" }, [element("p", { text: item.answer })])
    ])
  ));
}

function icon(paths, extra = {}) {
  return element("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false",
    ...extra
  }, paths.map((d) => element("path", { d })));
}

function checkIcon() {
  return icon(["M20 6 9 17l-5-5"]);
}

/*
 * A bounded, purely decorative motif: two people leaning toward a shared
 * centre. It is capped by .hero-visual in CSS, cannot define page height,
 * and is hidden from assistive technology and from pointer events.
 */
function heroVisual() {
  const svg = element("svg", {
    viewBox: "0 0 320 260",
    role: "presentation",
    "aria-hidden": "true",
    focusable: "false",
    class: "decorative"
  }, [
    element("circle", { cx: "112", cy: "96", r: "44", fill: "var(--color-primary-tint)", opacity: "0.55" }),
    element("circle", { cx: "208", cy: "96", r: "44", fill: "var(--color-accent-tint)", opacity: "0.65" }),
    element("circle", { cx: "160", cy: "96", r: "20", fill: "var(--color-surface)", opacity: "0.85" }),
    element("path", {
      d: "M64 186c0-26 22-44 48-44s48 18 48 44",
      fill: "none",
      stroke: "var(--color-primary)",
      "stroke-width": "5",
      "stroke-linecap": "round"
    }),
    element("path", {
      d: "M160 186c0-26 22-44 48-44s48 18 48 44",
      fill: "none",
      stroke: "var(--color-accent)",
      "stroke-width": "5",
      "stroke-linecap": "round"
    }),
    element("path", {
      d: "M40 216h240",
      fill: "none",
      stroke: "var(--color-border-strong)",
      "stroke-width": "3",
      "stroke-linecap": "round",
      opacity: "0.5"
    })
  ]);
  return element("div", { class: "hero-visual" }, [svg]);
}

const HOME_CARDS = [
  {
    title: "الرحلة قبل الزواج",
    text: "مسار منظم لأهم الموضوعات والقرارات التي تستحق النقاش قبل الزواج.",
    cta: "ابدآ الرحلة",
    route: "#/premarital",
    paths: ["M4 6h16", "M4 12h16", "M4 18h10"]
  },
  {
    title: "التقييمات",
    text: "تقييمات استكشافية تساعد كل طرف على فهم عاداته واحتياجاته داخل العلاقة.",
    cta: "شاهدا التقييمات",
    route: "#/assessments",
    paths: ["M5 20V10", "M12 20V4", "M19 20v-6"]
  },
  {
    title: "أسئلة بيننا",
    text: "أسئلة مصنفة تبدأ بخفة وتتدرج إلى حوارات أعمق عن الحياة والمستقبل.",
    cta: "اختارا سؤالًا",
    route: "#/questions",
    paths: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"]
  },
  {
    title: "قد إيه تعرفني؟",
    text: "تجربة لطيفة لاكتشاف ما تعرفه عن تفضيلات شريكك واحتياجاته وطموحاته.",
    cta: "ابدآ التحدي",
    route: "#/know-me",
    paths: ["M12 17h.01", "M9.1 9a3 3 0 1 1 4.2 3.4c-.8.4-1.3 1.2-1.3 2.1"]
  }
];

const HOME_TOPICS = [
  { label: "التواصل", category: "communication" },
  { label: "المال", category: "money" },
  { label: "الأهل والحدود", category: "family" },
  { label: "الأطفال والتربية", category: "children" },
  { label: "العمل والسكن", category: "work" },
  { label: "القيم والدين", category: "faith" },
  { label: "الخلاف والاعتذار", category: "repair" },
  { label: "المودة والحميمية", category: "intimacy" }
];

function renderHome() {
  const root = element("div", { class: "view-enter" });

  /* ------------------------------------------------------------- HERO */
  root.append(element("section", { class: "home-hero" }, [
    element("div", { class: "container" }, [
      element("div", { class: "hero-grid" }, [
        element("div", { class: "hero-copy" }, [
          element("p", { class: "eyebrow", text: "مساحة أهدأ لفهم بعض" }),
          element("h1", { text: "افهموا بعض قبل ما تبدأوا حياتكم سوا" }),
          element("p", { class: "lede", text: "مساحة خاصة تساعدكما على فهم طريقة التواصل، ومناقشة القرارات المهمة، واكتشاف ما اتفقتما عليه وما يحتاج إلى حوار — من دون أحكام أو تشخيصات." }),
          element("div", { class: "hero-actions" }, [
            element("a", { class: "button button--primary", href: "#/premarital", text: "ابدآ الرحلة قبل الزواج" }),
            element("a", { class: "button button--secondary", href: "#/questions", text: "استكشفا أسئلة بيننا" })
          ]),
          element("ul", { class: "hero-trust" }, [
            "بياناتكما تظل على الجهاز",
            "لا يحتاج إلى حساب",
            "لا تشخيص ولا حكم على العلاقة"
          ].map((line) => element("li", {}, [checkIcon(), element("span", { text: line })])))
        ]),
        heroVisual()
      ])
    ])
  ]));

  /* ------------------------------------------- FOUR EXPERIENCE CARDS */
  root.append(element("section", { class: "page-section" }, [
    element("div", { class: "container" }, [
      sectionHeading("أربع تجارب مختلفة", "اختارا من أين تبدآن", "كل تجربة مستقلة، ويمكن البدء بأي منها."),
      element("div", { class: "home-cards" }, HOME_CARDS.map((card) =>
        element("a", { class: "home-card", href: card.route }, [
          element("span", { class: "home-card-icon" }, [icon(card.paths)]),
          element("h3", { text: card.title }),
          element("p", { text: card.text }),
          element("span", { class: "home-card-cta" }, [
            element("span", { text: card.cta }),
            element("span", { "aria-hidden": "true", text: "←" })
          ])
        ])
      ))
    ])
  ]));

  /* ----------------------------------------------------- HOW IT WORKS */
  root.append(element("section", { class: "page-section tone-lilac" }, [
    element("div", { class: "container" }, [
      sectionHeading("ثلاث خطوات", "خطوات بسيطة، وحوار أوضح", ""),
      element("div", { class: "home-steps" }, [
        "اختارا التجربة المناسبة",
        "يجيب كل طرف بخصوصية",
        "ناقشا النتائج من غير أحكام"
      ].map((step, index) => element("div", { class: "home-step" }, [
        element("span", { text: `الخطوة ${index + 1}` }),
        element("p", { text: step })
      ])))
    ])
  ]));

  /* ------------------------------------------------- IMPORTANT TOPICS */
  root.append(element("section", { class: "page-section" }, [
    element("div", { class: "container" }, [
      sectionHeading("قبل أن تقررا", "موضوعات تستحق أن تتكلموا عنها", "كل موضوع يفتح مجموعة أسئلة جاهزة للحوار."),
      element("div", { class: "topic-chips" }, HOME_TOPICS.map((topic) =>
        element("a", {
          class: "topic-chip",
          href: `#/questions/category/${topic.category}`,
          text: topic.label
        })
      ))
    ])
  ]));

  /* -------------------------------------------------- PRIVACY SECTION */
  root.append(element("section", { class: "page-section" }, [
    element("div", { class: "container" }, [
      element("div", { class: "home-privacy" }, [
        element("div", { class: "home-privacy-copy" }, [
          element("h2", { text: "خصوصيتكما جزء من التجربة" }),
          element("p", { text: "لا يحتاج بيننا إلى حساب، ولا يرسل إجاباتكما إلى خادم خاص بالتطبيق. بعض النتائج والتقدم قد تُحفظ محليًا على الجهاز ويمكن حذفها في أي وقت." })
        ]),
        element("a", { class: "button button--secondary", href: "#/privacy", text: "اعرفا كيف نحمي الخصوصية" })
      ])
    ])
  ]));

  /* ------------------------------------------------------ CLOSING CTA */
  root.append(element("section", { class: "page-section" }, [
    element("div", { class: "container" }, [
      element("div", { class: "home-closing" }, [
        element("h2", { text: "ابدآ بالسؤال الذي لم تسألاه بعد" }),
        element("a", { class: "button button--primary", href: "#/premarital", text: "ابدآ الرحلة" }),
        element("a", { href: "#/assessments", text: "تصفّحا كل التجارب" })
      ])
    ])
  ]));

  return root;
}

function renderLibrary() {
  const root = element("section", { class: "container page-section library-page view-enter" });
  root.append(element("div", { class: "library-header section-heading" }, [
    element("p", { class: "eyebrow", text: `${tests.length} تقييمًا · ${tests.length * 18} سؤالًا` }),
    element("h1", { text: "اختارا ما يستحق فهمًا أوضح" }),
    element("p", { text: "كل اختبار مخصص لشخصين بالغين في علاقة عاطفية أو خطوبة. يجيب كل شخص عن نفسه، ثم تُقارن نسب الأبعاد دون كشف الإجابات." })
  ]));

  const counts = element("div", { class: "category-counts", "aria-label": "عدد الاختبارات في كل فئة" });
  categories.forEach((category) => {
    const count = tests.filter((test) => test.category === category.id).length;
    counts.append(element("div", { class: "category-count" }, [
      element("strong", { text: count }),
      element("span", { text: category.name })
    ]));
  });
  root.append(counts);

  const search = element("input", {
    class: "input",
    type: "search",
    value: libraryState.query,
    placeholder: "ابحث باسم الاختبار أو موضوعه…",
    "aria-label": "ابحث في الاختبارات"
  });
  const filters = element("div", { class: "chips", role: "group", "aria-label": "تصفية حسب الفئة" });
  const grid = element("div", { class: "assessment-grid", id: "library-grid" });
  const resultStatus = element("p", { class: "fine-print", role: "status", "aria-live": "polite" });

  [{ id: "all", name: "كل الاختبارات" }, ...categories].forEach((category) => {
    const count = category.id === "all" ? tests.length : tests.filter((test) => test.category === category.id).length;
    const chip = element("button", {
      type: "button",
      class: "chip",
      "aria-pressed": libraryState.category === category.id ? "true" : "false",
      text: `${category.name} (${count})`
    });
    chip.addEventListener("click", () => {
      libraryState.category = category.id;
      filters.querySelectorAll(".chip").forEach((button) => button.setAttribute("aria-pressed", String(button === chip)));
      paintLibraryGrid();
    });
    filters.append(chip);
  });

  function paintLibraryGrid() {
    clear(grid);
    const query = normalizeArabic(libraryState.query);
    const filtered = tests.filter((test) => {
      if (libraryState.category !== "all" && test.category !== libraryState.category) return false;
      if (!query) return true;
      const category = categoryFor(test);
      return normalizeArabic(`${test.title} ${test.short} ${category.name}`).includes(query);
    });
    if (!filtered.length) {
      grid.append(element("div", { class: "empty-state stack--sm" }, [
        element("h2", { text: "لا توجد نتيجة مطابقة" }),
        element("p", { text: "جرّب كلمة أقصر أو اختر فئة أخرى." })
      ]));
    } else {
      filtered.forEach((test) => grid.append(createAssessmentCard(test)));
    }
    resultStatus.textContent = `يظهر الآن ${filtered.length} من ${tests.length} اختبارًا.`;
  }

  search.addEventListener("input", () => {
    libraryState.query = search.value;
    paintLibraryGrid();
  });

  root.append(element("div", { class: "library-controls" }, [
    element("div", { class: "search-wrap" }, [
      element("svg", { class: "search-glyph", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "aria-hidden": "true" }, [
        element("circle", { cx: "10.5", cy: "10.5", r: "6.5" }),
        element("path", { d: "M16 16l5 5" })
      ]),
      search
    ]),
    filters,
    resultStatus
  ]));
  root.append(grid);
  paintLibraryGrid();
  return root;
}

function renderHow() {
  const detailedSteps = [
    "يختار الطرف الأول اختبارًا ويكتب اسمًا أولًا أو اسمًا مختصرًا.",
    "يجيب الطرف الأول عن سلوكه ومشاعره واحتياجاته هو، بعيدًا عن محاولة تقييم الطرف الآخر.",
    "يُحفظ التقدّم داخل متصفحه فقط، ويمكنه التوقف والعودة لاحقًا.",
    "بعد 18 سؤالًا تظهر نتيجته الفردية في ستة أبعاد.",
    "ينشئ المتصفح رمز نتيجة لا يحمل إجابات الأسئلة.",
    "يرسل الطرف الأول الرمز أو رابط المشاركة إلى الطرف الثاني.",
    "يفتح الطرف الثاني الاختبار نفسه ويجيب عن نفسه بصورة مستقلة.",
    "يقرأ المتصفح الرمز ويتحقق من نسخته وسلامته وملاءمته للاختبار.",
    "تُحسب نسبة تقارب الإجابات من متوسط الفروق المطلقة بين الأبعاد الستة.",
    "تظهر نقاط التشابه والاختلاف وأسئلة حوار محايدة، مع بوابة سلامة عند الحاجة."
  ];
  return element("section", { class: "container page-section view-enter" }, [
    breadcrumbs([{ label: "الرئيسية", href: "#/" }, { label: "كيف يعمل؟" }]),
    element("div", { class: "section-heading spaced-md" }, [
      element("p", { class: "eyebrow", text: "مساران خاصان، خريطة واحدة" }),
      element("h1", { text: "من الإجابة الفردية إلى حوار مشترك" }),
      element("p", { text: "صُمم المسار ليحمي استقلال إجابة كل شخص ويمنع استخدام الأسئلة لتشخيص الشريك أو محاكمته." })
    ]),
    workflowGrid(),
    element("div", { class: "editorial-split page-section" }, [
      element("div", { class: "surface-card stack" }, [
        element("h2", { text: "الخطوات العشر بالتفصيل" }),
        element("ol", { class: "stack" }, detailedSteps.map((step) => element("li", { text: step })))
      ]),
      element("div", { class: "stack" }, [
        element("div", { class: "notice" }, [
          element("strong", { text: "ما الذي يخرج من جهازك؟" }),
          element("p", { text: "لا شيء تلقائيًا. أنت من ينسخ رمز النتيجة أو الرابط ويرسله. لا يستخدم الموقع تحليلات أو خدمات نماذج خارجية." })
        ]),
        element("div", { class: "notice notice--warning" }, [
          element("strong", { text: "ما الذي لا تفعله المقارنة؟" }),
          element("p", { text: "لا تختار الأفضل، ولا تقيس الحب، ولا تعطي احتمالًا لنجاح الزواج، ولا تنصح تلقائيًا بالزواج أو الانفصال." })
        ]),
        element("a", { class: "button button--primary", href: "#/assessments", text: "اختارا اختبارًا" })
      ])
    ])
  ]);
}

function renderPrivacy() {
  const root = element("section", { class: "container page-section view-enter" }, [
    breadcrumbs([{ label: "الرئيسية", href: "#/" }, { label: "الخصوصية" }]),
    element("div", { class: "section-heading spaced-md" }, [
      element("p", { class: "eyebrow", text: "خصوصية مفهومة بلا غموض" }),
      element("h1", { text: "إجاباتك تبقى داخل هذا المتصفح" }),
      element("p", { text: "لا حسابات، ولا قاعدة بيانات، ولا تحليلات، ولا إعلانات، ولا إرسال تلقائي للنتائج." })
    ])
  ]);

  root.append(element("div", { class: "privacy-grid" }, [
    element("article", { class: "surface-card stack" }, [
      element("h2", { text: "ما الذي يُحفظ محليًا؟" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "الاسم الأول أو الاسم المختصر الذي تختاره." }),
        element("li", { text: "تقدّم الاختبار وترتيب الخيارات العشوائي الثابت للجلسة." }),
        element("li", { text: "إجاباتك ونتيجتك الفردية على جهازك فقط." }),
        element("li", { text: "رمز الطرف الآخر بعد الاقتران، إلى أن تزيله." }),
        element("li", { text: "اختيار المظهر الفاتح أو الداكن." })
      ])
    ]),
    element("article", { class: "surface-card stack" }, [
      element("h2", { text: "ما الذي لا نجمعه؟" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "لا اسم قانوني كامل ولا بريد ولا هاتف." }),
        element("li", { text: "لا معلومات جهاز ولا عنوان شبكة لأغراض التتبع." }),
        element("li", { text: "لا ملاحظات حرة خاصة ولا رسائل بينكما." }),
        element("li", { text: "لا إجابات خام داخل رمز النتيجة." }),
        element("li", { text: "لا بكسلات تتبع ولا خدمات نماذج خارجية." })
      ])
    ]),
    element("article", { class: "surface-card stack" }, [
      element("h2", { text: "محتوى رمز النتيجة" }),
      element("p", { text: "رقم النسخة، ومعرّف الاختبار، والاسم المختصر، ونسب الأبعاد الستة، والمؤشرات غير التشخيصية الضرورية، ووقت الإكمال، وبصمة تحقق." }),
      element("div", { class: "notice notice--warning" }, [
        element("strong", { text: "تنبيه صريح" }),
        element("p", { text: "رمز النتيجة مشفّر ترميزيًا للنقل فقط، وليس تشفيرًا أمنيًا. من يملكه يستطيع فك نسب الأبعاد، فشارك الرمز مع الشخص المقصود فقط." })
      ]),
      element("p", { class: "fine-print", text: "يوضع الرمز في جزء التجزئة من الرابط بعد علامة #، وليس في query string، ولا يُرسل إلى خادم الموقع." })
    ]),
    element("article", { class: "surface-card stack" }, [
      element("h2", { text: "أنت تتحكم في البيانات" }),
      element("p", { text: "يمكنك حذف تقدّم اختبار واحد أثناء الإجابة، أو إعادة اختبار ومسح نتيجته واقترانه، أو حذف نوع واحد من البيانات، أو حذف كل بيانات «بيننا» على هذا المتصفح." }),
      element("div", { class: "cluster" }, [
        element("button", { type: "button", class: "button button--secondary button--small", text: "احذف قوائم الأسئلة", onclick: () => deleteScoped("conversation") }),
        element("button", { type: "button", class: "button button--secondary button--small", text: "احذف ملخصات التحدي", onclick: () => deleteScoped("knowledge") }),
        element("button", { type: "button", class: "button button--secondary button--small", text: "احذف أجندة الحوار", onclick: () => deleteScoped("agenda") }),
        element("button", { type: "button", class: "button button--secondary button--small", text: "أنهِ جلسة العمل الحالية", onclick: () => deleteScoped("session") })
      ]),
      element("button", {
        type: "button",
        class: "button button--danger",
        text: "حذف كل البيانات المحلية",
        onclick: requestDeleteAllData
      }),
      element("p", { class: "fine-print", text: "لا يمكن استرجاع البيانات بعد حذفها ما لم تكن قد صدّرت ملخصًا نصيًا بنفسك." })
    ]),
    privateModeCard(),
    element("article", { class: "surface-card stack" }, [
      element("h2", { text: "ما الذي يقوله المتصفح والاستضافة بدقة" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "localStorage: ذاكرة دائمة داخل هذا المتصفح تبقى بعد إغلاق التبويب. تُحفظ فيها التقدّم والنتائج والاقتران وقوائم الأسئلة والأجندة." }),
        element("li", { text: "sessionStorage: ذاكرة مؤقتة تُمسح عند إغلاق التبويب. تُحفظ فيها إجابات المقارنة على جهاز واحد، وكل تحدي «قد إيه تعرفني؟»، والمراجعة الخاصة بالسلامة." }),
        element("li", { text: "رمز النتيجة يحمل نسخة ومعرّفًا واسمًا مختصرًا وأرقامًا مجمّعة ووقت إكمال وبصمة تحقق، ولا يحمل إجابة أي سؤال." }),
        element("li", { text: "ترميز Base64URL ليس تشفيرًا. من يحصل على الرمز يستطيع قراءة محتواه المجمّع بسهولة." }),
        element("li", { text: "من يملك وصولًا إلى هذا الجهاز أو المتصفح يستطيع رؤية ما هو محفوظ محليًا." }),
        element("li", { text: "تتلقى جهة الاستضافة بيانات طلب الصفحة المعتادة مثل عنوان الشبكة ووقت الطلب ونوع المتصفح، كما في أي موقع." }),
        element("li", { text: "لا تُرسل إجابات الاختبارات إلى «بيننا» عمدًا، ولا يوجد خادم نتائج ولا حسابات ولا تحليلات." }),
        element("li", { text: "لا يُرسل ما بعد علامة # ضمن طلب HTTP المعتاد، ولذلك توضع الرموز في التجزئة لا في query string." }),
        element("li", { text: "الروابط المنسوخة ولقطات الشاشة وسجل المتصفح وسجل الحافظة قد تكشف نشاطك رغم كل ما سبق." })
      ]),
      element("div", { class: "notice notice--warning" }, [
        element("p", { text: "لا نقول إن «لا شيء يصل إلى خادم أبدًا». تحميل الصفحة نفسه طلب شبكي، وله بيانات وصفية معتادة لدى جهة الاستضافة. ما نقوله بدقة: إجاباتك لا تُرسل إلى خادم نتائج، ولا يوجد لدينا ما نخزّنه عنك." })
      ])
    ])
  ]));
  return root;
}

function privateModeCard() {
  const active = storage.isPrivateMode();
  return element("article", { class: "surface-card stack" }, [
    element("div", { class: "split" }, [
      element("h2", { text: "الوضع الخاص" }),
      element("span", { class: "badge", text: active ? "مفعّل" : "غير مفعّل" })
    ]),
    element("p", { text: "في الوضع الخاص لا يُحفظ أي تقدّم أو نتيجة أو اقتران أو مفضلة أو ملخص في ذاكرة المتصفح الدائمة. تعمل كل الميزات، لكن ما تفعله يختفي بإغلاق التبويب." }),
    element("div", { class: "notice notice--warning" }, [
      element("p", { text: active
        ? "إيقاف الوضع الخاص يعني أن ما تفعله بعد ذلك سيُحفظ في هذا المتصفح ويبقى بعد إغلاقه، وقد يراه من يستخدم الجهاز."
        : "تفعيل الوضع الخاص لا يخفي نشاطك عن سجل المتصفح ولا عن مراقبة الشبكة أو الجهاز. يمنع الحفظ الدائم فقط." })
    ]),
    element("button", {
      type: "button",
      class: `button ${active ? "button--secondary" : "button--primary"}`,
      text: active ? "أوقف الوضع الخاص" : "فعّل الوضع الخاص",
      onclick: async () => {
        if (active) {
          const confirmed = await confirmAction({
            title: "إيقاف الوضع الخاص؟",
            message: "بعد الإيقاف سيُحفظ تقدّمك ونتائجك في هذا المتصفح وتبقى بعد إغلاقه.",
            confirmLabel: "أوقف الوضع الخاص"
          });
          if (!confirmed) return;
          storage.setPrivateMode(false);
          announce("أُوقف الوضع الخاص. سيُحفظ ما تفعله بعد الآن.");
        } else {
          storage.setPrivateMode(true);
          announce("فُعّل الوضع الخاص. لن يُحفظ شيء جديد بشكل دائم.");
        }
        render();
      }
    }),
    element("p", { class: "fine-print", text: "تفعيل الوضع الخاص لا يحذف ما هو محفوظ بالفعل. استخدم أزرار الحذف أعلاه لذلك." })
  ]);
}

async function deleteScoped(scope) {
  const copy = {
    conversation: { title: "حذف قوائم الأسئلة؟", message: "ستُحذف المفضلة والمؤجلة والمتحدَّث فيها من هذا المتصفح." },
    knowledge: { title: "حذف ملخصات التحدي؟", message: "ستُحذف الملخصات العددية المحفوظة لتحدي «قد إيه تعرفني؟»." },
    agenda: { title: "حذف أجندة الحوار؟", message: "ستُحذف كل الموضوعات التي أضفتماها إلى الأجندة." },
    session: { title: "إنهاء جلسة العمل الحالية؟", message: "ستُمسح إجابات المقارنة على هذا الجهاز، وتحدي «قد إيه تعرفني؟»، والمراجعة الخاصة بالسلامة." }
  }[scope];
  if (!copy) return;
  const confirmed = await confirmAction({ ...copy, confirmLabel: "احذف", danger: true });
  if (!confirmed) return;
  if (scope === "conversation") storage.deleteConversationData();
  if (scope === "knowledge") storage.deleteKnowledgeSummaries();
  if (scope === "agenda") storage.deleteAgenda();
  if (scope === "session") { storage.clearSession(); clearKnowledgeSession(); }
  announce("تم الحذف.");
  render();
}

function sourceEntry(source) {
  const title = source.displayTitle || source.title || source.label || source.name || "مرجع علمي";
  const url = source.url || source.href;
  const description = source.description || source.note || source.meta || "مصدر أولي أو مهني موثّق";
  const facts = [source.authors, source.year, source.kindLabel].filter(Boolean).join(" · ");
  return element("li", {}, [
    url
      ? element("a", { href: url, target: "_blank", rel: "noopener noreferrer", text: title })
      : element("strong", { text: title }),
    facts ? element("span", { class: "fine-print", text: facts }) : null,
    element("span", { text: description }),
    source.doi ? element("span", { class: "fine-print" }, ["DOI: ", isolatedCode(source.doi)]) : null,
    source.itemUse ? element("span", { class: "fine-print", text: `استخدام البنود: ${source.itemUse}` }) : null
  ]);
}

/* byAssessment/byModule entries are objects: { title, description, references }. */
function referencesFor(entry) {
  if (Array.isArray(entry)) return entry;
  return Array.isArray(entry?.references) ? entry.references : [];
}

function renderScience() {
  const root = element("section", { class: "container page-section view-enter" }, [
    breadcrumbs([{ label: "الرئيسية", href: "#/" }, { label: "الأساس العلمي" }]),
    element("div", { class: "section-heading spaced-md" }, [
      element("p", { class: "eyebrow", text: "مصادر متحققة وحدود معلنة" }),
      element("h1", { text: "كيف بُنيت الاختبارات؟" }),
      element("p", { text: "الأبعاد مستوحاة من أبحاث أصلية وأطر مهنية منشورة، أما الأسئلة العربية فمكتوبة من جديد لتناسب التأمل الذاتي داخل علاقة عاطفية ملتزمة." })
    ]),
    element("div", { class: "notice notice--warning" }, [
      element("strong", { text: "ما تعنيه المراجع — وما لا تعنيه" }),
      element("p", { text: "وجود مرجع لا يجعل هذه الأدوات نسخًا عربية مُقنّنة أو مقاييس سريرية. لم تُشتق النطاقات من عينة عربية، ولا توجد هنا معايير سكانية أو معاملات ثبات وصدق لهذه الصياغة. النتائج وصفية إرشادية فقط." })
    ])
  ]);

  root.append(element("section", { class: "surface-card stack spaced-lg" }, [
    element("h2", { text: "الفرق بين أربعة أشياء يُخلط بينها كثيرًا" }),
    element("dl", { class: "kind-legend" }, [
      element("dt", { text: "مقياس نفسي مُقنَّن" }),
      element("dd", { text: "أداة خضعت لدراسات تحقق سيكومتري، ولها معاملات ثبات وصدق ومعايير سكانية على عينة محددة، ويُستخدم غالبًا ضمن تقييم مهني. لا يوجد في «بيننا» شيء من هذا النوع." }),
      element("dt", { text: "أداة تأمل أصلية مستندة إلى أدلة" }),
      element("dd", { text: "بنود عربية مكتوبة خصيصًا لهذا الموقع، استرشدت بأطر بحثية منشورة في اختيار الأبعاد فقط. تعطي نسبًا وصفية داخل بنودها، بلا نقاط قطع ولا معايير. هذا ما تنتمي إليه التقييمات السلوكية هنا." }),
      element("dt", { text: "خريطة توافق محايدة" }),
      element("dd", { text: "تسجيل تفضيلات وخطط بلا درجة وبلا إجابة أفضل. تُصنَّف الفروق إلى مشترك أو قريب أو يستحق حوارًا، ولا تُحوَّل إلى نسبة توافق." }),
      element("dt", { text: "نشاط حواري أو لعبة تعرّف" }),
      element("dd", { text: "أسئلة للحديث لا تُحسب، ولعبة تقيس التعرّف على إجابات جلسة واحدة. لا علاقة لهما بالقياس النفسي إطلاقًا." })
    ]),
    element("div", { class: "notice notice--warning" }, [
      element("p", { text: "لم تُجرَ لهذه الصياغة العربية مقابلات معرفية ولا تحليل بنود ولا دراسة ثبات أو صدق. تشترط إرشادات لجنة الاختبارات الدولية لتكييف الاختبارات هذه الخطوات قبل ادعاء التكافؤ مع أي أداة منشورة، ولم تُتخذ بعد." })
    ])
  ]));

  const globalSources = Array.isArray(sources?.global) ? sources.global : [];
  if (globalSources.length) {
    root.append(element("section", { class: "surface-card stack spaced-lg" }, [
      element("h2", { text: "معايير التقييم النفسي" }),
      element("ul", { class: "source-list" }, globalSources.map(sourceEntry))
    ]));
  }

  const sourceGrid = element("div", { class: "science-grid spaced-sm" });
  tests.forEach((test) => {
    const entry = sources?.byAssessment?.[test.id];
    const list = referencesFor(entry).length ? referencesFor(entry) : referencesFor(test.sources);
    sourceGrid.append(element("article", { class: "surface-card source-group" }, [
      element("div", { class: "stack--sm" }, [
        element("span", { class: "badge", text: categoryFor(test).name }),
        element("h2", { text: test.title })
      ]),
      list.length
        ? element("ul", { class: "source-list" }, list.map(sourceEntry))
        : element("p", { class: "fine-print", text: "لا يوجد مرجع معروض لهذا الاختبار حاليًا؛ لا تُضاف مراجع غير متحققة." })
    ]));
  });
  root.append(sourceGrid);

  const byModule = sources?.byModule || {};
  const moduleKeys = Object.keys(byModule);
  if (moduleKeys.length) {
    root.append(element("section", { class: "surface-card stack spaced-sm" }, [
      element("h2", { text: "مراجع الخرائط والمكتبة والتحدي" }),
      element("p", { class: "fine-print", text: "هذه الوحدات ليست اختبارات مسجَّلة الدرجات، ومراجعها تشرح سبب إفراد الموضوع أو طريقة بناء التجربة، لا أساسًا سيكومتريًا لها." }),
      element("ul", { class: "source-list" }, moduleKeys.flatMap((moduleId) => referencesFor(byModule[moduleId]).map(sourceEntry)))
    ]));
  }

  const standards = Array.isArray(sources?.standards) ? sources.standards : [];
  if (standards.length) {
    root.append(element("section", { class: "surface-card stack spaced-sm" }, [
      element("h2", { text: "معايير تقنية متبعة" }),
      element("ul", { class: "source-list" }, standards.map(sourceEntry))
    ]));
  }

  root.append(element("section", { class: "surface-card stack spaced-sm" }, [
    element("h2", { text: "قواعد التفسير" }),
    element("ul", { class: "stack--sm" }, [
      element("li", { text: "أنماط التعلق تُقرأ على أبعاد مستمرة، وأي «ميل» وصف حذر للحظة الراهنة لا هوية ثابتة." }),
      element("li", { text: "مؤشرات النرجسية والقسوة تقارير ذاتية عن سمات وسلوكيات، وليست تشخيصًا لاضطراب شخصية." }),
      element("li", { text: "الغيرة والغضب مشاعر بشرية؛ المراقبة والتهديد والإكراه والإيذاء سلوكيات لا تُبررها المشاعر." }),
      element("li", { text: "نسبة تقارب الإجابات وصف للفروق في الإجابات، لا ضمان توافق ولا احتمال نجاح للزواج." }),
      element("li", { text: "لا يمكن لاستبيان نفسي إثبات أو نفي هوية دينية أو غيبية؛ يُقيّم اختبار المهدوية فحص الدليل والأثر الوظيفي فقط." })
    ])
  ]));
  return root;
}

function renderFaq() {
  return element("section", { class: "container narrow-page page-section view-enter" }, [
    breadcrumbs([{ label: "الرئيسية", href: "#/" }, { label: "الأسئلة الشائعة" }]),
    element("div", { class: "section-heading spaced-md" }, [
      element("p", { class: "eyebrow", text: "قبل أن تبدأا" }),
      element("h1", { text: "الأسئلة الشائعة" }),
      element("p", { text: "إجابات قصيرة عن الخصوصية، وطبيعة النتائج، والمقارنة، والسلامة." })
    ]),
    faqAccordion()
  ]);
}

function renderTerms() {
  setSensitiveView(false);
  return element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: "الرئيسية", href: "#/" }, { label: "الشروط والحدود" }]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "ما هذا الموقع، وما ليس هو" }),
      element("h1", { text: "شروط الاستخدام والحدود" }),
      element("p", { text: "اقرأا هذه الصفحة قبل الاعتماد على أي نتيجة في قرار حقيقي." })
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "لمن هذا الموقع" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "لشخصين بالغين (18 عامًا فأكثر) في علاقة عاطفية أو خطوبة أو تفكير في الزواج." }),
        element("li", { text: "يجيب كل شخص عن نفسه، ولا يُستخدم الموقع لتقييم شخص آخر أو وضع تسمية له." }),
        element("li", { text: "المشاركة اختيارية بالكامل، ولأي طرف أن يتوقف أو يمر على أي سؤال دون تفسير." })
      ])
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "ما لا يفعله «بيننا»" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "لا يشخّص شخصًا ولا علاقة، ولا يقيس مرضًا نفسيًا." }),
        element("li", { text: "لا يشهد بتوافق، ولا يتنبأ بنجاح الزواج أو فشله أو الانفصال أو الخيانة أو العنف." }),
        element("li", { text: "لا يحدد «نرجسيًا» أو «مسيئًا» أو «شريكًا مثاليًا» أو شخصًا «سامًّا»." }),
        element("li", { text: "لا يقدّم استشارة طبية أو نفسية أو قانونية أو دينية أو مالية." }),
        element("li", { text: "ليس نسخة عربية مُقنّنة من أي مقياس منشور." }),
        element("li", { text: "لا يغني عن الإرشاد قبل الزواج ولا عن العلاج الزوجي ولا عن دعم مختص مؤهل." })
      ])
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "حدود المحتوى" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "كل البنود أصلية ومكتوبة لهذا الموقع. لم تُنقل ولم تُترجم ولم يُعَد صياغة أي بند من أداة منشورة أو محمية." }),
        element("li", { text: "لم تُقنّن هذه الصياغة العربية، ولا توجد لها معاملات ثبات أو صدق أو معايير سكانية." }),
        element("li", { text: "التقارير ذاتية، وقد تتغير الإجابة نفسها باختلاف اليوم والمزاج والسياق." }),
        element("li", { text: "الاختلاف في الأطفال أو الدين أو المال أو توقعات الأهل أو العمل أو المكان أو الأدوار موضوع قرار، لا خلل نفسي." })
      ])
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "مراجعة بشرية لم تُجرَ بعد" }),
      element("p", { text: "صيغ هذا المحتوى داخليًا ولم يخضع بعد لمراجعة مختص مرخّص في العلاقات أو الصحة النفسية، ولا لمراجعة تحريرية عربية مستقلة، ولا لمراجعة قانونية. لذلك لا يوصف الموقع بأنه معتمد سريريًا أو موثّق من مختصين." }),
      element("a", { class: "text-button", href: "#/science", text: "اقرآ الأساس العلمي والحدود بالتفصيل" })
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "السلامة أولًا" }),
      element("p", { text: "إذا وُجد تهديد أو إكراه أو مراقبة أو إذلال أو خوف، فالأولوية للسلامة لا للحوار المشترك. تواصل على انفراد مع شخص تثق به ومع مختص محلي مؤهل، واتصل بخدمات الطوارئ المحلية عند وجود خطر فوري." }),
      element("a", { class: "button button--secondary", href: "#/safety", text: "صفحة الخصوصية والأمان" })
    ]),
    element("div", { class: "notice" }, [element("p", { text: config.disclaimers.global })])
  ]);
}

function renderNotFound() {
  return element("section", { class: "container not-found page-section view-enter" }, [
    element("div", { class: "stack" }, [
      element("p", { class: "eyebrow", text: "404" }),
      element("h1", { text: "الصفحة غير موجودة" }),
      element("p", { class: "lede", text: "قد يكون الرابط ناقصًا أو يشير إلى اختبار غير متاح." }),
      element("a", { class: "button button--primary", href: "#/", text: "العودة إلى الرئيسية" })
    ])
  ]);
}

function startProgress(test, nickname, existing = null) {
  const progress = existing || {
    v: 1,
    testId: test.id,
    answers: {},
    order: {},
    index: 0,
    startedAt: Date.now()
  };
  progress.nickname = storage.cleanNickname(nickname);
  progress.updatedAt = Date.now();
  storage.setNickname(progress.nickname);
  storage.setProgress(test, progress);
  navigate(assessmentPath(test.id, "quiz"));
}

async function restartAssessment(test, target = "intro") {
  const confirmed = await confirmAction({
    title: "إعادة هذا الاختبار؟",
    message: "سيُحذف التقدّم والنتيجة والاقتران المحفوظ لهذا الاختبار من هذا المتصفح.",
    confirmLabel: "احذف وابدأ من جديد",
    danger: true
  });
  if (!confirmed) return;
  storage.restartAssessment(test.id);
  quizState = null;
  announce("تم حذف بيانات الاختبار المحلية.");
  navigate(assessmentPath(test.id, target));
}

function renderIntro(test) {
  const saved = storage.getResult(test);
  const progress = storage.getProgress(test);
  const category = categoryFor(test);
  const pending = storage.getPendingCode(test.id);
  const root = element("section", { class: "container page-section view-enter" }, [
    breadcrumbs([
      { label: "الاختبارات", href: "#/assessments" },
      { label: category.name, href: `#/assessments` },
      { label: test.title }
    ])
  ]);

  const main = element("div", { class: "intro-main" }, [
    element("header", { class: "stack" }, [
      element("span", { class: "badge", text: category.name }),
      element("h1", { text: test.title }),
      element("p", { class: "lede", text: test.short }),
      element("div", { class: "cluster fine-print" }, [
        element("span", { text: "18 سؤالًا" }),
        element("span", { text: "6 أبعاد" }),
        element("span", { text: "نحو 7 دقائق" }),
        element("span", { text: "مقارنة لشخصين" })
      ])
    ]),
    pending ? element("div", { class: "notice notice--success" }, [
      element("strong", { text: "وصلت نتيجة الطرف الآخر" }),
      element("p", { text: "أجب أنت عن نفسك أولًا. حُفظ الرمز داخل متصفحك مؤقتًا وستكون المقارنة جاهزة بعد نتيجتك." })
    ]) : null,
    element("article", { class: "surface-card stack" }, [
      element("h2", { text: "ما الذي ستراجعه؟" }),
      element("ul", { class: "dimension-preview" }, test.dimensions.map((dimension) =>
        element("li", { text: dimension.name })
      ))
    ]),
    element("article", { class: "surface-card stack" }, [
      element("h2", { text: "قبل أن تبدأ" }),
      element("ol", { class: "stack--sm" }, (test.instructions || []).map((instruction) => element("li", { text: instruction }))),
      element("div", { class: "notice" }, [
        element("p", { text: test.disclaimer }),
        element("p", { text: config.globalDisclaimer })
      ])
    ])
  ]);

  const side = element("aside", { class: "intro-side" });
  if (saved) {
    side.append(element("div", { class: "surface-card start-card stack" }, [
      element("span", { class: "badge badge--success", text: "لديك نتيجة محفوظة" }),
      element("h2", { text: `مرحبًا ${saved.nickname}` }),
      element("p", { class: "fine-print", text: "يمكنك عرض نتيجتك ومشاركة رمزها، أو إعادة الاختبار ومسح البيانات الحالية." }),
      element("a", { class: "button button--primary", href: assessmentPath(test.id, "result"), text: "اعرض نتيجتي" }),
      element("a", { class: "button button--secondary", href: assessmentPath(test.id, "partner"), text: "المقارنة مع الشريك" }),
      element("button", {
        type: "button",
        class: "button button--danger",
        text: "إعادة الاختبار",
        onclick: () => restartAssessment(test)
      })
    ]));
  } else {
    const status = statusNode();
    const nickname = element("input", {
      class: "input",
      type: "text",
      maxlength: "24",
      autocomplete: "nickname",
      value: progress?.nickname || storage.getNickname(),
      placeholder: "مثال: نور",
      required: true,
      "aria-describedby": "nickname-help"
    });
    const adult = element("input", { type: "checkbox", required: true });
    const form = element("form", { class: "surface-card start-card stack" }, [
      element("div", { class: "stack--sm" }, [
        element("span", { class: "badge", text: progress ? "تقدّم محفوظ" : "إجابة خاصة" }),
        element("h2", { text: progress ? "أكمل من حيث توقفت" : "ابدأ بإجابتك أنت" }),
        element("p", { class: "fine-print", text: "اكتب اسمًا أولًا أو اسمًا مختصرًا فقط. سيظهر لاحقًا في المقارنة." })
      ]),
      element("label", { class: "field" }, [
        element("span", { text: "الاسم الأول أو المختصر" }),
        nickname,
        element("small", { class: "fine-print", id: "nickname-help", text: "لا تكتب اسمًا قانونيًا كاملًا أو معلومات اتصال." })
      ]),
      element("label", { class: "check-field" }, [
        adult,
        element("span", { text: "أؤكد أنني بالغ/ة (18 عامًا أو أكثر)، وسأجيب عن نفسي داخل علاقة عاطفية حالية أو ملتزمة." })
      ]),
      element("button", { class: "button button--primary", type: "submit", text: progress ? "أكمل الاختبار" : "ابدأ الاختبار" }),
      progress ? element("button", {
        class: "button button--danger",
        type: "button",
        text: "حذف التقدّم الحالي",
        onclick: async () => {
          const confirmed = await confirmAction({
            title: "حذف التقدّم الحالي؟",
            message: "ستُحذف إجابات هذا الاختبار غير المكتمل وترتيب خياراته من هذا المتصفح.",
            confirmLabel: "احذف التقدّم",
            danger: true
          });
          if (confirmed) {
            storage.deleteProgress(test.id);
            render();
          }
        }
      }) : null,
      status
    ]);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const cleanName = storage.cleanNickname(nickname.value);
      if (!cleanName) {
        nickname.setAttribute("aria-invalid", "true");
        setStatus(status, "اكتب اسمًا أولًا أو اسمًا مختصرًا قبل البدء.", true);
        nickname.focus();
        return;
      }
      if (!adult.checked) {
        setStatus(status, "هذا الموقع مخصص للبالغين. أكّد أن عمرك 18 عامًا أو أكثر.", true);
        adult.focus();
        return;
      }
      startProgress(test, cleanName, progress);
    });
    side.append(form);
  }

  root.append(element("div", { class: "intro-grid spaced-lg" }, [main, side]));
  return root;
}

function shuffleIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const random = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[random]] = [indexes[random], indexes[index]];
  }
  return indexes;
}

function prepareQuizState(test) {
  const progress = storage.getProgress(test);
  if (!progress) return null;
  test.questions.forEach((question) => {
    if (!Array.isArray(progress.order[question.id])) {
      progress.order[question.id] = shuffleIndexes(question.options.length);
    }
  });
  const currentQuestion = test.questions[progress.index];
  if (progress.answers[currentQuestion?.id] !== undefined) {
    const firstUnanswered = test.questions.findIndex((question) => progress.answers[question.id] === undefined);
    if (firstUnanswered >= 0) progress.index = firstUnanswered;
  }
  storage.setProgress(test, progress);
  return { test, progress, elements: {}, optionButtons: [] };
}

async function deleteQuizProgress() {
  if (!quizState) return;
  const { test } = quizState;
  const confirmed = await confirmAction({
    title: "حذف التقدّم الحالي؟",
    message: "ستُحذف كل الإجابات غير المكتملة وترتيب الخيارات لهذا الاختبار من هذا المتصفح.",
    confirmLabel: "احذف التقدّم",
    danger: true
  });
  if (!confirmed) return;
  storage.deleteProgress(test.id);
  quizState = null;
  navigate(assessmentPath(test.id));
}

function renderQuiz(test) {
  quizState = prepareQuizState(test);
  if (!quizState) {
    return element("section", { class: "container narrow-page page-section view-enter" }, [
      element("div", { class: "surface-card stack" }, [
        element("h1", { text: "ابدأ من صفحة التعريف" }),
        element("p", { text: "نحتاج إلى اسم مختصر وتأكيد العمر قبل حفظ أي إجابة." }),
        element("a", { class: "button button--primary", href: assessmentPath(test.id), text: "العودة إلى بداية الاختبار" })
      ])
    ]);
  }

  const fill = element("i", { class: "progress-fill" });
  const progressBar = element("div", {
    class: "progress-track",
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": test.questions.length,
    "aria-valuenow": "0",
    "aria-label": "تقدّم الاختبار"
  }, [fill]);
  const position = element("span");
  const completion = element("span");
  const questionCard = element("article", { class: "surface-card quiz-card" });

  const root = element("section", { class: "container narrow-page quiz-page view-enter" }, [
    element("div", { class: "quiz-top" }, [
      element("div", { class: "split" }, [
        element("div", { class: "stack--sm" }, [
          element("a", { class: "eyebrow", href: assessmentPath(test.id), text: test.title }),
          element("span", { class: "fine-print", text: `إجابة ${quizState.progress.nickname}` })
        ]),
        element("button", { type: "button", class: "button button--danger button--small", text: "حذف التقدّم", onclick: deleteQuizProgress })
      ]),
      element("div", { class: "progress-shell" }, [
        element("div", { class: "progress-meta" }, [position, completion]),
        progressBar
      ])
    ]),
    questionCard,
    element("p", { class: "fine-print", text: "يمكنك استخدام الأرقام 1 و2 و3 للاختيار، وEnter للمتابعة، وBackspace للرجوع عندما لا يكون المؤشر داخل حقل كتابة." })
  ]);

  quizState.elements = { fill, progressBar, position, completion, questionCard };
  paintQuestion();
  return root;
}

function paintQuestion() {
  if (!quizState) return;
  const { test, progress, elements } = quizState;
  const question = test.questions[progress.index];
  const chosen = progress.answers[question.id];
  const answered = Object.keys(progress.answers).length;
  const percent = Math.round((answered / test.questions.length) * 100);

  elements.fill.style.width = `${percent}%`;
  elements.progressBar.setAttribute("aria-valuenow", answered);
  elements.progressBar.setAttribute("aria-valuetext", `أجبت عن ${answered} من ${test.questions.length} سؤالًا`);
  elements.position.textContent = `السؤال ${progress.index + 1} من ${test.questions.length}`;
  elements.completion.textContent = `اكتمل ${percent}٪`;
  clear(elements.questionCard);

  const promptId = `question-${question.id}`;
  const options = element("div", { class: "option-list", role: "radiogroup", "aria-labelledby": promptId });
  quizState.optionButtons = [];
  progress.order[question.id].forEach((optionIndex, visualIndex) => {
    const option = question.options[optionIndex];
    const button = element("button", {
      type: "button",
      class: "option-button",
      role: "radio",
      "aria-checked": chosen === option.s ? "true" : "false"
    }, [
      element("span", { class: "option-marker", "aria-hidden": "true" }),
      element("span", { text: option.t })
    ]);
    button.addEventListener("click", () => {
      progress.answers[question.id] = option.s;
      storage.setProgress(test, progress);
      paintQuestion();
      announce(`تم اختيار الإجابة ${visualIndex + 1}`);
    });
    quizState.optionButtons.push(button);
    options.append(button);
  });

  const previous = element("button", {
    type: "button",
    class: "button button--secondary",
    text: "السابق"
  });
  previous.disabled = progress.index === 0;
  previous.addEventListener("click", () => {
    if (progress.index <= 0) return;
    progress.index -= 1;
    storage.setProgress(test, progress);
    paintQuestion();
    elements.questionCard.focus({ preventScroll: true });
  });

  const isLast = progress.index === test.questions.length - 1;
  const next = element("button", {
    type: "button",
    class: "button button--primary",
    text: isLast ? "اعرض نتيجتي" : "التالي"
  });
  next.disabled = chosen === undefined;
  next.addEventListener("click", () => {
    if (progress.answers[question.id] === undefined) return;
    if (isLast) {
      finishQuiz();
      return;
    }
    progress.index += 1;
    storage.setProgress(test, progress);
    paintQuestion();
    elements.questionCard.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  quizState.nextButton = next;

  if (!progress.notes) progress.notes = {};
  const noteValue = progress.notes[question.id] || "";
  const noteArea = element("textarea", {
    class: "textarea free-note",
    placeholder: "اكتب ملاحظتك هنا… (اختياري ولا تؤثر على النتيجة)",
    "aria-label": "ملاحظة حرة",
    rows: "3"
  });
  noteArea.value = noteValue;
  noteArea.addEventListener("input", () => {
    progress.notes[question.id] = noteArea.value;
    storage.setProgress(test, progress);
  });

  elements.questionCard.setAttribute("tabindex", "-1");
  elements.questionCard.append(
    element("div", { class: "stack" }, [
      element("p", { class: "question-number", text: categoryFor(test).name }),
      element("h1", { class: "question-prompt", id: promptId, text: question.prompt }),
      options,
      element("details", { class: "note-toggle" }, [
        element("summary", { text: noteValue ? "ملاحظتك ✏️" : "أضف ملاحظة حرة (اختياري)" }),
        noteArea
      ])
    ]),
    element("div", { class: "quiz-nav" }, [previous, next])
  );
}

function evaluateConditionalNotes(test, score) {
  if (!Array.isArray(test.notes)) return [];
  const values = Object.fromEntries(score.dimensions.map((dimension) => [dimension.id, dimension]));
  return test.notes.filter((note) => (note.when || []).every((condition) => {
    const dimension = values[condition.dim];
    const value = condition.dim === "overall"
      ? score.overall
      : condition.metric === "raw"
        ? dimension?.percentage
        : dimension?.supportive;
    if (!Number.isFinite(value)) return false;
    if (condition.op === ">=") return value >= condition.value;
    if (condition.op === "<=") return value <= condition.value;
    if (condition.op === ">") return value > condition.value;
    if (condition.op === "<") return value < condition.value;
    return false;
  })).map((note) => note.text);
}

function finishQuiz() {
  if (!quizState) return;
  const { test, progress } = quizState;
  const firstMissing = test.questions.findIndex((question) => progress.answers[question.id] === undefined);
  if (firstMissing >= 0) {
    progress.index = firstMissing;
    storage.setProgress(test, progress);
    paintQuestion();
    announce("يوجد سؤال لم تُجب عنه بعد.");
    return;
  }

  const score = scoreAssessment(test, progress.answers);
  const safety = evaluateSafety(test, progress.answers, score);
  const result = {
    v: 1,
    testId: test.id,
    nickname: progress.nickname,
    dimensions: score.dimensions.map((dimension) => dimension.percentage),
    answers: { ...progress.answers },
    derived: score.derived,
    safety,
    completedAt: Date.now()
  };
  storage.setResult(test, result);
  storage.deleteProgress(test.id);

  const pendingCode = storage.getPendingCode(test.id);
  if (pendingCode) {
    const decoded = decodePairingCode(pendingCode, { expectedAssessmentId: test.id, availableIds: testIds });
    if (decoded.ok) {
      const ownCode = encodePairingCode(resultRecordForCode(test, result, score));
      const ownDecoded = decodePairingCode(ownCode, { expectedAssessmentId: test.id, availableIds: testIds });
      if (!isSameResult(ownDecoded.payload, decoded.payload)) {
        storage.setPair(test.id, decoded.code, decoded.payload);
        storage.deletePendingCode(test.id);
      }
    }
  }

  quizState = null;
  navigate(assessmentPath(test.id, "result"));
}

function attachmentSummary(test, score) {
  if (!Object.keys(score.derived).length) return null;
  if (test.id === "attachment-style") {
    const tendency = test.extraConfig?.tendencies?.[score.derived.tendency];
    const nearBoundary = Math.abs(score.derived.anxiety - test.extraConfig.threshold) <= test.extraConfig.borderline ||
      Math.abs(score.derived.avoidance - test.extraConfig.threshold) <= test.extraConfig.borderline;
    return element("section", { class: "surface-card stack" }, [
      element("h2", { text: "قراءة إضافية على بُعدين" }),
      element("div", { class: "stat-grid" }, [
        element("div", { class: "stat-card" }, [element("span", { text: "قلق التعلق" }), element("strong", { text: formatPercentage(score.derived.anxiety) })]),
        element("div", { class: "stat-card" }, [element("span", { text: "تجنّب التعلق" }), element("strong", { text: formatPercentage(score.derived.avoidance) })]),
        element("div", { class: "stat-card" }, [element("span", { text: "مؤشر الأمان المشتق" }), element("strong", { text: formatPercentage(score.derived.security) })])
      ]),
      tendency ? element("div", { class: "notice" }, [
        element("strong", { text: tendency.label }),
        element("p", { text: tendency.text }),
        nearBoundary ? element("p", { class: "fine-print", text: test.extraConfig.borderlineText }) : null
      ]) : null,
      element("p", { class: "fine-print", text: "القلق والتجنب بُعدان مستمران يمكن أن يرتفعا أو ينخفضا معًا. الوصف ميل حالي وليس هوية ثابتة أو تشخيصًا." })
    ]);
  }
  return element("section", { class: "surface-card stack" }, [
    element("h2", { text: "قراءة مركّزة" }),
    score.derived.anxiety !== undefined ? element("div", { class: "stat-card" }, [
      element("span", { text: "مؤشرات التعلق القلق المبلغ عنها ذاتيًا" }),
      element("strong", { text: formatPercentage(score.derived.anxiety) })
    ]) : null,
    score.derived.avoidance !== undefined ? element("div", { class: "stat-card" }, [
      element("span", { text: "مؤشرات التعلق التجنبي المبلغ عنها ذاتيًا" }),
      element("strong", { text: formatPercentage(score.derived.avoidance) })
    ]) : null,
    element("p", { class: "fine-print", text: "هذه المؤشرات تصف استراتيجيات قد تتغير مع الأمان والسياق والخبرة؛ لا تصف شخصية ثابتة." })
  ]);
}

function personalSummaryText(test, result, score) {
  const lines = [
    `${config.brand.name} — ${test.title}`,
    `الاسم المختصر: ${result.nickname}`,
    ""
  ];
  if (score.overall !== null) {
    lines.push(`${test.overallLabel || "المؤشر الإرشادي"}: ${formatPercentage(score.overall)}`);
    if (score.band?.label) lines.push(`الوصف: ${score.band.label}`);
    lines.push("");
  }
  score.dimensions.forEach((dimension) => {
    const direction = dimension.polarity === "negative" ? " — ارتفاعها يعني ارتفاع المؤشر المسمى" : "";
    lines.push(`• ${dimension.name}: ${formatPercentage(dimension.percentage)}${direction}`);
  });
  lines.push("", "اختبار تقييم ذاتي إرشادي مستند إلى إطار نفسي منشور؛ ليس تشخيصًا ولا بديلًا عن مختص.");
  lines.push("لا تتضمن هذه الخلاصة إجابات الأسئلة الخام.");
  return lines.join("\n");
}

function pairingSection(test, result, score) {
  const status = statusNode();
  const code = encodePairingCode(resultRecordForCode(test, result, score));
  const codeBox = element("div", { class: "code-box", tabindex: "0", text: code });
  const pair = storage.getPair(test.id);
  return element("section", { class: "surface-card stack" }, [
    element("div", { class: "split" }, [
      element("div", { class: "stack--sm" }, [
        element("p", { class: "eyebrow", text: "الخطوة التالية اختيارية" }),
        element("h2", { text: "قارن النتيجة مع شريكك" })
      ]),
      pair ? element("span", { class: "badge badge--success", text: "نتيجة مقترنة محفوظة" }) : null
    ]),
    element("p", { text: "أرسل هذا الرمز أو الرابط إلى شريكك ليكمل الاختبار نفسه. يحمل نسب الأبعاد والمؤشرات المشتقة الضرورية فقط، ولا يحمل إجاباتك." }),
    codeBox,
    element("div", { class: "cluster" }, [
      element("button", { type: "button", class: "button button--secondary", text: "انسخ رمز النتيجة", onclick: () => copyText(code, status, "تم نسخ رمز النتيجة.") }),
      element("button", { type: "button", class: "button button--secondary", text: "انسخ رابط المشاركة", onclick: () => copyText(shareLinkFor(test.id, code), status, "تم نسخ رابط المشاركة.") }),
      element("a", { class: "button button--primary", href: assessmentPath(test.id, pair ? "shared" : "partner"), text: pair ? "اعرض النتيجة المشتركة" : "أدخل رمز شريكك" })
    ]),
    status,
    element("div", { class: "notice notice--warning" }, [
      element("strong", { text: "ليس تشفيرًا أمنيًا" }),
      element("p", { text: "رمز النتيجة مشفّر ترميزيًا للنقل فقط، وليس تشفيرًا أمنيًا. شاركه مع الشخص المقصود فقط، ولا تنشره علنًا." })
    ])
  ]);
}

function renderResult(test) {
  const result = storage.getResult(test);
  if (!result) return renderIntro(test);
  const score = scoreFromPercentages(test, result.dimensions);
  const notes = evaluateConditionalNotes(test, score);
  const summary = personalSummaryText(test, result, score);
  const safety = result.safety || { level: "none", reasons: [], message: "" };
  const root = element("section", { class: "container result-page page-section stack--lg view-enter" }, [
    breadcrumbs([
      { label: "الاختبارات", href: "#/assessments" },
      { label: test.title, href: assessmentPath(test.id) },
      { label: "نتيجتي" }
    ])
  ]);

  const heroCopy = element("div", { class: "stack" }, [
    element("p", { class: "eyebrow", text: `نتيجة ${result.nickname}` }),
    element("h1", { text: test.title }),
    score.band?.label ? element("h2", { text: score.band.label }) : element("h2", { text: "ملفك عبر الأبعاد الستة" }),
    element("p", { class: "lede", text: score.band?.summary || "لا تُختزل هذه النتيجة في رقم واحد؛ اقرأ نمط الأبعاد الستة وما يبرز بينها." }),
    element("p", { class: "fine-print", text: "النسب تصف إجاباتك داخل هذه البنود فقط. لا توجد نقاط قطع سريرية أو معايير سكانية لهذه الصياغة العربية." })
  ]);
  root.append(element("header", { class: "surface-card result-hero" }, [
    heroCopy,
    score.overall !== null ? element("div", { class: "score-orbit", "aria-label": `${test.overallLabel || "المؤشر الإرشادي"}: ${formatPercentage(score.overall)}` }, [
      element("div", {}, [
        element("strong", { text: formatPercentage(score.overall) }),
        element("span", { text: test.scoreMode === "risk" ? "ارتفاع في المؤشرات المبلغ عنها ذاتيًا" : (test.overallLabel || "مؤشر إرشادي") })
      ])
    ]) : element("div", { class: "stat-card" }, [
      element("span", { text: "قراءة ملفية" }),
      element("strong", { text: "6 أبعاد" })
    ])
  ]));

  if (safety.level !== "none") {
    root.append(element("section", { class: `notice ${safety.level === "high" ? "notice--danger" : "notice--warning"}` }, [
      element("strong", { text: safety.level === "high" ? "رسالة خاصة تتعلق بالسلامة" : "وقفة سلامة" }),
      safety.reasons?.length ? element("p", { text: `الإشارات الملحوظة: ${safety.reasons.join("، ")}.` }) : null,
      element("p", { text: safety.message || "اختر وقتًا ومكانًا آمنين لأي حوار، واطلب دعمًا محليًا مؤهلًا عند الحاجة." })
    ]));
  }

  const attachment = attachmentSummary(test, score);
  if (attachment) root.append(attachment);

  root.append(element("section", { class: "surface-card stack" }, [
    element("div", { class: "stack--sm" }, [
      element("h2", { text: "الأبعاد الستة" }),
      element("p", { class: "fine-print", text: "كل نسبة مستقلة ولا يُفترض أن تجمع النسب إلى 100٪. في الأبعاد ذات المؤشر السلبي، ارتفاع النسبة يعني ارتفاع السلوك المسمى، لا نتيجة أفضل." })
    ]),
    createDimensionMeters(score.dimensions)
  ]));

  root.append(element("div", { class: "result-columns" }, [
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: test.scoreMode === "risk" ? "أنماط أكثر دعمًا" : "أوضح نقاط القوة" }),
      ...score.strengths.map((dimension) => element("article", { class: "insight-card insight-card--strength" }, [
        element("div", { class: "split" }, [
          element("h3", { text: dimension.name }),
          element("span", { class: "badge badge--success", text: formatPercentage(dimension.percentage) })
        ]),
        element("p", { text: dimension.interpretation })
      ])),
      score.band?.strength ? element("p", { class: "fine-print", text: score.band.strength }) : null
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: test.scoreMode === "risk" ? "مؤشرات تستحق المراجعة" : "مجالات أولى للتطوير" }),
      ...score.growth.map((dimension) => element("article", { class: "insight-card insight-card--growth" }, [
        element("div", { class: "split" }, [
          element("h3", { text: dimension.name }),
          element("span", { class: "badge badge--warning", text: formatPercentage(dimension.percentage) })
        ]),
        element("p", { text: dimension.interpretation }),
        element("p", {}, [element("strong", { text: "تجربة عملية: " }), dimension.definition.tip])
      ])),
      score.band?.growth ? element("p", { class: "fine-print", text: score.band.growth }) : null
    ])
  ]));

  root.append(element("section", { class: "surface-card stack" }, [
    element("h2", { text: "قراءة كل بُعد" }),
    element("div", { class: "dimension-detail-grid" }, score.dimensions.map((dimension) =>
      element("article", { class: "dimension-detail" }, [
        element("div", { class: "split" }, [
          element("h3", { text: dimension.name }),
          element("span", { class: "badge", text: formatPercentage(dimension.percentage) })
        ]),
        element("p", { text: dimension.definition.desc }),
        element("p", {}, [element("strong", { text: "قراءتك الحالية: " }), dimension.interpretation]),
        element("p", {}, [element("strong", { text: "خطوة صغيرة: " }), dimension.definition.tip])
      ])
    ))
  ]));

  const reflectionPrompts = safety.level === "high"
    ? [
        "ما الموقف الذي جعلني أشعر بعدم الأمان، ومن الشخص الموثوق الذي أستطيع التواصل معه على انفراد؟",
        "ما الحد الذي أحتاج إلى حمايته الآن دون الدخول في مواجهة أخشاها؟",
        "ما نوع الدعم المحلي المؤهل الذي يمكنني طلبه اليوم؟"
      ]
    : score.growth.map((dimension) => `في موقف حديث يتعلق بـ«${dimension.name}»، ما الذي فعلته أنا، وما خطوة واحدة أستطيع تغييرها قبل أن أطلب تغييرًا من شريكي؟`);
  root.append(element("section", { class: "surface-card stack" }, [
    element("h2", { text: safety.level === "high" ? "تأمل خاص وآمن" : "تمارين تأمل واقتراحات للعلاقة" }),
    element("ol", { class: "prompt-list" }, reflectionPrompts.map((prompt) => element("li", { text: prompt }))),
    safety.level === "none" ? element("p", { class: "fine-print", text: "عند الحديث، ابدأ بوصف خبرتك أنت: «لاحظت أنني… وأحتاج…» بدل تشخيص نية شريكك أو صفته." }) : null
  ]));

  if (notes.length) {
    root.append(element("section", { class: "surface-card stack" }, [
      element("h2", { text: "ملاحظات مرتبطة بنمط إجاباتك" }),
      ...notes.map((note) => element("div", { class: "notice notice--warning" }, [element("p", { text: note })]))
    ]));
  }

  root.append(pairingSection(test, result, score));
  const actionStatus = statusNode();
  root.append(element("section", { class: "surface-card stack" }, [
    element("div", { class: "notice" }, [
      element("p", { text: test.disclaimer }),
      element("p", { text: config.globalDisclaimer })
    ]),
    element("div", { class: "cluster" }, [
      element("button", { type: "button", class: "button button--secondary", text: "انسخ الملخص", onclick: () => copyText(summary, actionStatus, "تم نسخ ملخص النتيجة.") }),
      element("button", { type: "button", class: "button button--secondary", text: "صدّر ملخصًا نصيًا", onclick: () => exportText(`baynana-${test.id}.txt`, summary) }),
      element("button", { type: "button", class: "button button--danger", text: "إعادة الاختبار", onclick: () => restartAssessment(test) }),
      element("a", { class: "button button--primary", href: "#/assessments", text: "اختبار آخر" })
    ]),
    actionStatus
  ]));
  return root;
}

function renderPartner(test, incomingCode = "") {
  const result = storage.getResult(test);
  const status = statusNode();
  let incoming = null;
  let incomingError = "";

  if (incomingCode) {
    const decoded = decodePairingCode(incomingCode, { expectedAssessmentId: test.id, availableIds: testIds });
    if (decoded.ok) {
      incoming = decoded;
      storage.setPendingCode(test.id, decoded.code);
    } else {
      incomingError = decoded.message;
    }
  } else {
    const pendingCode = storage.getPendingCode(test.id);
    if (pendingCode) {
      const decoded = decodePairingCode(pendingCode, { expectedAssessmentId: test.id, availableIds: testIds });
      if (decoded.ok) incoming = decoded;
      else {
        incomingError = decoded.message;
        storage.deletePendingCode(test.id);
      }
    }
  }

  if (!result) {
    return element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
      breadcrumbs([
        { label: "الاختبارات", href: "#/assessments" },
        { label: test.title, href: assessmentPath(test.id) },
        { label: "نتيجة الشريك" }
      ]),
      element("div", { class: "surface-card stack" }, [
        incoming ? element("span", { class: "badge badge--success", text: "تم التحقق من رمز النتيجة" }) : element("span", { class: "badge", text: "المقارنة بعد إجابتك" }),
        element("h1", { text: incoming ? `${incoming.payload.nickname} أرسل لك نتيجة` : "أكمل الاختبار أولًا" }),
        element("p", { class: "lede", text: "أجب أنت عن نفسك بصورة مستقلة. لن تظهر لك إجابات الطرف الآخر الخام، وستُبنى المقارنة من نسب الأبعاد الستة فقط." }),
        incomingError ? element("div", { class: "notice notice--danger" }, [
          element("strong", { text: "تعذّر قبول الرمز" }),
          element("p", { text: incomingError })
        ]) : null,
        element("a", { class: "button button--primary", href: assessmentPath(test.id), text: "ابدأ بإجابتي" }),
        element("div", { class: "notice" }, [
          element("p", { text: "رمز النتيجة مشفّر ترميزيًا للنقل فقط، وليس تشفيرًا أمنيًا. حُفظ الرمز الوارد محليًا ليستمر بعد إعادة تحميل الصفحة." })
        ])
      ])
    ]);
  }

  const score = scoreFromPercentages(test, result.dimensions);
  const ownCode = encodePairingCode(resultRecordForCode(test, result, score));
  const ownDecoded = decodePairingCode(ownCode, { expectedAssessmentId: test.id, availableIds: testIds });

  if (incoming?.ok) {
    if (isSameResult(ownDecoded.payload, incoming.payload)) {
      incomingError = "هذا الرمز صادر من نتيجتك نفسها. استخدم الرمز الذي أنشأه شريكك بعد إجابته المستقلة.";
    } else {
      storage.setPair(test.id, incoming.code, incoming.payload);
      storage.deletePendingCode(test.id);
    }
  }

  const existingPair = storage.getPair(test.id);
  const peerInput = element("textarea", {
    class: "textarea",
    dir: "ltr",
    spellcheck: "false",
    placeholder: "BN1.…",
    "aria-label": "رمز نتيجة شريكك"
  });
  if (incomingCode && !incomingError) peerInput.value = incomingCode;

  const form = element("form", { class: "surface-card stack" }, [
    element("div", { class: "stack--sm" }, [
      element("p", { class: "eyebrow", text: "الطرف الثاني" }),
      element("h2", { text: "ألصق رمز شريكك" }),
      element("p", { class: "fine-print", text: "يجب أن يكون الرمز من الاختبار نفسه ومن إجابة مستقلة. يتحقق المتصفح من بصمته ونطاق نسبه قبل الحفظ." })
    ]),
    element("label", { class: "field" }, [
      element("span", { text: "رمز النتيجة" }),
      peerInput
    ]),
    element("button", { class: "button button--primary", type: "submit", text: "أنشئ المقارنة" }),
    status
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const decoded = decodePairingCode(peerInput.value, { expectedAssessmentId: test.id, availableIds: testIds });
    if (!decoded.ok) {
      peerInput.setAttribute("aria-invalid", "true");
      setStatus(status, decoded.message, true);
      return;
    }
    if (isSameResult(ownDecoded.payload, decoded.payload)) {
      peerInput.setAttribute("aria-invalid", "true");
      setStatus(status, "هذا رمز نتيجتك نفسها. اطلب من شريكك إكمال الاختبار بصورة مستقلة ثم أرسل رمزه.", true);
      return;
    }
    peerInput.removeAttribute("aria-invalid");
    storage.setPair(test.id, decoded.code, decoded.payload);
    storage.deletePendingCode(test.id);
    navigate(assessmentPath(test.id, "shared"));
  });

  const root = element("section", { class: "container result-page page-section stack--lg view-enter" }, [
    breadcrumbs([
      { label: "نتيجتي", href: assessmentPath(test.id, "result") },
      { label: "إدخال رمز الشريك" }
    ]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: test.title }),
      element("h1", { text: "اجمعا النتيجتين دون كشف الإجابات" }),
      element("p", { text: "أرسل رمزك إلى شريكك، أو ألصق رمزه هنا. كل العمليات تتم داخل هذا المتصفح." })
    ]),
    incomingError ? element("div", { class: "notice notice--danger" }, [
      element("strong", { text: "لم يُقبل الرمز الوارد" }),
      element("p", { text: incomingError })
    ]) : null,
    existingPair ? element("div", { class: "notice notice--success split" }, [
      element("div", {}, [
        element("strong", { text: `نتيجة ${existingPair.payload.nickname} مقترنة` }),
        element("p", { text: "يمكنك فتح الخريطة المشتركة الآن أو استبدال الرمز من النموذج أدناه." })
      ]),
      element("a", { class: "button button--primary", href: assessmentPath(test.id, "shared"), text: "اعرض المقارنة" })
    ]) : null,
    element("div", { class: "pair-layout" }, [
      element("section", { class: "surface-card stack" }, [
        element("div", { class: "stack--sm" }, [
          element("p", { class: "eyebrow", text: "رمزك أنت" }),
          element("h2", { text: `نتيجة ${result.nickname}` }),
          element("p", { class: "fine-print", text: "انسخ هذا الرمز وأرسله مباشرة إلى شريكك. لا تنشره علنًا." })
        ]),
        element("div", { class: "code-box", tabindex: "0", text: ownCode }),
        element("div", { class: "cluster" }, [
          element("button", { type: "button", class: "button button--secondary", text: "انسخ الرمز", onclick: () => copyText(ownCode, status, "تم نسخ رمزك.") }),
          element("button", { type: "button", class: "button button--secondary", text: "انسخ الرابط", onclick: () => copyText(shareLinkFor(test.id, ownCode), status, "تم نسخ رابط نتيجتك.") })
        ]),
        element("div", { class: "notice notice--warning" }, [
          element("p", { text: "رمز النتيجة مشفّر ترميزيًا للنقل فقط، وليس تشفيرًا أمنيًا." })
        ])
      ]),
      element("aside", { class: "surface-card stack" }, [
        element("h2", { text: "قبل الاقتران" }),
        element("ol", { class: "pair-how" }, [
          element("li", { text: "يتأكد كل شخص أنه أجاب عن نفسه دون تشاور على الاختيارات." }),
          element("li", { text: "يتبادلان رمز الاختبار نفسه فقط." }),
          element("li", { text: "لا يطلب أي طرف رؤية الإجابات الخام أو كلمات المرور." }),
          element("li", { text: "تُقرأ الفروق كبداية حوار، لا كحكم على من هو الأفضل." })
        ])
      ])
    ]),
    form
  ]);
  return root;
}

function sharedSummaryText(test, firstName, secondName, comparison) {
  const lines = [
    `${config.brand.name} — ${test.title}`,
    `الطرفان: ${firstName} و${secondName}`,
    `نسبة تقارب الإجابات: ${formatPercentage(comparison.similarity)}`,
    "هذه النسبة تصف تشابه الإجابات فقط، ولا تقيس جودة العلاقة أو مستقبلها.",
    "",
    "الأبعاد:"
  ];
  comparison.rows.forEach((row) => {
    lines.push(`• ${row.name}: ${firstName} ${formatPercentage(row.first)} · ${secondName} ${formatPercentage(row.second)} · ${row.label}`);
  });
  lines.push("", "أقرب ثلاثة أبعاد:");
  comparison.similarities.forEach((row) => lines.push(`• ${row.name} — فرق ${formatPercentage(row.gap)}`));
  lines.push("", "أوضح ثلاثة اختلافات:");
  comparison.differences.forEach((row) => lines.push(`• ${row.name} — فرق ${formatPercentage(row.gap)}`));
  lines.push("", "نتيجة إرشادية غير تشخيصية. لا تتضمن هذه الخلاصة إجابات الأسئلة الخام.");
  return lines.join("\n");
}

function personalizedPrompts(firstName, secondName, comparison, safetyLevel) {
  if (safetyLevel === "high") {
    return [
      `${firstName}، من الشخص الموثوق الذي يمكنك التواصل معه على انفراد إذا شعرت بالخوف أو الضغط؟`,
      `ما الحد الذي يحتاج كل شخص إلى حمايته دون بدء مواجهة غير آمنة؟`,
      `ما نوع الدعم المحلي المؤهل الذي يمكن طلبه الآن، وأين توجد مساحة آمنة للتواصل؟`
    ];
  }
  const prompts = comparison.differences.map((row) =>
    `في «${row.name}»، ما موقف حديث يصف فيه ${firstName} تجربته أولًا ثم ${secondName} تجربته، من دون تفسير نية الآخر؟`
  );
  const closest = comparison.similarities[0];
  if (closest) prompts.push(`ما السلوك المحدد الذي يساعد ${firstName} و${secondName} على الحفاظ على التقارب في «${closest.name}»؟`);
  const shared = comparison.sharedStrengths[0];
  if (shared && shared.id !== closest?.id) prompts.push(`كيف يمكن تحويل التقارب في «${shared.name}» إلى عادة صغيرة تدعمكما وقت الضغط؟`);
  prompts.push(`ما موضوع واحد يختار كل من ${firstName} و${secondName} تأجيله إذا ارتفع الانفعال، ومتى يعودان إليه؟`);
  return prompts.slice(0, 6);
}

function renderShared(test) {
  const result = storage.getResult(test);
  const storedPair = storage.getPair(test.id);
  if (!result) return renderIntro(test);
  if (!storedPair) return renderPartner(test);

  const decoded = decodePairingCode(storedPair.code, { expectedAssessmentId: test.id, availableIds: testIds });
  if (!decoded.ok) {
    storage.deletePair(test.id);
    return renderPartner(test);
  }

  const firstScore = scoreFromPercentages(test, result.dimensions);
  const secondScore = scoreFromPercentages(test, decoded.payload.dimensions);
  const comparison = compareScores(test, firstScore, secondScore);
  const firstName = result.nickname || "أنت";
  const secondName = decoded.payload.nickname || "شريكك";
  const safetyLevel = sharedSafetyLevel(result.safety, decoded.payload.derived);
  const prompts = personalizedPrompts(firstName, secondName, comparison, safetyLevel);
  const summary = sharedSummaryText(test, firstName, secondName, comparison);
  const status = statusNode();

  const root = element("section", { class: "container result-page page-section stack--lg view-enter" }, [
    breadcrumbs([
      { label: "نتيجتي", href: assessmentPath(test.id, "result") },
      { label: "النتيجة المشتركة" }
    ]),
    element("header", { class: "surface-card similarity-banner" }, [
      element("strong", { class: "similarity-value", text: formatPercentage(comparison.similarity) }),
      element("div", { class: "stack--sm" }, [
        element("p", { class: "eyebrow", text: `${firstName} و${secondName}` }),
        element("h1", { text: "نسبة تقارب الإجابات" }),
        element("p", { text: "تمثل مدى تشابه نسبكما في الأبعاد الستة فقط. ليست نسبة حب، ولا تقييمًا لجودة العلاقة، ولا تنبؤًا بالزواج أو الانفصال." })
      ])
    ])
  ]);

  if (safetyLevel !== "none") {
    root.append(element("section", { class: `notice ${safetyLevel === "high" ? "notice--danger" : "notice--warning"}` }, [
      element("strong", { text: safetyLevel === "high" ? "الأولوية للسلامة الفردية" : "ابدآ من الأمان" }),
      element("p", { text: sharedSafetyMessage(test, safetyLevel) })
    ]));
  }

  root.append(element("section", { class: "surface-card stack" }, [
    element("div", { class: "stack--sm" }, [
      element("h2", { text: "الأبعاد الستة جنبًا إلى جنب" }),
      element("p", { class: "fine-print", text: "0–10: تقارب واضح · 11–24: اختلاف متوسط · 25–100: اختلاف يستحق الحوار. هذه نطاقات وصف للمنتج وليست حدودًا علمية أو سريرية." })
    ]),
    createComparisonChart(comparison.rows, firstName, secondName)
  ]));

  root.append(element("div", { class: "result-columns" }, [
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "أقرب ثلاثة أبعاد" }),
      ...comparison.similarities.map((row) => element("article", { class: "insight-card insight-card--strength" }, [
        element("div", { class: "split" }, [
          element("h3", { text: row.name }),
          element("span", { class: "badge badge--success", text: `${row.label} · ${formatPercentage(row.gap)}` })
        ]),
        element("p", { text: row.gap <= 10 ? "تصف إجاباتكما هذا الجانب بصورة متقاربة." : "هذا أقرب نسبيًا من بقية الأبعاد، مع بقاء فرق يستحق الفهم." })
      ]))
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "أوضح ثلاثة اختلافات" }),
      ...comparison.differences.map((row) => element("article", { class: "insight-card insight-card--growth" }, [
        element("div", { class: "split" }, [
          element("h3", { text: row.name }),
          element("span", { class: "badge badge--warning", text: `${row.label} · ${formatPercentage(row.gap)}` })
        ]),
        element("p", { text: row.definition.pair?.gap || "اختلاف الإجابات لا يحدد من الأفضل؛ استخدماه لتسمية اختلاف الخبرة أو الاحتياج." })
      ]))
    ])
  ]));

  const strengths = comparison.sharedStrengths.length
    ? comparison.sharedStrengths
    : comparison.similarities.slice(0, 2);
  root.append(element("section", { class: "surface-card stack" }, [
    element("h2", { text: "نقاط قوة مشتركة" }),
    comparison.sharedStrengths.length
      ? element("div", { class: "dimension-detail-grid" }, strengths.map((row) =>
          element("article", { class: "insight-card insight-card--strength" }, [
            element("h3", { text: row.name }),
            element("p", { text: row.definition.pair?.bothHigh || "يجتمع التقارب مع نمط داعم نسبيًا لدى الطرفين في هذا البُعد." })
          ])
        ))
      : element("div", { class: "notice" }, [
          element("p", { text: "لا يظهر بُعد يجمع تقاربًا واضحًا ومستوى داعمًا مرتفعًا لدى الطرفين وفق هذه البنود. أقرب الأبعاد بينكما ليست حكمًا سلبيًا؛ هي نقطة بداية عملية للمراجعة." })
        ])
  ]));

  root.append(element("section", { class: "surface-card stack" }, [
    element("h2", { text: safetyLevel === "high" ? "مساحات مراجعة خاصة" : "مساحات محايدة للنقاش" }),
    element("div", { class: "dimension-detail-grid" }, comparison.discussionAreas.map((row) =>
      element("article", { class: "dimension-detail" }, [
        element("div", { class: "split" }, [
          element("h3", { text: row.name }),
          element("span", { class: "badge", text: comparisonLabel(row.gap) })
        ]),
        element("p", { text: safetyLevel === "high"
          ? "راجع هذا الجانب على انفراد ومع دعم آمن؛ لا تستخدم النتيجة لبدء مواجهة تخشاها."
          : (row.gap >= 11 ? row.definition.pair?.gap : row.definition.pair?.bothLow) || "اختارا مثالًا واحدًا حديثًا، وليصف كل شخص تجربته دون لوم أو تشخيص." })
      ])
    ))
  ]));

  root.append(element("section", { class: "surface-card stack" }, [
    element("div", { class: "stack--sm" }, [
      element("h2", { text: safetyLevel === "high" ? "أسئلة خاصة قبل أي حوار" : "أسئلة حوار مخصصة لكما" }),
      element("p", { class: "fine-print", text: safetyLevel === "high"
        ? "هذه الأسئلة للتفكير الفردي الآمن، وليست دعوة إلى مواجهة مشتركة الآن."
        : "اختارا سؤالًا واحدًا فقط في كل جلسة، وليجب كل شخص عن نفسه." })
    ]),
    element("ol", { class: "prompt-list" }, prompts.map((prompt) => element("li", { text: prompt })))
  ]));

  root.append(element("section", { class: "surface-card stack" }, [
    element("div", { class: "notice" }, [
      element("strong", { text: "تذكير غير تشخيصي" }),
      element("p", { text: config.globalDisclaimer }),
      element("p", { text: "النتيجة المقترنة محفوظة في هذا المتصفح فقط. إزالة الاقتران لا تحذف نتيجتك الفردية، ولا يمكن لأي طرف رؤية إجابات الآخر الخام." })
    ]),
    element("div", { class: "cluster" }, [
      element("button", { type: "button", class: "button button--secondary", text: "انسخ الملخص المشترك", onclick: () => copyText(summary, status, "تم نسخ الملخص المشترك.") }),
      element("button", { type: "button", class: "button button--secondary", text: "صدّر ملخصًا نصيًا", onclick: () => exportText(`baynana-${test.id}-shared.txt`, summary) }),
      element("button", {
        type: "button",
        class: "button button--danger",
        text: "أزل النتيجة المقترنة",
        onclick: async () => {
          const confirmed = await confirmAction({
            title: "إزالة نتيجة الشريك؟",
            message: "سيُحذف رمز الشريك من هذا المتصفح فقط، وستبقى نتيجتك الفردية محفوظة.",
            confirmLabel: "أزل الاقتران",
            danger: true
          });
          if (confirmed) {
            storage.deletePair(test.id);
            navigate(assessmentPath(test.id, "partner"));
          }
        }
      }),
      element("a", { class: "button button--primary", href: assessmentPath(test.id, "result"), text: "ارجع إلى نتيجتي" })
    ]),
    status
  ]));
  return root;
}

function renderAssessmentRoute(route) {
  const test = testsById.get(route.assessmentId);
  if (!test) return renderNotFound();
  // Assessments with safety gating get the quick-exit control on every subpage.
  setSensitiveView(Boolean(test.safety) || test.scoreMode === "risk");
  if (route.subpage === "quiz") return renderQuiz(test);
  if (route.subpage === "result") return renderResult(test);
  if (route.subpage === "partner") return renderPartner(test, route.code);
  if (route.subpage === "shared") return renderShared(test);
  return renderIntro(test);
}

function documentTitle(route) {
  if (route.name === "home") return `${config.brand.name} — ${config.brand.heading}`;
  if (route.name === "assessments") return `الاختبارات — ${config.brand.name}`;
  if (route.name === "how") return `كيف يعمل؟ — ${config.brand.name}`;
  if (route.name === "privacy") return `الخصوصية — ${config.brand.name}`;
  if (route.name === "science") return `الأساس العلمي — ${config.brand.name}`;
  if (route.name === "faq") return `الأسئلة الشائعة — ${config.brand.name}`;
  if (route.name === "assessment") return `${testsById.get(route.assessmentId)?.title || "اختبار"} — ${config.brand.name}`;
  if (route.name === "terms") return `الشروط والحدود — ${config.brand.name}`;
  if (route.name === "safety" || route.name === "safety-check") return `الخصوصية والأمان — ${config.brand.name}`;
  if (route.name === "premarital") return `الرحلة قبل الزواج — ${config.brand.name}`;
  if (route.name === "premarital-agenda") return `أجندة الحوار — ${config.brand.name}`;
  if (route.name === "alignment") return `${window.BAYNANA_ALIGNMENT.maps.find((map) => map.id === route.mapId)?.title || "خريطة توافق"} — ${config.brand.name}`;
  if (route.name.startsWith("questions")) return `أسئلة بيننا — ${config.brand.name}`;
  if (route.name === "know-me") return `قد إيه تعرفني؟ — ${config.brand.name}`;
  return `الصفحة غير موجودة — ${config.brand.name}`;
}

function closeMobileMenu() {
  const menu = document.querySelector("#mobile-menu");
  const button = document.querySelector("#menu-toggle");
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "افتح قائمة التنقل");
  document.body.classList.remove("menu-open");
}

function render() {
  const route = currentRoute();

  /*
   * A plain fragment such as the skip link's "#app" is not a route. Re-rendering
   * on it used to replace the page with the not-found view. Let the browser
   * handle the fragment natively and leave the current view untouched — unless
   * nothing has rendered yet, in which case fall back to home.
   */
  if (route.name === "fragment") {
    if (!app.children.length) navigate("#/", { replace: true });
    return;
  }

  quizState = route.name === "assessment" && route.subpage === "quiz" ? quizState : null;
  if (!(route.name === "alignment" && route.subpage === "answer")) resetAlignmentAnswerState();
  if (route.name !== "questions-session") endSession();
  setSensitiveView(false);
  closeMobileMenu();
  updateActiveNavigation(route);
  document.title = documentTitle(route);
  clear(app);

  let view;
  if (route.name === "home") view = renderHome();
  else if (route.name === "assessments") view = renderLibrary();
  else if (route.name === "how") view = renderHow();
  else if (route.name === "privacy") view = renderPrivacy();
  else if (route.name === "science") view = renderScience();
  else if (route.name === "faq") view = renderFaq();
  else if (route.name === "terms") view = renderTerms();
  else if (route.name === "safety") view = renderSafety();
  else if (route.name === "safety-check") view = renderSafetyCheck();
  else if (route.name === "premarital") view = renderPremarital();
  else if (route.name === "premarital-agenda") view = renderAgenda();
  else if (route.name === "alignment") view = renderAlignmentRoute(route);
  else if (route.name === "questions") view = renderQuestions();
  else if (route.name === "questions-category") view = renderQuestionsCategory(route.categoryId);
  else if (route.name === "questions-deck") view = renderQuestionsDeck(route.deckId);
  else if (route.name === "questions-session") view = renderQuestionsSession();
  else if (route.name === "questions-favorites") view = renderQuestionsFavorites();
  else if (route.name === "know-me") view = renderKnowMeRoute(route);
  else if (route.name === "assessment") view = renderAssessmentRoute(route);
  else view = renderNotFound();
  if (!view) view = renderNotFound();
  app.append(view);
  if (document.body.classList.contains("is-sensitive-view")) app.append(quickExitBar());
  window.scrollTo({ top: 0, behavior: "auto" });
  focusViewHeading();
}

/*
 * After a route change, focus moves to the new view's H1 so a screen-reader or
 * keyboard user lands on the page title rather than staying where they were.
 * The heading is made programmatically focusable only, so it never joins the
 * tab order.
 */
function focusViewHeading() {
  const heading = app.querySelector("h1");
  const target = heading || app;
  if (heading && !heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

async function requestDeleteAllData() {
  const confirmed = await confirmAction({
    title: "حذف كل بيانات «بيننا»؟",
    message: "سيُحذف التقدّم والنتائج والأسماء والاقترانات واختيار المظهر من هذا المتصفح. لا يمكن التراجع عن ذلك.",
    confirmLabel: "احذف كل البيانات",
    danger: true
  });
  if (!confirmed) return;
  storage.deleteAll();
  clearKnowledgeSession();
  document.documentElement.removeAttribute("data-theme");
  quizState = null;
  announce("تم حذف كل بيانات بيننا المحلية.");
  navigate("#/", { replace: true });
}

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else document.documentElement.removeAttribute("data-theme");
  const button = document.querySelector("#theme-toggle");
  const dark = theme === "dark" || (!theme && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  button.setAttribute("aria-label", dark ? "تفعيل المظهر الفاتح" : "تفعيل المظهر الداكن");
}

function initializeShell() {
  document.querySelectorAll("[data-brand-name]").forEach((node) => { node.textContent = config.brand.name; });
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  applyTheme(storage.getTheme());

  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const stored = storage.getTheme();
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const currentlyDark = stored ? stored === "dark" : systemDark;
    const next = currentlyDark ? "light" : "dark";
    storage.setTheme(next);
    applyTheme(next);
    announce(next === "dark" ? "تم تفعيل المظهر الداكن" : "تم تفعيل المظهر الفاتح");
  });

  const menu = document.querySelector("#mobile-menu");
  const menuButton = document.querySelector("#menu-toggle");
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menu.hidden = open;
    menuButton.setAttribute("aria-expanded", String(!open));
    menuButton.setAttribute("aria-label", open ? "افتح قائمة التنقل" : "أغلق قائمة التنقل");
    document.body.classList.toggle("menu-open", !open);
    if (!open) menu.querySelector("a")?.focus();
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });

  /*
   * Escape closes the mobile menu and returns focus to its toggle. The
   * quick-exit handler ignores Escape while the menu is open, so the two
   * Escape behaviours cannot collide.
   */
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (menuButton.getAttribute("aria-expanded") !== "true") return;
    closeMobileMenu();
    menuButton.focus();
  });

  document.querySelector("#footer-delete-data").addEventListener("click", requestDeleteAllData);

  /*
   * Quick exit. Pressing Escape twice in quick succession, or activating the
   * visible control on a sensitive view, covers the page, purges sensitive
   * session state, and replaces the history entry with a neutral destination.
   */
  createQuickExit({
    destination: config.quickExitDestination,
    onExit: () => {
      storage.clearSession();
      clearKnowledgeSession();
    }
  });
  window.addEventListener("hashchange", render);
  document.addEventListener("keydown", (event) => {
    if (!quizState) return;
    const tagName = event.target?.tagName || "";
    const editing = ["INPUT", "TEXTAREA", "SELECT"].includes(tagName) || event.target?.isContentEditable;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const choiceMap = { "1": 0, "2": 1, "3": 2, "١": 0, "٢": 1, "٣": 2 };
    if (!editing && Object.hasOwn(choiceMap, event.key)) {
      quizState.optionButtons[choiceMap[event.key]]?.click();
      event.preventDefault();
    } else if (!editing && event.key === "Enter" && quizState.nextButton && !quizState.nextButton.disabled) {
      quizState.nextButton.click();
      event.preventDefault();
    } else if (!editing && event.key === "Backspace" && quizState.progress.index > 0) {
      quizState.progress.index -= 1;
      storage.setProgress(quizState.test, quizState.progress);
      paintQuestion();
      event.preventDefault();
    }
  });
}

initializeShell();
render();
