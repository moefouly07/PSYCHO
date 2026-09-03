/*
 * Premarital journey views and the alignment-map flow.
 *
 * The journey never computes a global relationship, marriage, or compatibility
 * score. The discussion agenda is built only from topics the users explicitly
 * add, and private safety answers can never reach it.
 */

import { storage } from "./storage.js";
import {
  element, clear, announce, statusNode, setStatus, sectionHeading, breadcrumbs,
  copyText, exportText, confirmAction, isolatedCode
} from "./dom.js";
import {
  STATUS, compareAlignment, buildCategoryAggregates, compareCategoryAggregates,
  encodeAlignmentCode, decodeAlignmentCode, isSameAlignmentResult, alignmentShareLink,
  labelFor
} from "./alignment.js";
import { assertNoSafetyContent, setSensitiveView, quickExit, quickExitLimitations } from "./safety.js";
import { navigate, alignmentPath, assessmentPath } from "./router.js";

const journey = window.BAYNANA_PREMARITAL;
const alignmentData = window.BAYNANA_ALIGNMENT;
const assessmentData = window.BAYNANA_DATA;

const mapsById = new Map(alignmentData.maps.map((map) => [map.id, map]));
const mapIds = new Set(alignmentData.maps.map((map) => map.id));
const testsById = new Map(assessmentData.tests.map((test) => [test.id, test]));

const journeyState = { filter: "all" };
let answerState = null;

const IMPORTANCE = alignmentData.importanceLevels;
const CLASSIFICATION = alignmentData.classificationLabels;

/* ------------------------------------------------------------------ status */

function moduleStatus(module) {
  if (module.kind === "assessment") {
    const test = testsById.get(module.refId);
    if (!test) return { id: "unavailable", label: "غير متاح" };
    if (storage.getResult(test)) return { id: "done", label: "مكتمل" };
    const progress = storage.getProgress(test);
    const answered = Object.keys(progress?.answers || {}).length;
    if (answered) return { id: "active", label: `${answered} من ${test.questions.length}` };
    return { id: "new", label: "لم يبدأ" };
  }
  if (module.kind === "alignment") {
    const map = mapsById.get(module.refId);
    if (!map) return { id: "unavailable", label: "غير متاح" };
    const result = storage.getAlignmentResult(map);
    if (result && !result.stale && result.completedAt) return { id: "done", label: "مكتمل" };
    const progress = storage.getAlignmentProgress(map);
    const answered = Object.keys(progress?.answers || {}).length;
    if (answered) return { id: "active", label: `${answered} من ${map.items.length}` };
    return { id: "new", label: "لم يبدأ" };
  }
  return { id: "new", label: "لم يبدأ" };
}

function kindMeta(kindId) {
  return journey.kinds.find((kind) => kind.id === kindId) || journey.kinds[0];
}

function statusBadge(status) {
  const tone = status.id === "done" ? "badge--success" : status.id === "active" ? "badge--warning" : "";
  /* Status is carried by text, never by colour alone. */
  return element("span", { class: `badge ${tone}`.trim(), text: status.label });
}

function moduleCard(domain) {
  const module = domain.canonical;
  const status = moduleStatus(module);
  const kind = kindMeta(module.kind);
  return element("article", { class: `journey-card journey-card--${module.kind}` }, [
    element("div", { class: "journey-card-top" }, [
      element("span", { class: "badge", text: kind.label }),
      statusBadge(status)
    ]),
    element("div", { class: "stack--sm" }, [
      element("p", { class: "eyebrow", text: `النطاق ${domain.number} · ${domain.title}` }),
      element("h3", { text: module.title }),
      element("p", { text: module.short })
    ]),
    element("p", { class: "fine-print", text: `نحو ${module.minutes} دقائق${module.optional ? " · اختيارية" : ""}${module.sensitivity !== "standard" ? " · محتوى حساس" : ""}` }),
    element("div", { class: "cluster" }, [
      element("a", {
        class: "button button--primary button--small",
        href: module.route,
        text: status.id === "done" ? "اعرض النتيجة" : status.id === "active" ? "أكمل" : "ابدأ"
      }),
      domain.supporting.length
        ? element("details", { class: "supporting-details" }, [
            element("summary", { text: "وحدات داعمة اختيارية" }),
            element("ul", { class: "stack--sm" }, domain.supporting.map((id) => {
              const test = testsById.get(id);
              return test ? element("li", {}, [element("a", { href: assessmentPath(id), text: test.title })]) : null;
            }))
          ])
        : null
    ])
  ]);
}

function matchesFilter(domain) {
  const module = domain.canonical;
  if (journeyState.filter === "all") return true;
  if (journeyState.filter === "skill") return module.track === "skill";
  if (journeyState.filter === "decision") return module.track === "decision";
  if (journeyState.filter === "recommended") return journey.recommendedKeys.includes(module.key);
  if (journeyState.filter === "sensitive") return module.sensitivity !== "standard";
  if (journeyState.filter === "private") return false;
  return true;
}

function kindLegend() {
  return element("section", { class: "surface-card stack" }, [
    element("div", { class: "stack--sm" }, [
      element("h2", { text: "أربعة أنواع من المحتوى، وليست متكافئة" }),
      element("p", { class: "fine-print", text: "الفرق بينها ليس شكليًا: ما يُقاس يختلف عمّا يُسجَّل، وما يُسجَّل يختلف عمّا يُقال في حوار." })
    ]),
    element("dl", { class: "kind-legend" }, journey.kinds.flatMap((kind) => [
      element("dt", { text: kind.label }),
      element("dd", { text: kind.description })
    ])),
    element("div", { class: "notice notice--warning" }, [
      element("strong", { text: "ولا واحد منها مقياس نفسي مُقنَّن" }),
      element("p", { text: "المقياس النفسي المُقنَّن أداة خضعت لتحقق سيكومتري ومعايير سكانية على عينة محددة. لا شيء في بيننا كذلك: التقييمات السلوكية هنا أدوات تأمل أصلية مستندة إلى أطر منشورة، والخرائط تسجيل محايد لتفضيلات، والأسئلة نشاط حواري، والتحدي لعبة تعرّف داخل الجلسة." }),
      element("a", { class: "text-button", href: "#/science", text: "اقرأ الأساس العلمي والحدود" })
    ])
  ]);
}

export function renderPremarital() {
  setSensitiveView(false);
  const root = element("section", { class: "container page-section stack--lg view-enter" });
  const doneCount = journey.domains.filter((domain) => moduleStatus(domain.canonical).id === "done").length;
  const activeCount = journey.domains.filter((domain) => moduleStatus(domain.canonical).id === "active").length;

  root.append(element("header", { class: "section-heading" }, [
    element("p", { class: "eyebrow", text: "14 نطاقًا · بلا درجة توافق" }),
    element("h1", { text: journey.title }),
    element("p", { class: "lede", text: journey.intro })
  ]));

  root.append(element("div", { class: "journey-progress surface-card" }, [
    element("div", { class: "stat-grid" }, [
      element("div", { class: "stat-card" }, [element("span", { text: "مكتمل" }), element("strong", { text: `${doneCount} من ${journey.domains.length}` })]),
      element("div", { class: "stat-card" }, [element("span", { text: "قيد الإكمال" }), element("strong", { text: String(activeCount) })]),
      element("div", { class: "stat-card" }, [element("span", { text: "الوقت التقديري للرحلة كاملة" }), element("strong", { text: `نحو ${journey.estimatedMinutes} دقيقة` })])
    ]),
    element("p", { class: "fine-print", text: "الوقت تقدير لملء الوحدات فقط، ولا يشمل الحوار بينكما. أكملا الوحدات بأي ترتيب؛ الترتيب المعروض اقتراح لا قيد." })
  ]));

  root.append(kindLegend());

  const grid = element("div", { class: "journey-grid" });
  const filterRow = element("div", { class: "chips", role: "group", "aria-label": "تصفية وحدات الرحلة" });
  const countLine = element("p", { class: "fine-print", role: "status", "aria-live": "polite" });

  function paint() {
    clear(grid);
    if (journeyState.filter === "private") {
      grid.append(element("article", { class: "surface-card stack" }, [
        element("h3", { text: "مراجعة خاصة للسلامة" }),
        element("p", { text: "أسئلة قصيرة تُجاب على انفراد. لا تُحفظ في هذا المتصفح بعد إغلاق الجلسة، ولا تدخل في أي نتيجة مشتركة ولا في أجندة الحوار ولا في أي رمز أو ملف مُصدَّر." }),
        element("a", { class: "button button--primary button--small", href: journey.privateSafetyRoute, text: "افتح المراجعة الخاصة" })
      ]));
      countLine.textContent = "تظهر الآن وحدة خاصة واحدة.";
      return;
    }
    const visible = journey.domains.filter(matchesFilter);
    visible.forEach((domain) => grid.append(moduleCard(domain)));
    countLine.textContent = `يظهر الآن ${visible.length} من ${journey.domains.length} نطاقًا.`;
  }

  journey.filters.forEach((filter) => {
    const chip = element("button", {
      type: "button",
      class: "chip",
      "aria-pressed": journeyState.filter === filter.id ? "true" : "false",
      text: filter.label
    });
    chip.addEventListener("click", () => {
      journeyState.filter = filter.id;
      filterRow.querySelectorAll(".chip").forEach((button) => button.setAttribute("aria-pressed", String(button === chip)));
      paint();
    });
    filterRow.append(chip);
  });

  root.append(element("div", { class: "library-controls" }, [filterRow, countLine]));
  root.append(grid);
  paint();

  root.append(element("section", { class: "surface-card stack" }, [
    sectionHeading("رفقاء الرحلة", "نشاطان لا يُحسبان", "لا يُنتج أي منهما درجة، ولا يُقارن بنتائج التقييمات."),
    element("div", { class: "journey-grid" }, journey.companions.map((companion) =>
      element("article", { class: `journey-card journey-card--${companion.kind}` }, [
        element("span", { class: "badge", text: kindMeta(companion.kind).label }),
        element("h3", { text: companion.title }),
        element("p", { text: companion.short }),
        element("a", { class: "button button--secondary button--small", href: companion.route, text: "افتح" })
      ])
    ))
  ]));

  root.append(element("div", { class: "cluster" }, [
    element("a", { class: "button button--secondary", href: "#/premarital/agenda", text: "أجندة الحوار" }),
    element("a", { class: "button button--secondary", href: journey.privateSafetyRoute, text: "مراجعة خاصة للسلامة" })
  ]));

  root.append(element("div", { class: "notice" }, [element("p", { text: journey.disclaimer })]));
  return root;
}

/* ------------------------------------------------------------------ agenda */

export function addAgendaEntry(entry) {
  assertNoSafetyContent(entry, "discussion agenda");
  const existing = storage.getAgenda();
  if (existing.some((item) => item.id === entry.id)) return false;
  return storage.setAgenda([...existing, { ...entry, addedAt: Date.now() }]);
}

export function renderAgenda() {
  setSensitiveView(false);
  const entries = storage.getAgenda();
  const status = statusNode();
  const root = element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: journey.title, href: "#/premarital" }, { label: "أجندة الحوار" }]),
    element("div", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "ما اخترتماه أنتما فقط" }),
      element("h1", { text: "أجندة الحوار" }),
      element("p", { text: "لا تُضاف الموضوعات هنا تلقائيًا. كل بند أضفتماه بنقرة صريحة، ولا تدخل فيه أي إجابة من المراجعة الخاصة بالسلامة." })
    ])
  ]);

  if (!entries.length) {
    root.append(element("div", { class: "empty-state stack--sm" }, [
      element("h2", { text: "الأجندة فارغة" }),
      element("p", { text: "افتحا خريطة توافق أو مكتبة الأسئلة، ثم أضيفا الموضوعات التي تريدان الحديث فيها." }),
      element("a", { class: "button button--primary", href: "#/premarital", text: "ارجعا إلى الرحلة" })
    ]));
    return root;
  }

  const list = element("ol", { class: "stack--sm" });
  entries.forEach((entry) => {
    list.append(element("li", { class: "split" }, [
      element("div", { class: "stack--sm" }, [
        element("strong", { text: entry.label }),
        element("span", { class: "fine-print", text: entry.source })
      ]),
      element("button", {
        type: "button",
        class: "text-button",
        text: "أزل",
        onclick: () => {
          storage.setAgenda(storage.getAgenda().filter((item) => item.id !== entry.id));
          navigate("#/premarital/agenda");
        }
      })
    ]));
  });

  const agendaText = [
    "أجندة حوار — بيننا",
    "موضوعات اختارها الطرفان بأنفسهما. لا تتضمن هذه القائمة أي إجابة خاصة بالسلامة ولا أي إجابة على بند بعينه.",
    "",
    ...entries.map((entry, index) => `${index + 1}. ${entry.label}`)
  ].join("\n");
  assertNoSafetyContent(agendaText, "agenda export");

  root.append(element("section", { class: "surface-card stack" }, [
    element("h2", { text: `${entries.length} موضوعًا للحوار` }),
    list,
    element("div", { class: "cluster" }, [
      element("button", { type: "button", class: "button button--secondary", text: "انسخ الأجندة", onclick: () => copyText(agendaText, status, "تم نسخ الأجندة.") }),
      element("button", { type: "button", class: "button button--secondary", text: "صدّر نصًا", onclick: () => exportText("baynana-agenda.txt", agendaText) }),
      element("button", {
        type: "button",
        class: "button button--danger",
        text: "امسح الأجندة",
        onclick: async () => {
          const confirmed = await confirmAction({
            title: "مسح أجندة الحوار؟",
            message: "ستُحذف كل الموضوعات المضافة من هذا المتصفح.",
            confirmLabel: "امسح الأجندة",
            danger: true
          });
          if (confirmed) { storage.deleteAgenda(); navigate("#/premarital/agenda"); }
        }
      })
    ]),
    status,
    element("p", { class: "fine-print", text: "اختارا موضوعًا واحدًا في كل جلسة، وابدآ بوصف التجربة لا بتفسير نية الطرف الآخر." })
  ]));
  return root;
}

/* ------------------------------------------------------- alignment: session slots */

function sessionSlotKey(mapId, slot) {
  return storage.sessionKey.alignSlot(mapId, slot);
}

function sessionMode(mapId) {
  return storage.readSession(`${storage.sessionKey.prefix}align:${mapId}:mode`);
}

function setSessionMode(mapId, value) {
  const modeKey = `${storage.sessionKey.prefix}align:${mapId}:mode`;
  if (value) storage.writeSession(modeKey, value);
  else storage.removeSession(modeKey);
}

function clearAlignmentSession(mapId) {
  storage.removeSession(sessionSlotKey(mapId, "a"));
  storage.removeSession(sessionSlotKey(mapId, "b"));
  setSessionMode(mapId, null);
}

/* ------------------------------------------------------------- alignment: views */

function alignmentIntro(map) {
  const result = storage.getAlignmentResult(map);
  const progress = storage.getAlignmentProgress(map);
  const status = statusNode();
  const root = element("section", { class: "container page-section stack--lg view-enter" }, [
    breadcrumbs([
      { label: journey.title, href: "#/premarital" },
      { label: map.title }
    ]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "خريطة توافق محايدة · بلا درجات" }),
      element("h1", { text: map.title }),
      element("p", { class: "lede", text: map.description })
    ])
  ]);

  if (result?.stale) {
    root.append(element("div", { class: "notice notice--warning" }, [
      element("strong", { text: "إجابات محفوظة من نسخة أقدم" }),
      element("p", { text: "تغيّرت أسئلة هذه الخريطة منذ آخر مرة. لن نُعيد تفسير إجاباتك القديمة على الأسئلة الجديدة، لأن ذلك سيغيّر معناها. ابدآ الخريطة من جديد لتحصلا على مقارنة صحيحة." }),
      element("button", {
        type: "button",
        class: "button button--danger button--small",
        text: "ابدأ من جديد",
        onclick: () => { storage.restartAlignment(map.id); navigate(alignmentPath(map.id)); }
      })
    ]));
  }

  root.append(element("div", { class: "intro-grid" }, [
    element("div", { class: "intro-main stack" }, [
      element("article", { class: "surface-card stack" }, [
        element("h2", { text: "ما الذي ستراجعانه؟" }),
        element("ul", { class: "dimension-preview" }, map.categories.map((category) =>
          element("li", { text: category.name })
        )),
        element("p", { class: "fine-print", text: `${map.items.length} بندًا · نحو ${map.minutes} دقائق · لكل بند خيار «لم نتحدث في هذا بعد».` })
      ]),
      element("article", { class: "surface-card stack" }, [
        element("h2", { text: "كيف تُقرأ النتيجة؟" }),
        element("ul", { class: "stack--sm" }, [
          element("li", { text: "لا توجد درجة ولا نسبة توافق ولا إجابة أفضل من غيرها." }),
          element("li", { text: "يُصنَّف كل بند إلى: بداية مشتركة، أو قريبان، أو أولوية للحوار، أو لم نتحدث فيه بعد، أو خاص." }),
          element("li", { text: "إذا اختلفتما في بند وصفه أحدكما بأنه «أساسي للنقاش»، يظهر بوصفه أولوية حوار، لا علامة خطر." }),
          element("li", { text: "اختلاف التفضيلات في الأطفال أو الدين أو المال أو الأدوار موضوع قرار، وليس نقصًا في أحد." })
        ])
      ]),
      map.notice ? element("div", { class: "notice notice--warning" }, [
        element("strong", { text: "قبل أن تبدآ" }),
        element("p", { text: map.notice })
      ]) : null
    ]),
    element("aside", { class: "intro-side" }, [
      element("div", { class: "surface-card start-card stack" }, [
        result && !result.stale && result.completedAt
          ? element("div", { class: "stack--sm" }, [
              element("span", { class: "badge badge--success", text: "لديك إجابات محفوظة" }),
              element("h2", { text: `خريطة ${result.nickname || "محفوظة"}` }),
              element("a", { class: "button button--primary", href: alignmentPath(map.id, "result"), text: "اعرض خريطتي" }),
              element("button", {
                type: "button",
                class: "button button--danger",
                text: "ابدأ من جديد",
                onclick: async () => {
                  const confirmed = await confirmAction({
                    title: "إعادة هذه الخريطة؟",
                    message: "ستُحذف إجاباتك ومقارنتها المحفوظة على هذا المتصفح.",
                    confirmLabel: "احذف وابدأ",
                    danger: true
                  });
                  if (confirmed) { storage.restartAlignment(map.id); clearAlignmentSession(map.id); navigate(alignmentPath(map.id)); }
                }
              })
            ])
          : startForm(map, progress, status),
        status
      ])
    ])
  ]));
  return root;
}

function startForm(map, progress, status) {
  const nickname = element("input", {
    class: "input",
    type: "text",
    maxlength: "24",
    value: progress?.nickname || storage.getNickname(),
    placeholder: "مثال: نور",
    "aria-describedby": "align-nickname-help"
  });
  const adult = element("input", { type: "checkbox" });
  const form = element("form", { class: "stack" }, [
    element("div", { class: "stack--sm" }, [
      element("span", { class: "badge", text: progress ? "تقدّم محفوظ" : "إجابة خاصة" }),
      element("h2", { text: progress ? "أكمل من حيث توقفت" : "ابدأ بإجابتك أنت" })
    ]),
    element("label", { class: "field" }, [
      element("span", { text: "الاسم الأول أو المختصر" }),
      nickname,
      element("small", { class: "fine-print", id: "align-nickname-help", text: "لا تكتب اسمًا قانونيًا كاملًا أو معلومات اتصال." })
    ]),
    element("label", { class: "check-field" }, [
      adult,
      element("span", { text: map.adultOnly
        ? "أؤكد أنني بالغ/ة (18 عامًا أو أكثر) وأن هذه الوحدة اختيارية ويمكنني تخطي أي بند."
        : "أؤكد أنني بالغ/ة (18 عامًا أو أكثر) وأنني أجيب عن نفسي." })
    ]),
    element("button", { class: "button button--primary", type: "submit", text: progress ? "أكمل" : "ابدأ الخريطة" })
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
      setStatus(status, "هذه الوحدة للبالغين. أكّد أن عمرك 18 عامًا أو أكثر.", true);
      adult.focus();
      return;
    }
    storage.setNickname(cleanName);
    storage.setAlignmentProgress(map, {
      ...(progress || { answers: {}, importance: {}, index: 0, startedAt: Date.now() }),
      nickname: cleanName,
      contentVersion: map.contentVersion
    });
    setSessionMode(map.id, null);
    navigate(alignmentPath(map.id, "answer"));
  });
  return form;
}

function loadAnswerRecord(map) {
  const mode = sessionMode(map.id);
  if (mode === "b") {
    return storage.readSession(sessionSlotKey(map.id, "b"))
      || { mapId: map.id, nickname: "الطرف الثاني", answers: {}, importance: {}, index: 0, contentVersion: map.contentVersion };
  }
  return storage.getAlignmentProgress(map)
    || storage.getAlignmentResult(map)
    || null;
}

function saveAnswerRecord(map, record) {
  if (sessionMode(map.id) === "b") {
    storage.writeSession(sessionSlotKey(map.id, "b"), record);
    return;
  }
  storage.setAlignmentProgress(map, record);
}

function alignmentAnswer(map) {
  const record = loadAnswerRecord(map);
  if (!record) {
    return element("section", { class: "container narrow-page page-section view-enter" }, [
      element("div", { class: "surface-card stack" }, [
        element("h1", { text: "ابدآ من صفحة التعريف" }),
        element("p", { text: "نحتاج إلى اسم مختصر وتأكيد العمر قبل حفظ أي إجابة." }),
        element("a", { class: "button button--primary", href: alignmentPath(map.id), text: "العودة إلى بداية الخريطة" })
      ])
    ]);
  }

  const isSessionPartner = sessionMode(map.id) === "b";
  setSensitiveView(map.sensitivity !== "standard");

  const card = element("article", { class: "surface-card quiz-card", tabindex: "-1" });
  const position = element("span");
  const completion = element("span");
  const fill = element("i", { class: "progress-fill" });
  const bar = element("div", {
    class: "progress-track",
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": map.items.length,
    "aria-valuenow": "0",
    "aria-label": "تقدّم الخريطة"
  }, [fill]);

  answerState = { map, record, card, position, completion, fill, bar, isSessionPartner };

  const root = element("section", { class: "container narrow-page quiz-page view-enter" }, [
    element("div", { class: "quiz-top" }, [
      element("div", { class: "split" }, [
        element("div", { class: "stack--sm" }, [
          element("a", { class: "eyebrow", href: alignmentPath(map.id), text: map.title }),
          element("span", { class: "fine-print", text: isSessionPartner ? "إجابة الطرف الثاني — داخل هذه الجلسة فقط" : `إجابة ${record.nickname || ""}` })
        ]),
        element("span", { class: "badge", text: "بلا درجات" })
      ]),
      element("div", { class: "progress-shell" }, [
        element("div", { class: "progress-meta" }, [position, completion]),
        bar
      ])
    ]),
    card,
    element("p", { class: "fine-print", text: "لا توجد إجابة صحيحة. إذا لم تتحدثا في موضوع بعد، اختر «لم نتحدث في هذا بعد»." })
  ]);

  paintAlignmentItem();
  return root;
}

function paintAlignmentItem() {
  if (!answerState) return;
  const { map, record, card, position, completion, fill, bar } = answerState;
  const item = map.items[record.index];
  const answered = Object.keys(record.answers).length;
  const percent = Math.round((answered / map.items.length) * 100);

  fill.style.width = `${percent}%`;
  bar.setAttribute("aria-valuenow", String(answered));
  bar.setAttribute("aria-valuetext", `أجبت عن ${answered} من ${map.items.length} بندًا`);
  position.textContent = `البند ${record.index + 1} من ${map.items.length}`;
  completion.textContent = `اكتمل ${percent}٪`;
  clear(card);

  const category = map.categories.find((entry) => entry.id === item.cat);
  const promptId = `align-${item.id}`;
  const options = element("div", { class: "option-list", role: "radiogroup", "aria-labelledby": promptId });

  const choices = item.options.map((option) => ({ value: option.v, text: option.t }));
  if (item.allowUnsure) choices.push({ value: "unsure", text: alignmentData.specialAnswers.unsure.label, muted: true });
  if (item.allowPrivate) choices.push({ value: "private", text: alignmentData.specialAnswers.private.label, muted: true });

  choices.forEach((choice) => {
    const selected = record.answers[item.id] === choice.value;
    const button = element("button", {
      type: "button",
      class: `option-button${choice.muted ? " option-button--muted" : ""}`,
      role: "radio",
      "aria-checked": selected ? "true" : "false"
    }, [
      element("span", { class: "option-marker", "aria-hidden": "true" }),
      element("span", { text: choice.text })
    ]);
    button.addEventListener("click", () => {
      record.answers[item.id] = choice.value;
      saveAnswerRecord(map, record);
      paintAlignmentItem();
      announce(`تم اختيار: ${choice.text}`);
    });
    options.append(button);
  });

  const importanceRow = element("div", { class: "chips", role: "group", "aria-label": "ما مدى أهمية هذا البند بالنسبة إليك؟" });
  IMPORTANCE.forEach((level) => {
    const active = (record.importance[item.id] || "flexible") === level.id;
    const chip = element("button", {
      type: "button",
      class: "chip",
      "aria-pressed": active ? "true" : "false",
      title: level.hint,
      text: level.label
    });
    chip.addEventListener("click", () => {
      record.importance[item.id] = level.id;
      saveAnswerRecord(map, record);
      paintAlignmentItem();
    });
    importanceRow.append(chip);
  });

  const previous = element("button", { type: "button", class: "button button--secondary", text: "السابق" });
  previous.disabled = record.index === 0;
  previous.addEventListener("click", () => {
    if (record.index <= 0) return;
    record.index -= 1;
    saveAnswerRecord(map, record);
    paintAlignmentItem();
    card.focus({ preventScroll: true });
  });

  const isLast = record.index === map.items.length - 1;
  const next = element("button", {
    type: "button",
    class: "button button--primary",
    text: isLast ? "أنهِ الخريطة" : "التالي"
  });
  next.disabled = record.answers[item.id] === undefined;
  next.addEventListener("click", () => {
    if (record.answers[item.id] === undefined) return;
    if (isLast) { finishAlignment(); return; }
    record.index += 1;
    saveAnswerRecord(map, record);
    paintAlignmentItem();
    card.focus({ preventScroll: true });
  });

  card.append(
    element("div", { class: "stack" }, [
      element("p", { class: "question-number", text: category ? category.name : map.title }),
      element("h1", { class: "question-prompt", id: promptId, text: item.prompt }),
      options,
      element("div", { class: "stack--sm" }, [
        element("p", { class: "fine-print", text: "ما مدى أهمية هذا البند بالنسبة إليك؟" }),
        importanceRow
      ])
    ]),
    element("div", { class: "quiz-nav" }, [previous, next])
  );
}

function finishAlignment() {
  if (!answerState) return;
  const { map, record } = answerState;
  const missing = map.items.findIndex((item) => record.answers[item.id] === undefined);
  if (missing >= 0) {
    record.index = missing;
    saveAnswerRecord(map, record);
    paintAlignmentItem();
    announce("يوجد بند لم تُجب عنه بعد.");
    return;
  }

  if (sessionMode(map.id) === "b") {
    record.completedAt = Date.now();
    storage.writeSession(sessionSlotKey(map.id, "b"), record);
    answerState = null;
    navigate(alignmentPath(map.id, "compare"));
    return;
  }

  storage.setAlignmentResult(map, { ...record, completedAt: Date.now() });
  answerState = null;
  navigate(alignmentPath(map.id, "result"));
}

/* ------------------------------------------------------------ alignment: result */

function ownRecordOrNull(map) {
  const result = storage.getAlignmentResult(map);
  if (result && !result.stale && result.completedAt) return result;
  return null;
}

function categorySummaryTable(map, record) {
  const table = element("table", { class: "data-table" });
  table.append(element("caption", { text: "إجاباتك في كل مجال" }));
  table.append(element("thead", {}, [element("tr", {}, [
    element("th", { scope: "col", text: "المجال" }),
    element("th", { scope: "col", text: "بنود أجبت عنها" }),
    element("th", { scope: "col", text: "لم نتحدث فيها بعد" }),
    element("th", { scope: "col", text: "وصفتها بأنها أساسية" })
  ])]));
  const body = element("tbody");
  map.categories.forEach((category) => {
    const items = map.items.filter((item) => item.cat === category.id);
    const answered = items.filter((item) => typeof record.answers[item.id] === "number").length;
    const unsure = items.filter((item) => record.answers[item.id] === "unsure").length;
    const essential = items.filter((item) => record.importance[item.id] === "essential").length;
    body.append(element("tr", {}, [
      element("th", { scope: "row", text: category.name }),
      element("td", { text: `${answered} من ${items.length}` }),
      element("td", { text: String(unsure) }),
      element("td", { text: String(essential) })
    ]));
  });
  table.append(body);
  return element("div", { class: "table-scroll" }, [table]);
}

function alignmentResult(map) {
  const record = ownRecordOrNull(map);
  if (!record) return alignmentIntro(map);
  setSensitiveView(map.sensitivity !== "standard");

  const status = statusNode();
  const aggregates = buildCategoryAggregates(map, record);
  // encodeAlignmentCode guards the payload against private safety content itself.
  const code = encodeAlignmentCode({
    mapId: map.id,
    nickname: record.nickname,
    contentVersion: map.contentVersion,
    aggregates,
    completedAt: record.completedAt
  });

  const root = element("section", { class: "container result-page page-section stack--lg view-enter" }, [
    breadcrumbs([
      { label: journey.title, href: "#/premarital" },
      { label: map.title, href: alignmentPath(map.id) },
      { label: "خريطتي" }
    ]),
    element("header", { class: "surface-card stack" }, [
      element("p", { class: "eyebrow", text: `خريطة ${record.nickname}` }),
      element("h1", { text: map.title }),
      element("p", { class: "lede", text: "سُجّلت تفضيلاتك. لا توجد درجة ولا ترتيب ولا إجابة أفضل — الخطوة التالية هي المقارنة مع الطرف الآخر." })
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "ملخص إجاباتك" }),
      categorySummaryTable(map, record)
    ])
  ]);

  root.append(element("section", { class: "surface-card stack" }, [
    element("h2", { text: "طريقتان للمقارنة" }),
    element("div", { class: "compare-options" }, [
      element("article", { class: "insight-card" }, [
        element("h3", { text: "١ — على هذا الجهاز (تفصيلية)" }),
        element("p", { text: "يجيب الطرف الثاني على الجهاز نفسه، فتظهر مقارنة بندًا ببند. تُحفظ إجاباته داخل الجلسة فقط وتُمسح عند إغلاقها أو عند الخروج السريع." }),
        element("button", {
          type: "button",
          class: "button button--primary button--small",
          text: "ابدآ المقارنة على هذا الجهاز",
          onclick: () => {
            storage.writeSession(sessionSlotKey(map.id, "a"), { nickname: record.nickname, answers: record.answers, importance: record.importance });
            storage.removeSession(sessionSlotKey(map.id, "b"));
            navigate(alignmentPath(map.id, "handoff"));
          }
        })
      ]),
      element("article", { class: "insight-card" }, [
        element("h3", { text: "٢ — على جهازين (أقل تفصيلًا)" }),
        element("p", { text: "يحمل الرمز ملخصًا على مستوى المجالات فقط: متوسط الموضع في البنود المرتبة، وعدد ما لم تتحدثا فيه، وعدد ما وصفته بأنه أساسي. لا يحمل إجابتك على أي بند، ولا نص حر. هذا هو سبب كونه أقل تفصيلًا." }),
        element("div", { class: "code-box", tabindex: "0" }, [isolatedCode(code)]),
        element("div", { class: "cluster" }, [
          element("button", { type: "button", class: "button button--secondary button--small", text: "انسخ الرمز", onclick: () => copyText(code, status, "تم نسخ رمز الخريطة.") }),
          element("button", { type: "button", class: "button button--secondary button--small", text: "انسخ الرابط", onclick: () => copyText(alignmentShareLink(map.id, code), status, "تم نسخ الرابط.") }),
          element("a", { class: "button button--secondary button--small", href: alignmentPath(map.id, "partner"), text: "ألصق رمز الطرف الآخر" })
        ])
      ])
    ]),
    status,
    element("div", { class: "notice notice--warning" }, [
      element("p", { text: "الترميز ليس تشفيرًا أمنيًا. من يملك الرمز يستطيع قراءة ملخص المجالات، فشاركاه بينكما فقط." })
    ])
  ]));

  root.append(element("div", { class: "cluster" }, [
    element("a", { class: "button button--secondary", href: "#/premarital", text: "ارجعا إلى الرحلة" }),
    element("button", {
      type: "button",
      class: "button button--danger",
      text: "احذف هذه الخريطة",
      onclick: async () => {
        const confirmed = await confirmAction({
          title: "حذف إجابات هذه الخريطة؟",
          message: "ستُحذف إجاباتك والمقارنة المحفوظة لهذه الخريطة من هذا المتصفح.",
          confirmLabel: "احذف",
          danger: true
        });
        if (confirmed) { storage.restartAlignment(map.id); clearAlignmentSession(map.id); navigate(alignmentPath(map.id)); }
      }
    })
  ]));
  return root;
}

/* ----------------------------------------------------------- alignment: handoff */

function alignmentHandoff(map) {
  setSensitiveView(true);
  /*
   * The handoff screen intentionally renders NO answer from the first partner.
   * The previous view is removed from the DOM by the router before this runs,
   * and the session slot for partner A is never read here.
   */
  const root = element("section", { class: "container narrow-page page-section handoff-screen view-enter" }, [
    element("div", { class: "surface-card stack handoff-card" }, [
      element("p", { class: "eyebrow", text: "تسليم الجهاز" }),
      element("h1", { text: "سلّما الجهاز الآن" }),
      element("p", { class: "lede", text: "لا تظهر على هذه الشاشة أي إجابة من الطرف الأول. حين يكون الطرف الثاني جاهزًا، اضغطا زر البدء ليجيب عن نفسه." }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "تبقى إجابات الطرف الثاني داخل هذه الجلسة فقط ولا تُحفظ في المتصفح." }),
        element("li", { text: "لا يرى أي طرف إجابة الآخر قبل انتهاء الطرف الثاني." }),
        element("li", { text: "إغلاق التبويب أو الخروج السريع يمسح إجابات الجلسة فورًا." })
      ]),
      element("div", { class: "cluster" }, [
        element("button", {
          type: "button",
          class: "button button--primary",
          text: "أنا الطرف الثاني — ابدأ",
          onclick: () => {
            setSessionMode(map.id, "b");
            storage.writeSession(sessionSlotKey(map.id, "b"), {
              mapId: map.id,
              nickname: "الطرف الثاني",
              answers: {},
              importance: {},
              index: 0,
              contentVersion: map.contentVersion
            });
            navigate(alignmentPath(map.id, "answer"));
          }
        }),
        element("button", {
          type: "button",
          class: "button button--secondary",
          text: "إلغاء المقارنة على الجهاز",
          onclick: () => { clearAlignmentSession(map.id); navigate(alignmentPath(map.id, "result")); }
        })
      ])
    ])
  ]);
  return root;
}

/* ----------------------------------------------------------- alignment: compare */

function statusChip(status) {
  return element("span", { class: `badge status-${status}`, text: CLASSIFICATION[status] || status });
}

function alignmentCompare(map) {
  const slotA = storage.readSession(sessionSlotKey(map.id, "a"));
  const slotB = storage.readSession(sessionSlotKey(map.id, "b"));
  setSensitiveView(map.sensitivity !== "standard");

  if (!slotA || !slotB) {
    return element("section", { class: "container narrow-page page-section view-enter" }, [
      element("div", { class: "surface-card stack" }, [
        element("h1", { text: "انتهت جلسة المقارنة" }),
        element("p", { text: "تُحفظ إجابات المقارنة على هذا الجهاز داخل الجلسة فقط، وقد انتهت الجلسة أو مُسحت. أعيدا المقارنة من صفحة خريطتك." }),
        element("a", { class: "button button--primary", href: alignmentPath(map.id, "result"), text: "ارجعا إلى خريطتي" })
      ])
    ]);
  }

  const comparison = compareAlignment(map, slotA, slotB);
  setSessionMode(map.id, null);

  const root = element("section", { class: "container result-page page-section stack--lg view-enter" }, [
    breadcrumbs([
      { label: map.title, href: alignmentPath(map.id) },
      { label: "المقارنة على هذا الجهاز" }
    ]),
    element("header", { class: "surface-card stack" }, [
      element("p", { class: "eyebrow", text: "مقارنة تفصيلية · جلسة واحدة" }),
      element("h1", { text: map.title }),
      element("p", { class: "lede", text: "لا توجد نسبة توافق. هذه صورة لما تتفقان فيه، وما تقتربان فيه، وما يستحق حوارًا، وما لم تتحدثا فيه بعد." })
    ]),
    element("div", { class: "stat-grid" }, [
      element("div", { class: "stat-card" }, [element("span", { text: CLASSIFICATION.same }), element("strong", { text: String(comparison.counts.same) })]),
      element("div", { class: "stat-card" }, [element("span", { text: CLASSIFICATION.close }), element("strong", { text: String(comparison.counts.close) })]),
      element("div", { class: "stat-card" }, [element("span", { text: CLASSIFICATION.different }), element("strong", { text: String(comparison.counts.different) })]),
      element("div", { class: "stat-card" }, [element("span", { text: CLASSIFICATION.unsure }), element("strong", { text: String(comparison.counts.unsure) })]),
      element("div", { class: "stat-card" }, [element("span", { text: CLASSIFICATION.skipped }), element("strong", { text: String(comparison.counts.skipped) })])
    ])
  ]);

  if (comparison.priorities.length) {
    root.append(element("section", { class: "surface-card stack" }, [
      element("div", { class: "stack--sm" }, [
        element("h2", { text: "أولويات الحوار" }),
        element("p", { class: "fine-print", text: "بنود اختلفت فيها إجاباتكما ووصفها أحدكما على الأقل بأنها مهمة أو أساسية. هذه دعوة إلى حديث، لا علامة خطر." })
      ]),
      ...comparison.priorities.map((row) => priorityCard(map, row))
    ]));
  }

  comparison.categories.forEach((bucket) => {
    root.append(element("section", { class: "surface-card stack" }, [
      element("div", { class: "split" }, [
        element("h2", { text: bucket.category.name }),
        element("span", { class: "fine-print", text: `${bucket.counts.same} مشترك · ${bucket.counts.close} قريب · ${bucket.counts.different} للحوار` })
      ]),
      element("p", { class: "fine-print", text: bucket.category.desc }),
      element("div", { class: "table-scroll" }, [comparisonTable(bucket, slotA, slotB)]),
      element("p", {}, [element("strong", { text: "سؤال متابعة محايد: " }), bucket.category.followUp])
    ]));
  });

  root.append(element("div", { class: "cluster" }, [
    element("a", { class: "button button--primary", href: "#/premarital/agenda", text: "افتح أجندة الحوار" }),
    element("button", {
      type: "button",
      class: "button button--danger",
      text: "أنهِ الجلسة وامسح إجابات المقارنة",
      onclick: () => {
        clearAlignmentSession(map.id);
        announce("مُسحت إجابات المقارنة من هذه الجلسة.");
        navigate(alignmentPath(map.id, "result"));
      }
    })
  ]));

  root.append(element("div", { class: "notice" }, [
    element("p", { text: "تُمسح إجابات هذه المقارنة عند إغلاق التبويب أو الخروج السريع، ولا تُحفظ في هذا المتصفح." })
  ]));
  return root;
}

function priorityCard(map, row) {
  const added = storage.getAgenda().some((entry) => entry.id === `align:${map.id}:${row.item.id}`);
  const button = element("button", {
    type: "button",
    class: "button button--secondary button--small",
    text: added ? "مضاف إلى الأجندة" : "أضف إلى أجندة الحوار"
  });
  button.disabled = added;
  button.addEventListener("click", () => {
    addAgendaEntry({
      id: `align:${map.id}:${row.item.id}`,
      label: `${map.title} — ${row.item.prompt}`,
      source: "خريطة توافق"
    });
    button.textContent = "مضاف إلى الأجندة";
    button.disabled = true;
    announce("أُضيف الموضوع إلى أجندة الحوار.");
  });

  return element("article", { class: "insight-card insight-card--growth" }, [
    element("div", { class: "split" }, [
      element("h3", { text: row.item.prompt }),
      statusChip(row.status)
    ]),
    element("p", { class: "fine-print", text: `الأهمية: ${importanceLabel(row.ownImportance)} · ${importanceLabel(row.peerImportance)}` }),
    element("p", { text: "إجابتان مختلفتان في موضوع يراه أحدكما على الأقل مهمًا. ابدآ بوصف السبب خلف الإجابة، لا بمحاولة إقناع الطرف الآخر." }),
    button
  ]);
}

function importanceLabel(id) {
  return IMPORTANCE.find((level) => level.id === id)?.label || "مرن";
}

function comparisonTable(bucket, slotA, slotB) {
  const table = element("table", { class: "data-table" });
  table.append(element("caption", { text: `بنود ${bucket.category.name}` }));
  table.append(element("thead", {}, [element("tr", {}, [
    element("th", { scope: "col", text: "البند" }),
    element("th", { scope: "col", text: slotA.nickname || "الطرف الأول" }),
    element("th", { scope: "col", text: slotB.nickname || "الطرف الثاني" }),
    element("th", { scope: "col", text: "الوصف" })
  ])]));
  const body = element("tbody");
  bucket.rows.forEach((row) => {
    body.append(element("tr", {}, [
      element("th", { scope: "row", text: row.item.prompt }),
      element("td", { text: row.status === STATUS.skipped ? "خاص" : row.ownLabel }),
      element("td", { text: row.status === STATUS.skipped ? "خاص" : row.peerLabel }),
      element("td", { text: CLASSIFICATION[row.status] || row.status })
    ]));
  });
  table.append(body);
  return table;
}

/* ------------------------------------------------- alignment: two-device compare */

function alignmentPartner(map, incomingCode = "") {
  const record = ownRecordOrNull(map);
  const status = statusNode();
  setSensitiveView(map.sensitivity !== "standard");
  let incomingError = "";
  let incoming = null;

  if (incomingCode) {
    const decoded = decodeAlignmentCode(incomingCode, {
      expectedMapId: map.id,
      availableIds: mapIds,
      expectedContentVersion: map.contentVersion
    });
    if (decoded.ok) incoming = decoded;
    else incomingError = decoded.message;
  }

  if (!record) {
    return element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
      breadcrumbs([{ label: map.title, href: alignmentPath(map.id) }, { label: "رمز الطرف الآخر" }]),
      element("div", { class: "surface-card stack" }, [
        element("h1", { text: "أكملا الخريطة أولًا" }),
        element("p", { text: "أجب أنت عن نفسك أولًا، ثم ألصق رمز الطرف الآخر لتظهر المقارنة على مستوى المجالات." }),
        incomingError ? element("div", { class: "notice notice--danger" }, [element("p", { text: incomingError })]) : null,
        element("a", { class: "button button--primary", href: alignmentPath(map.id), text: "ابدأ بإجابتي" })
      ])
    ]);
  }

  const ownAggregates = buildCategoryAggregates(map, record);
  const ownPayload = { mapId: map.id, aggregates: ownAggregates, completedAt: record.completedAt };

  if (incoming) {
    if (isSameAlignmentResult(ownPayload, incoming.payload)) {
      incomingError = "هذا الرمز صادر من إجاباتك أنت. اطلب من الطرف الآخر إكمال الخريطة نفسها ثم أرسل رمزه.";
    } else {
      storage.setAlignmentPair(map.id, incoming.code, incoming.payload);
    }
  }

  const input = element("textarea", {
    class: "textarea",
    dir: "ltr",
    spellcheck: "false",
    placeholder: "BNA1.…",
    "aria-label": "رمز خريطة الطرف الآخر"
  });
  if (incomingCode && !incomingError) input.value = incomingCode;

  const form = element("form", { class: "surface-card stack" }, [
    element("div", { class: "stack--sm" }, [
      element("h2", { text: "ألصق رمز الطرف الآخر" }),
      element("p", { class: "fine-print", text: "يجب أن يكون الرمز من الخريطة نفسها ومن نسخة الأسئلة نفسها." })
    ]),
    element("label", { class: "field" }, [element("span", { text: "رمز الخريطة" }), input]),
    element("button", { class: "button button--primary", type: "submit", text: "أنشئ المقارنة" }),
    status
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const decoded = decodeAlignmentCode(input.value, {
      expectedMapId: map.id,
      availableIds: mapIds,
      expectedContentVersion: map.contentVersion
    });
    if (!decoded.ok) {
      input.setAttribute("aria-invalid", "true");
      setStatus(status, decoded.message, true);
      return;
    }
    if (isSameAlignmentResult(ownPayload, decoded.payload)) {
      input.setAttribute("aria-invalid", "true");
      setStatus(status, "هذا رمز إجاباتك أنت. اطلب رمز الطرف الآخر بعد إكماله الخريطة بصورة مستقلة.", true);
      return;
    }
    input.removeAttribute("aria-invalid");
    storage.setAlignmentPair(map.id, decoded.code, decoded.payload);
    navigate(alignmentPath(map.id, "shared"));
  });

  const existing = storage.getAlignmentPair(map.id);
  return element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: map.title, href: alignmentPath(map.id) }, { label: "المقارنة على جهازين" }]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "مقارنة أقل تفصيلًا — لأسباب تتعلق بالخصوصية" }),
      element("h1", { text: "المقارنة على جهازين" }),
      element("p", { text: "تُقارن هنا المجالات الستة فقط، لا البنود. لا يغادر جهازك أي جواب على بند بعينه، ولذلك تكون هذه المقارنة أقل تفصيلًا من المقارنة على جهاز واحد." })
    ]),
    incomingError ? element("div", { class: "notice notice--danger" }, [
      element("strong", { text: "لم يُقبل الرمز" }),
      element("p", { text: incomingError })
    ]) : null,
    existing ? element("div", { class: "notice notice--success split" }, [
      element("div", {}, [element("strong", { text: `رمز ${existing.payload.nickname} محفوظ` })]),
      element("a", { class: "button button--primary button--small", href: alignmentPath(map.id, "shared"), text: "اعرض المقارنة" })
    ]) : null,
    form
  ]);
}

function alignmentShared(map) {
  const record = ownRecordOrNull(map);
  const pair = storage.getAlignmentPair(map.id);
  if (!record) return alignmentIntro(map);
  if (!pair) return alignmentPartner(map);
  setSensitiveView(map.sensitivity !== "standard");

  const decoded = decodeAlignmentCode(pair.code, {
    expectedMapId: map.id,
    availableIds: mapIds,
    expectedContentVersion: map.contentVersion
  });
  if (!decoded.ok) {
    storage.deleteAlignmentPair(map.id);
    return alignmentPartner(map);
  }

  const ownAggregates = buildCategoryAggregates(map, record);
  const comparison = compareCategoryAggregates(map, ownAggregates, decoded.payload.aggregates);
  const ownName = record.nickname || "أنت";
  const peerName = decoded.payload.nickname || "الطرف الآخر";

  const table = element("table", { class: "data-table" });
  table.append(element("caption", { text: "مقارنة المجالات" }));
  table.append(element("thead", {}, [element("tr", {}, [
    element("th", { scope: "col", text: "المجال" }),
    element("th", { scope: "col", text: "الوصف" }),
    element("th", { scope: "col", text: "لم تتحدثا فيه بعد" })
  ])]));
  const body = element("tbody");
  comparison.rows.forEach((row) => {
    body.append(element("tr", {}, [
      element("th", { scope: "row", text: row.category.name }),
      element("td", { text: CLASSIFICATION[row.status] || row.status }),
      element("td", { text: String(row.notDiscussed ?? 0) })
    ]));
  });
  table.append(body);

  const root = element("section", { class: "container result-page page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: map.title, href: alignmentPath(map.id) }, { label: "المقارنة على جهازين" }]),
    element("header", { class: "surface-card stack" }, [
      element("p", { class: "eyebrow", text: `${ownName} و${peerName}` }),
      element("h1", { text: map.title }),
      element("p", { class: "lede", text: "مقارنة على مستوى المجالات فقط. لا توجد نسبة توافق، ولم تغادر أي إجابة على بند بعينه جهاز صاحبها." })
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "المجالات الستة" }),
      element("div", { class: "table-scroll" }, [table]),
      element("p", { class: "fine-print", text: "تُحسب المسافة من متوسط موضع الإجابات المرتبة في كل مجال. لا تدخل البنود غير المرتبة في هذا المتوسط، لأن ترتيبها لا معنى له." })
    ])
  ]);

  if (comparison.priorities.length) {
    root.append(element("section", { class: "surface-card stack" }, [
      element("h2", { text: "مجالات تستحق حوارًا أولًا" }),
      ...comparison.priorities.map((row) => {
        const entryId = `align-cat:${map.id}:${row.category.id}`;
        const added = storage.getAgenda().some((entry) => entry.id === entryId);
        const button = element("button", {
          type: "button",
          class: "button button--secondary button--small",
          text: added ? "مضاف إلى الأجندة" : "أضف إلى أجندة الحوار"
        });
        button.disabled = added;
        button.addEventListener("click", () => {
          addAgendaEntry({ id: entryId, label: `${map.title} — ${row.category.name}`, source: "مقارنة مجالات" });
          button.textContent = "مضاف إلى الأجندة";
          button.disabled = true;
        });
        return element("article", { class: "insight-card insight-card--growth" }, [
          element("h3", { text: row.category.name }),
          element("p", { text: row.category.followUp }),
          button
        ]);
      })
    ]));
  }

  root.append(element("div", { class: "cluster" }, [
    element("a", { class: "button button--primary", href: "#/premarital/agenda", text: "أجندة الحوار" }),
    element("button", {
      type: "button",
      class: "button button--danger",
      text: "أزل رمز الطرف الآخر",
      onclick: async () => {
        const confirmed = await confirmAction({
          title: "إزالة المقارنة؟",
          message: "سيُحذف رمز الطرف الآخر من هذا المتصفح، وتبقى إجاباتك محفوظة.",
          confirmLabel: "أزل",
          danger: true
        });
        if (confirmed) { storage.deleteAlignmentPair(map.id); navigate(alignmentPath(map.id, "partner")); }
      }
    })
  ]));
  return root;
}

/* -------------------------------------------------------------- quick exit bar */

export function quickExitBar() {
  return element("div", { class: "quick-exit-bar" }, [
    element("button", {
      type: "button",
      class: "button button--danger button--small",
      text: "خروج سريع",
      "aria-label": "خروج سريع: غادر الصفحة فورًا",
      onclick: () => quickExit()
    }),
    element("details", { class: "quick-exit-note" }, [
      element("summary", { text: "ما الذي لا يفعله الخروج السريع؟" }),
      element("ul", { class: "stack--sm" }, quickExitLimitations.map((line) => element("li", { text: line })))
    ])
  ]);
}

/* --------------------------------------------------------------- route entry */

export function renderAlignmentRoute(route) {
  const map = mapsById.get(route.mapId);
  if (!map) return null;
  if (route.subpage === "answer") return alignmentAnswer(map);
  if (route.subpage === "result") return alignmentResult(map);
  if (route.subpage === "handoff") return alignmentHandoff(map);
  if (route.subpage === "compare") return alignmentCompare(map);
  if (route.subpage === "partner") return alignmentPartner(map, route.code);
  if (route.subpage === "shared") return alignmentShared(map);
  return alignmentIntro(map);
}

export function resetAlignmentAnswerState() {
  answerState = null;
}

export { mapsById as alignmentMapsById, labelFor as alignmentLabelFor };
