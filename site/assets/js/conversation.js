/*
 * "أسئلة بيننا" — conversation library and session.
 *
 * Nothing here is scored. Written answers are never collected and never
 * stored: only question IDs are persisted, and only for favorites, discussed
 * marks, and a "talk about later" list.
 */

import { storage } from "./storage.js";
import {
  element, clear, announce, sectionHeading, breadcrumbs, normalizeArabic, confirmAction
} from "./dom.js";
import { setSensitiveView } from "./safety.js";
import { navigate } from "./router.js";
import { addAgendaEntry } from "./premarital.js";

const meta = window.BAYNANA_CONVERSATION_CATEGORIES;
const library = window.BAYNANA_CONVERSATION_QUESTIONS;
const deckData = window.BAYNANA_CONVERSATION_DECKS;

const categories = meta.categories;
const questions = library.questions;
const decks = deckData.decks;

const questionsById = new Map(questions.map((question) => [question.id, question]));
const categoriesById = new Map(categories.map((category) => [category.id, category]));
const depthLabel = new Map(meta.depthLevels.map((level) => [level.id, level.label]));
const sensitivityLabel = new Map(meta.sensitivityLevels.map((level) => [level.id, level.label]));
const modeLabel = new Map(meta.modes.map((mode) => [mode.id, mode.label]));
const groupLabel = new Map(meta.groups.map((group) => [group.id, group.label]));

/* Search index built once. The normalized copy never replaces displayed text. */
const searchIndex = new Map(questions.map((question) => [
  question.id,
  normalizeArabic(`${question.prompt} ${question.followUp} ${categoriesById.get(question.cat)?.name || ""}`)
]));

const libraryState = { query: "", category: "all", depth: "all", sensitivity: "all", maxMinutes: 0 };
let sessionState = null;

/* ------------------------------------------------------------------- lists */

function listHas(name, id) {
  return storage.getConversationList(name).includes(id);
}

function toggleList(name, id) {
  const current = storage.getConversationList(name);
  const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
  storage.setConversationList(name, next);
  return next.includes(id);
}

/* ------------------------------------------------------------------- cards */

function questionCard(question, options = {}) {
  const category = categoriesById.get(question.cat);
  const favorite = listHas("favorites", question.id);
  const discussed = listHas("discussed", question.id);

  const favoriteButton = element("button", {
    type: "button",
    class: "text-button",
    "aria-pressed": favorite ? "true" : "false",
    text: favorite ? "مفضّل ★" : "أضف إلى المفضلة"
  });
  favoriteButton.addEventListener("click", () => {
    const now = toggleList("favorites", question.id);
    favoriteButton.textContent = now ? "مفضّل ★" : "أضف إلى المفضلة";
    favoriteButton.setAttribute("aria-pressed", now ? "true" : "false");
  });

  const discussedButton = element("button", {
    type: "button",
    class: "text-button",
    "aria-pressed": discussed ? "true" : "false",
    text: discussed ? "تحدثنا فيه ✓" : "علّم كمتحدَّث فيه"
  });
  discussedButton.addEventListener("click", () => {
    const now = toggleList("discussed", question.id);
    discussedButton.textContent = now ? "تحدثنا فيه ✓" : "علّم كمتحدَّث فيه";
    discussedButton.setAttribute("aria-pressed", now ? "true" : "false");
  });

  return element("article", { class: "question-card" }, [
    element("div", { class: "question-card-top" }, [
      element("span", { class: "badge", text: category ? category.short : "سؤال" }),
      element("span", { class: "fine-print", text: `${groupLabel.get(question.group) || ""} · ${depthLabel.get(question.depth) || ""}` })
    ]),
    element("p", { class: "question-text", text: question.prompt }),
    question.followUp ? element("p", { class: "fine-print" }, [element("strong", { text: "متابعة: " }), question.followUp]) : null,
    element("p", { class: "fine-print", text: `${modeLabel.get(question.mode) || ""} · نحو ${question.minutes} دقائق · ${sensitivityLabel.get(question.sensitivity) || ""}` }),
    options.hideActions ? null : element("div", { class: "cluster" }, [favoriteButton, discussedButton])
  ]);
}

/* --------------------------------------------------------------- filtering */

function filterQuestions(pool) {
  const query = normalizeArabic(libraryState.query);
  return pool.filter((question) => {
    if (libraryState.category !== "all" && question.cat !== libraryState.category) return false;
    if (libraryState.depth !== "all" && question.depth !== libraryState.depth) return false;
    if (libraryState.sensitivity !== "all" && question.sensitivity !== libraryState.sensitivity) return false;
    if (libraryState.maxMinutes && question.minutes > libraryState.maxMinutes) return false;
    if (!query) return true;
    return (searchIndex.get(question.id) || "").includes(query);
  });
}

function filterControls(onChange) {
  const search = element("input", {
    class: "input",
    type: "search",
    value: libraryState.query,
    placeholder: "ابحث في الأسئلة…",
    "aria-label": "ابحث في أسئلة بيننا"
  });
  search.addEventListener("input", () => {
    libraryState.query = search.value;
    onChange();
  });

  function select(labelText, id, entries, stateKey, parse = (value) => value) {
    const node = element("select", { class: "input", id });
    entries.forEach((entry) => {
      const option = element("option", { value: String(entry.value), text: entry.label });
      if (String(libraryState[stateKey]) === String(entry.value)) option.selected = true;
      node.append(option);
    });
    node.addEventListener("change", () => {
      libraryState[stateKey] = parse(node.value);
      onChange();
    });
    return element("label", { class: "field", for: id }, [element("span", { text: labelText }), node]);
  }

  return element("div", { class: "library-controls stack--sm" }, [
    element("div", { class: "search-wrap" }, [search]),
    element("div", { class: "filter-row" }, [
      select("الفئة", "filter-category", [
        { value: "all", label: "كل الفئات" },
        ...categories.map((category) => ({ value: category.id, label: category.name }))
      ], "category"),
      select("العمق", "filter-depth", [
        { value: "all", label: "كل المستويات" },
        ...meta.depthLevels.map((level) => ({ value: level.id, label: level.label }))
      ], "depth"),
      select("الحساسية", "filter-sensitivity", [
        { value: "all", label: "كل الأنواع" },
        ...meta.sensitivityLevels.map((level) => ({ value: level.id, label: level.label }))
      ], "sensitivity"),
      select("الوقت التقديري", "filter-minutes", [
        { value: 0, label: "بلا حد" },
        { value: 3, label: "حتى 3 دقائق" },
        { value: 5, label: "حتى 5 دقائق" },
        { value: 7, label: "حتى 7 دقائق" }
      ], "maxMinutes", (value) => Number(value))
    ])
  ]);
}

/* -------------------------------------------------------------- library view */

export function renderQuestions() {
  setSensitiveView(false);
  const root = element("section", { class: "container page-section stack--lg view-enter" }, [
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: `${categories.length} فئة · ${questions.length} سؤالًا أصليًا` }),
      element("h1", { text: "أسئلة بيننا" }),
      element("p", { class: "lede", text: "مكتبة أسئلة للحديث بينكما. لا تُحسب إجابة، ولا تُقارن، ولا تُسجَّل. لكل شخص أن يمرّ على أي سؤال دون تفسير." })
    ]),
    element("div", { class: "notice" }, [
      element("strong", { text: "لا يسجّل الجهاز حديثكما" }),
      element("p", { text: "لا نحفظ أي إجابة مكتوبة أو صوتية. ما يُحفظ محليًا هو أرقام الأسئلة التي وضعتماها في المفضلة أو علّمتماها كمتحدَّث فيها أو أجّلتماها." })
    ])
  ]);

  root.append(element("section", { class: "stack" }, [
    sectionHeading("مجموعات جاهزة", "ابدآ بمجموعة", "كل مجموعة تشير إلى أسئلة من المكتبة نفسها، ولا تكرر نصها."),
    element("div", { class: "deck-grid" }, decks.map((deck) =>
      element("article", { class: "deck-card" }, [
        element("div", { class: "split" }, [
          element("h3", { text: deck.title }),
          element("span", { class: "badge", text: `${deck.questionIds.length} سؤالًا` })
        ]),
        element("p", { text: deck.description }),
        deck.adultOnly ? element("p", { class: "fine-print", text: "وحدة اختيارية للبالغين." }) : null,
        element("a", { class: "button button--secondary button--small", href: `#/questions/deck/${deck.id}`, text: "افتح المجموعة" })
      ])
    ))
  ]));

  const grid = element("div", { class: "question-grid" });
  const count = element("p", { class: "fine-print", role: "status", "aria-live": "polite" });

  function paint() {
    clear(grid);
    const filtered = filterQuestions(questions);
    if (!filtered.length) {
      grid.append(element("div", { class: "empty-state stack--sm" }, [
        element("h3", { text: "لا يوجد سؤال مطابق" }),
        element("p", { text: "جرّبا كلمة أقصر أو أزيلا أحد عوامل التصفية." })
      ]));
    } else {
      filtered.slice(0, 60).forEach((question) => grid.append(questionCard(question)));
    }
    count.textContent = filtered.length > 60
      ? `يظهر أول 60 من ${filtered.length} سؤالًا مطابقًا.`
      : `يظهر الآن ${filtered.length} من ${questions.length} سؤالًا.`;
  }

  root.append(element("section", { class: "stack" }, [
    sectionHeading("المكتبة كاملة", "ابحثا وصفّيا", "التصفية بالفئة والعمق والحساسية والوقت التقديري."),
    filterControls(paint),
    count,
    grid
  ]));

  root.append(element("section", { class: "stack" }, [
    sectionHeading("الفئات العشرون", "تصفّحا حسب الموضوع", ""),
    element("div", { class: "category-grid" }, categories.map((category) => {
      const total = questions.filter((question) => question.cat === category.id).length;
      return element("a", { class: "category-card", href: `#/questions/category/${category.id}` }, [
        element("h3", { text: category.name }),
        element("p", { class: "fine-print", text: category.description }),
        element("span", { class: "badge", text: `${total} سؤالًا` })
      ]);
    }))
  ]));

  root.append(element("div", { class: "cluster" }, [
    element("a", { class: "button button--primary", href: "#/questions/session", text: "ابدآ جلسة" }),
    element("a", { class: "button button--secondary", href: "#/questions/favorites", text: "المفضلة ولاحقًا" })
  ]));

  paint();
  return root;
}

export function renderQuestionsCategory(categoryId) {
  const category = categoriesById.get(categoryId);
  if (!category) return null;
  setSensitiveView(category.sensitivity === "intimate");
  const list = questions.filter((question) => question.cat === categoryId);

  return element("section", { class: "container page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: "أسئلة بيننا", href: "#/questions" }, { label: category.name }]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: `${list.length} سؤالًا` }),
      element("h1", { text: category.name }),
      element("p", { text: category.description })
    ]),
    category.sensitivity === "intimate" ? element("div", { class: "notice notice--warning" }, [
      element("p", { text: "فئة اختيارية للبالغين. يمكن لأي طرف تخطي أي سؤال دون تفسير، والمرور ليس رفضًا للحديث." })
    ]) : null,
    ...meta.groups.map((group) => {
      const groupQuestions = list.filter((question) => question.group === group.id);
      return element("section", { class: "stack" }, [
        sectionHeading(group.hint, group.label, ""),
        element("div", { class: "question-grid" }, groupQuestions.map((question) => questionCard(question)))
      ]);
    }),
    element("div", { class: "cluster" }, [
      element("button", {
        type: "button",
        class: "button button--primary",
        text: "ابدآ جلسة",
        onclick: () => startSession(list, `فئة: ${category.name}`)
      }),
      element("a", { class: "button button--secondary", href: "#/questions", text: "كل الأسئلة" })
    ])
  ]);
}

export function renderQuestionsDeck(deckId) {
  const deck = decks.find((entry) => entry.id === deckId);
  if (!deck) return null;
  setSensitiveView(deck.sensitivity === "intimate");
  const list = deck.questionIds.map((id) => questionsById.get(id)).filter(Boolean);

  return element("section", { class: "container page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: "أسئلة بيننا", href: "#/questions" }, { label: deck.title }]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: `${list.length} سؤالًا` }),
      element("h1", { text: deck.title }),
      element("p", { text: deck.description })
    ]),
    deck.adultOnly ? element("div", { class: "notice notice--warning" }, [
      element("p", { text: "مجموعة اختيارية للبالغين. المرور على أي سؤال مسموح دائمًا ولا يحتاج إلى سبب." })
    ]) : null,
    element("div", { class: "cluster" }, [
      element("button", { type: "button", class: "button button--primary", text: "ابدآ جلسة بهذه المجموعة", onclick: () => startSession(list, deck.title) })
    ]),
    element("div", { class: "question-grid" }, list.map((question) => questionCard(question)))
  ]);
}

export function renderQuestionsFavorites() {
  setSensitiveView(false);
  const favorites = storage.getConversationList("favorites").map((id) => questionsById.get(id)).filter(Boolean);
  const later = storage.getConversationList("later").map((id) => questionsById.get(id)).filter(Boolean);
  const discussed = storage.getConversationList("discussed").map((id) => questionsById.get(id)).filter(Boolean);

  const root = element("section", { class: "container page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: "أسئلة بيننا", href: "#/questions" }, { label: "المفضلة ولاحقًا" }]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "أرقام أسئلة فقط" }),
      element("h1", { text: "المفضلة ولاحقًا" }),
      element("p", { text: "تُحفظ أرقام الأسئلة فقط في هذا المتصفح. لم يُحفظ أي شيء ممّا قلتماه." })
    ])
  ]);

  function block(title, list, emptyText) {
    return element("section", { class: "stack" }, [
      element("h2", { text: `${title} (${list.length})` }),
      list.length
        ? element("div", { class: "question-grid" }, list.map((question) => questionCard(question)))
        : element("p", { class: "fine-print", text: emptyText })
    ]);
  }

  root.append(block("المفضلة", favorites, "لم تضيفا أي سؤال إلى المفضلة بعد."));
  root.append(block("للحديث لاحقًا", later, "لا توجد أسئلة مؤجلة."));
  root.append(block("تحدثنا فيها", discussed, "لم تعلّما أي سؤال كمتحدَّث فيه بعد."));

  root.append(element("div", { class: "cluster" }, [
    element("button", {
      type: "button",
      class: "button button--danger",
      text: "احذف قوائم الأسئلة",
      onclick: async () => {
        const confirmed = await confirmAction({
          title: "حذف قوائم الأسئلة؟",
          message: "ستُحذف المفضلة والمؤجلة والمتحدَّث فيها من هذا المتصفح.",
          confirmLabel: "احذف",
          danger: true
        });
        if (confirmed) { storage.deleteConversationData(); navigate("#/questions/favorites"); }
      }
    })
  ]));
  return root;
}

/* -------------------------------------------------------------- session view */

export function startSession(pool, label) {
  const items = pool.slice();
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  sessionState = {
    label,
    items,
    index: 0,
    passed: 0,
    seen: 0,
    answers: {},
    timerEnabled: false,
    timerSeconds: 120,
    remaining: 120,
    ticker: null
  };
  navigate("#/questions/session");
}

function stopTimer() {
  if (sessionState?.ticker) {
    window.clearInterval(sessionState.ticker);
    sessionState.ticker = null;
  }
}

export function endSession() {
  stopTimer();
  sessionState = null;
}

export function renderQuestionsSession() {
  if (!sessionState) {
    setSensitiveView(false);
    return element("section", { class: "container narrow-page page-section view-enter" }, [
      element("div", { class: "surface-card stack" }, [
        element("h1", { text: "ابدآ جلسة" }),
        element("p", { text: "اختارا مجموعة أو فئة أولًا، ثم ابدآ الجلسة. تُدار الجلسة داخل هذه الصفحة فقط ولا يُحفظ منها شيء." }),
        element("div", { class: "cluster" }, [
          element("button", { type: "button", class: "button button--primary", text: "جلسة من كل المكتبة", onclick: () => startSession(questions, "المكتبة كاملة") }),
          element("a", { class: "button button--secondary", href: "#/questions", text: "تصفّح المجموعات" })
        ])
      ])
    ]);
  }

  const question = sessionState.items[sessionState.index];
  setSensitiveView(question?.sensitivity === "intimate");

  const card = element("article", { class: "surface-card quiz-card", tabindex: "-1" });
  const progressLine = element("p", { class: "fine-print", role: "status", "aria-live": "polite" });
  const timerLine = element("p", { class: "fine-print" });

  const root = element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    element("div", { class: "split" }, [
      element("div", { class: "stack--sm" }, [
        element("p", { class: "eyebrow", text: "جلسة حوار" }),
        element("h1", { text: sessionState.label })
      ]),
      element("button", { type: "button", class: "button button--secondary button--small", text: "أنهِ الجلسة", onclick: () => { finishSessionView(root); } })
    ]),
    card,
    progressLine,
    timerLine
  ]);

  paintSessionQuestion(card, progressLine, timerLine, root);
  return root;
}

function paintSessionQuestion(card, progressLine, timerLine, root) {
  stopTimer();
  if (!sessionState) return;
  if (sessionState.index >= sessionState.items.length) {
    finishSessionView(root);
    return;
  }

  const question = sessionState.items[sessionState.index];
  const category = categoriesById.get(question.cat);
  // The first speaker alternates so neither person always answers first.
  const firstSpeaker = sessionState.index % 2 === 0 ? "الطرف الأول" : "الطرف الثاني";

  if (!sessionState.answers) sessionState.answers = {};
  const answerArea = element("textarea", {
    class: "textarea session-answer",
    placeholder: "اكتب إجابتك هنا… (اختياري)",
    "aria-label": "إجابتك على هذا السؤال",
    rows: "4"
  });
  if (sessionState.answers[question.id]) answerArea.value = sessionState.answers[question.id];
  answerArea.addEventListener("input", () => {
    sessionState.answers[question.id] = answerArea.value;
  });

  clear(card);
  card.append(element("div", { class: "stack" }, [
    element("div", { class: "split" }, [
      element("span", { class: "badge", text: category ? category.name : "سؤال" }),
      element("span", { class: "fine-print", text: `${depthLabel.get(question.depth) || ""} · نحو ${question.minutes} دقائق` })
    ]),
    element("p", { class: "fine-print", text: `يبدأ الإجابة: ${firstSpeaker}` }),
    element("h2", { class: "question-prompt", text: question.prompt }),
    question.followUp ? element("p", {}, [element("strong", { text: "متابعة: " }), question.followUp]) : null,
    question.sensitivity === "intimate"
      ? element("p", { class: "fine-print", text: "سؤال حميمي واختياري. المرور عليه لا يحتاج إلى سبب." })
      : null,
    answerArea
  ]));

  const favorite = listHas("favorites", question.id);
  const later = listHas("later", question.id);

  const actions = element("div", { class: "cluster" }, [
    element("button", {
      type: "button",
      class: "button button--primary",
      text: "التالي",
      onclick: () => {
        storage.setConversationList("discussed", [...storage.getConversationList("discussed"), question.id]);
        sessionState.seen += 1;
        sessionState.index += 1;
        paintSessionQuestion(card, progressLine, timerLine, root);
        card.focus({ preventScroll: true });
      }
    }),
    element("button", {
      type: "button",
      class: "button button--secondary",
      text: "مرّر بدون إجابة",
      onclick: () => {
        sessionState.passed += 1;
        sessionState.index += 1;
        announce("تم المرور على السؤال.");
        paintSessionQuestion(card, progressLine, timerLine, root);
        card.focus({ preventScroll: true });
      }
    }),
    element("button", {
      type: "button",
      class: "text-button",
      "aria-pressed": favorite ? "true" : "false",
      text: favorite ? "مفضّل ★" : "أضف إلى المفضلة",
      onclick: (event) => {
        const now = toggleList("favorites", question.id);
        event.currentTarget.textContent = now ? "مفضّل ★" : "أضف إلى المفضلة";
        event.currentTarget.setAttribute("aria-pressed", now ? "true" : "false");
      }
    }),
    element("button", {
      type: "button",
      class: "text-button",
      "aria-pressed": later ? "true" : "false",
      text: later ? "مؤجل ⏳" : "تحدثا فيه لاحقًا",
      onclick: (event) => {
        const now = toggleList("later", question.id);
        event.currentTarget.textContent = now ? "مؤجل ⏳" : "تحدثا فيه لاحقًا";
        event.currentTarget.setAttribute("aria-pressed", now ? "true" : "false");
      }
    }),
    element("button", {
      type: "button",
      class: "text-button",
      text: "أضف إلى أجندة الحوار",
      onclick: (event) => {
        addAgendaEntry({ id: `question:${question.id}`, label: question.prompt, source: "أسئلة بيننا" });
        event.currentTarget.textContent = "مضاف إلى الأجندة";
        event.currentTarget.disabled = true;
      }
    })
  ]);
  card.append(actions);

  progressLine.textContent = `السؤال ${sessionState.index + 1} من ${sessionState.items.length}. لا يوجد هدف يجب بلوغه؛ توقفا متى شئتما.`;

  clear(timerLine);
  const toggle = element("button", {
    type: "button",
    class: "text-button",
    "aria-pressed": sessionState.timerEnabled ? "true" : "false",
    text: sessionState.timerEnabled ? "أوقف المؤقّت" : "شغّل مؤقّتًا اختياريًا (دقيقتان)"
  });
  const readout = element("span", { class: "fine-print" });
  toggle.addEventListener("click", () => {
    sessionState.timerEnabled = !sessionState.timerEnabled;
    sessionState.remaining = sessionState.timerSeconds;
    paintSessionQuestion(card, progressLine, timerLine, root);
  });
  timerLine.append(toggle, readout);

  if (sessionState.timerEnabled) {
    const tick = () => {
      readout.textContent = ` الوقت المتبقي: ${Math.max(0, sessionState.remaining)} ثانية (اختياري، ولا ينهي الحديث).`;
      if (sessionState.remaining <= 0) { stopTimer(); return; }
      sessionState.remaining -= 1;
    };
    tick();
    sessionState.ticker = window.setInterval(tick, 1000);
  }
}

function buildShareCode(answers) {
  const entries = Object.entries(answers).filter(([, value]) => value.trim());
  if (entries.length === 0) return null;
  const payload = entries.map(([id, text]) => {
    const question = questionsById.get(id);
    return { id, q: question ? question.prompt : id, a: text };
  });
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch { return null; }
}

function decodeShareCode(code) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  } catch { return null; }
}

function finishSessionView(root) {
  stopTimer();
  const seen = sessionState?.seen ?? 0;
  const passed = sessionState?.passed ?? 0;
  const answers = sessionState?.answers ?? {};
  const answeredCount = Object.values(answers).filter((value) => value.trim()).length;

  /* --- share-code box (only if at least one answer was written) --- */
  const shareBox = element("div", { class: "share-code-box stack" });
  if (answeredCount > 0) {
    const code = buildShareCode(answers);
    const codeArea = element("textarea", {
      class: "textarea",
      rows: "3",
      readonly: "true",
      "aria-label": "رمز المشاركة"
    });
    codeArea.value = code || "";

    const copyBtn = element("button", {
      type: "button",
      class: "button button--secondary button--small",
      text: "انسخ الرمز",
      onclick: () => {
        navigator.clipboard.writeText(codeArea.value).then(() => {
          copyBtn.textContent = "تم النسخ ✓";
          setTimeout(() => { copyBtn.textContent = "انسخ الرمز"; }, 2000);
        });
      }
    });

    shareBox.append(
      element("p", { class: "eyebrow", text: "مشاركة إجاباتك" }),
      element("p", { class: "fine-print", text: `كتبت ${answeredCount} إجابة. انسخ الرمز أدناه وأرسله لشريكك، ثم الصق رمزه في الحقل التالي لمقارنة الإجابات.` }),
      codeArea,
      copyBtn
    );
  }

  /* --- partner-code import box --- */
  const compareContainer = element("div", { class: "stack" });
  const partnerInput = element("textarea", {
    class: "textarea",
    rows: "3",
    placeholder: "الصق رمز شريكك هنا…",
    "aria-label": "رمز الشريك"
  });
  const compareBtn = element("button", {
    type: "button",
    class: "button button--primary button--small",
    text: "قارن الإجابات",
    onclick: () => {
      const decoded = decodeShareCode(partnerInput.value);
      if (!decoded || !Array.isArray(decoded)) {
        announce("الرمز غير صالح. تأكد من نسخه بالكامل.");
        return;
      }
      clear(compareContainer);
      const partnerMap = new Map(decoded.map((entry) => [entry.id, entry]));
      const allIds = new Set([...Object.keys(answers), ...decoded.map((entry) => entry.id)]);

      for (const id of allIds) {
        const question = questionsById.get(id);
        const myAnswer = answers[id]?.trim() || "";
        const partnerEntry = partnerMap.get(id);
        const partnerAnswer = partnerEntry ? partnerEntry.a?.trim() || "" : "";
        if (!myAnswer && !partnerAnswer) continue;

        compareContainer.append(element("div", { class: "stack--sm" }, [
          element("h3", { class: "fine-print", text: question ? question.prompt : id }),
          element("div", { class: "partner-compare" }, [
            element("div", {}, [
              element("p", { class: "eyebrow", text: "أنا" }),
              element("p", { text: myAnswer || "—" })
            ]),
            element("div", {}, [
              element("p", { class: "eyebrow", text: "شريكي" }),
              element("p", { text: partnerAnswer || "—" })
            ])
          ])
        ]));
      }
      if (compareContainer.children.length === 0) {
        compareContainer.append(element("p", { class: "fine-print", text: "لا توجد إجابات مشتركة للمقارنة." }));
      }
    }
  });

  clear(root);
  root.append(element("div", { class: "surface-card stack" }, [
    element("p", { class: "eyebrow", text: "نهاية الجلسة" }),
    element("h1", { text: "تكفي هذه الجلسة" }),
    element("p", { class: "lede", text: `تحدثتما في ${seen} سؤالًا، ومررتما على ${passed}. المرور خيار كامل ولا يحتاج إلى تفسير.` }),
    element("div", { class: "notice" }, [
      element("strong", { text: "قبل أن تغلقا الصفحة" }),
      element("p", { text: "لم يُسجَّل شيء ممّا قلتماه. اختارا معًا شيئًا واحدًا سمعتماه اليوم وتودّان تذكّره، ثم اتركا الباقي." })
    ]),
    shareBox,
    element("div", { class: "share-code-box stack" }, [
      element("p", { class: "eyebrow", text: "استيراد إجابات الشريك" }),
      partnerInput,
      compareBtn,
      compareContainer
    ]),
    element("div", { class: "cluster" }, [
      element("a", { class: "button button--primary", href: "#/questions", text: "ارجعا إلى المكتبة" }),
      element("a", { class: "button button--secondary", href: "#/questions/favorites", text: "المفضلة ولاحقًا" }),
      element("a", { class: "button button--secondary", href: "#/premarital", text: "الرحلة قبل الزواج" })
    ])
  ]));
  sessionState = null;
}
