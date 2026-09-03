/*
 * "قد إيه تعرفني؟" — same-device challenge views.
 *
 * Item-level answers, predictions, and confidences live in memory and
 * sessionStorage only. They are never written to localStorage and there is no
 * share code for this feature at all. Only an aggregate count summary can be
 * saved, and only after an explicit opt-in.
 */

import { storage } from "./storage.js";
import { element, clear, announce, breadcrumbs, confirmAction } from "./dom.js";
import { setSensitiveView } from "./safety.js";
import { navigate } from "./router.js";
import { autoCompare, scoreDirection, summaryForStorage, buildSessionItems } from "./knowledge.js";

const meta = window.BAYNANA_KNOWLEDGE_CATEGORIES;
const itemData = window.BAYNANA_KNOWLEDGE_ITEMS;

const categories = meta.categories;
const allItems = itemData.items;
const categoriesById = new Map(categories.map((category) => [category.id, category]));

/*
 * Phase order. Each "handoff" fully covers the screen and renders no answer
 * from the previous person.
 */
const PHASES = [
  { id: "a-self", actor: "a", kind: "self", about: "a" },
  { id: "to-b-predict", kind: "handoff", actor: "b", message: "سلّما الجهاز للطرف الثاني ليخمّن إجابات الطرف الأول." },
  { id: "b-predict", actor: "b", kind: "predict", about: "a" },
  { id: "to-a-review", kind: "handoff", actor: "a", message: "سلّما الجهاز للطرف الأول ليراجع التخمينات." },
  { id: "a-review", actor: "a", kind: "review", about: "a" },
  { id: "to-b-self", kind: "handoff", actor: "b", message: "سلّما الجهاز للطرف الثاني ليجيب عن نفسه." },
  { id: "b-self", actor: "b", kind: "self", about: "b" },
  { id: "to-a-predict", kind: "handoff", actor: "a", message: "سلّما الجهاز للطرف الأول ليخمّن إجابات الطرف الثاني." },
  { id: "a-predict", actor: "a", kind: "predict", about: "b" },
  { id: "to-b-review", kind: "handoff", actor: "b", message: "سلّما الجهاز للطرف الثاني ليراجع التخمينات." },
  { id: "b-review", actor: "b", kind: "review", about: "b" },
  { id: "done", kind: "done" }
];

let state = null;

function persist() {
  if (state) storage.writeSession(storage.sessionKey.knowledge, state);
}

/*
 * sessionStorage is authoritative. If the session record is gone — quick exit,
 * "delete all data", a closed tab, an explicit end — the in-memory copy is
 * dropped too, so cleared answers can never be resumed from memory.
 */
function load() {
  const stored = storage.readSession(storage.sessionKey.knowledge);
  if (!stored || !Array.isArray(stored.itemIds)) {
    state = null;
    return null;
  }
  if (!state) state = stored;
  return state;
}

export function clearKnowledgeSession() {
  state = null;
  storage.removeSession(storage.sessionKey.knowledge);
}

function sessionItems() {
  const byId = new Map(allItems.map((item) => [item.id, item]));
  return state.itemIds.map((id) => byId.get(id)).filter(Boolean);
}

function phase() {
  return PHASES[state.phaseIndex] || PHASES[PHASES.length - 1];
}

function advancePhase() {
  state.phaseIndex += 1;
  state.index = 0;
  persist();
  const next = phase();
  if (next.kind === "handoff") navigate("#/know-me/handoff");
  else if (next.kind === "done") navigate("#/know-me/result");
  else if (next.kind === "review") navigate("#/know-me/review");
  else navigate("#/know-me/play");
}

function nameOf(actor) {
  return (actor === "a" ? state.nickA : state.nickB) || (actor === "a" ? "الطرف الأول" : "الطرف الثاني");
}

/* ------------------------------------------------------------------- intro */

export function renderKnowMeIntro() {
  setSensitiveView(false);
  return element("section", { class: "container page-section stack--lg view-enter" }, [
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: `${categories.length} فئة · ${allItems.length} بندًا` }),
      element("h1", { text: "قد إيه تعرفني؟" }),
      element("p", { class: "lede", text: "تحدٍّ خفيف ومحترم على جهاز واحد: يجيب كل شخص عن نفسه، ثم يخمّن الطرف الآخر، ثم يراجع صاحب الإجابة التخمين. لا يوجد فائز." })
    ]),
    element("div", { class: "notice notice--warning" }, [
      element("strong", { text: "ما الذي يقيسه هذا التحدي — وما الذي لا يقيسه" }),
      element("p", { text: meta.disclaimer })
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "الخصوصية في هذه اللعبة" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "كل شيء يجري على هذا الجهاز وداخل هذه الجلسة فقط." }),
        element("li", { text: "لا يوجد رمز مشاركة لهذه اللعبة إطلاقًا." }),
        element("li", { text: "لا تُكتب إجابات البنود في ذاكرة المتصفح الدائمة." }),
        element("li", { text: "تُمسح إجابات الجلسة عند الإنهاء أو الخروج أو إعادة البدء أو الخروج السريع." }),
        element("li", { text: "يمكن حفظ ملخص عددي مجمّع فقط، وبعد موافقة صريحة منكما." })
      ])
    ]),
    element("div", { class: "cluster" }, [
      element("a", { class: "button button--primary", href: "#/know-me/setup", text: "ابدآ الإعداد" }),
      element("a", { class: "button button--secondary", href: "#/premarital", text: "الرحلة قبل الزواج" })
    ])
  ]);
}

/* ------------------------------------------------------------------- setup */

export function renderKnowMeSetup() {
  setSensitiveView(false);
  const nickA = element("input", { class: "input", type: "text", maxlength: "24", placeholder: "الطرف الأول", "aria-label": "اسم الطرف الأول (اختياري)" });
  const nickB = element("input", { class: "input", type: "text", maxlength: "24", placeholder: "الطرف الثاني", "aria-label": "اسم الطرف الثاني (اختياري)" });
  const status = element("p", { class: "status-message", role: "status", "aria-live": "polite" });
  const chosen = new Set(categories.filter((category) => category.sensitivity !== "intimate").map((category) => category.id));

  const categoryList = element("div", { class: "check-grid" }, categories.map((category) => {
    const box = element("input", { type: "checkbox", value: category.id });
    box.checked = chosen.has(category.id);
    box.addEventListener("change", () => {
      if (box.checked) chosen.add(category.id);
      else chosen.delete(category.id);
    });
    return element("label", { class: "check-field" }, [
      box,
      element("span", {}, [
        element("strong", { text: category.name }),
        element("span", { class: "fine-print", text: category.sensitivity === "intimate" ? " — اختيارية وللبالغين، غير مختارة افتراضيًا" : ` — ${category.description}` })
      ])
    ]);
  }));

  let length = "short";
  const lengthRow = element("div", { class: "chips", role: "group", "aria-label": "طول الجلسة" });
  meta.sessionLengths.forEach((option) => {
    const chip = element("button", {
      type: "button",
      class: "chip",
      "aria-pressed": option.id === length ? "true" : "false",
      text: `${option.label} · ${option.items} بندًا`
    });
    chip.addEventListener("click", () => {
      length = option.id;
      lengthRow.querySelectorAll(".chip").forEach((button) => button.setAttribute("aria-pressed", String(button === chip)));
    });
    lengthRow.append(chip);
  });

  const adult = element("input", { type: "checkbox" });

  const form = element("form", { class: "surface-card stack" }, [
    element("h2", { text: "الإعداد" }),
    element("div", { class: "field-row" }, [
      element("label", { class: "field" }, [element("span", { text: "اسم مختصر للطرف الأول (اختياري)" }), nickA]),
      element("label", { class: "field" }, [element("span", { text: "اسم مختصر للطرف الثاني (اختياري)" }), nickB])
    ]),
    element("div", { class: "stack--sm" }, [element("h3", { text: "اختارا الفئات" }), categoryList]),
    element("div", { class: "stack--sm" }, [element("h3", { text: "طول الجلسة" }), lengthRow]),
    element("label", { class: "check-field" }, [adult, element("span", { text: "نؤكد أننا بالغان (18 عامًا أو أكثر)، وأن أي بند يمكن تخطيه بـ«أفضل عدم الإجابة»." })]),
    element("button", { class: "button button--primary", type: "submit", text: "ابدآ التحدي" }),
    status
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!chosen.size) {
      status.textContent = "اختارا فئة واحدة على الأقل.";
      status.className = "status-message is-error";
      return;
    }
    if (!adult.checked) {
      status.textContent = "هذه اللعبة للبالغين. أكّدا أن عمركما 18 عامًا أو أكثر.";
      status.className = "status-message is-error";
      return;
    }
    const target = meta.sessionLengths.find((option) => option.id === length)?.items || 12;
    const items = buildSessionItems(allItems, Array.from(chosen), target);
    state = {
      nickA: storage.cleanNickname(nickA.value),
      nickB: storage.cleanNickname(nickB.value),
      itemIds: items.map((item) => item.id),
      phaseIndex: 0,
      index: 0,
      selfA: {}, selfB: {},
      predA: {}, predB: {},
      confA: {}, confB: {},
      marksA: {}, marksB: {}
    };
    persist();
    navigate("#/know-me/play");
  });

  return element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: "قد إيه تعرفني؟", href: "#/know-me" }, { label: "الإعداد" }]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "جهاز واحد · جلسة واحدة" }),
      element("h1", { text: "إعداد الجلسة" }),
      element("p", { text: "الأسماء اختيارية ولا تُحفظ خارج هذه الجلسة. لا تكتبا اسمًا قانونيًا كاملًا." })
    ]),
    form
  ]);
}

/* -------------------------------------------------------------------- play */

function optionChoices(item) {
  const choices = item.options.map((option) => ({ value: option.v, text: option.t }));
  choices.push({ value: "unsure", text: "لست متأكدًا", muted: true });
  if (item.allowPrivate) choices.push({ value: "private", text: "أفضل عدم الإجابة", muted: true });
  return choices;
}

export function renderKnowMePlay() {
  if (!load()) return missingSession();
  const active = phase();
  if (active.kind === "handoff") { navigate("#/know-me/handoff"); return element("div"); }
  if (active.kind === "review") { navigate("#/know-me/review"); return element("div"); }
  if (active.kind === "done") { navigate("#/know-me/result"); return element("div"); }

  const items = sessionItems();
  setSensitiveView(items.some((item) => item.sensitivity === "intimate"));

  const card = element("article", { class: "surface-card quiz-card", tabindex: "-1" });
  const meter = element("p", { class: "fine-print", role: "status", "aria-live": "polite" });
  const root = element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    element("div", { class: "split" }, [
      element("div", { class: "stack--sm" }, [
        element("p", { class: "eyebrow", text: active.kind === "self" ? "أجب عن نفسك" : `خمّن إجابات ${nameOf(active.about)}` }),
        element("h1", { text: nameOf(active.actor) })
      ]),
      element("button", { type: "button", class: "button button--danger button--small", text: "أنهِ وامسح", onclick: () => exitChallenge() })
    ]),
    card,
    meter
  ]);

  paintPlayItem(card, meter, items, active);
  return root;
}

function paintPlayItem(card, meter, items, active) {
  if (state.index >= items.length) { advancePhase(); return; }
  const item = items[state.index];
  const store = active.kind === "self"
    ? (active.actor === "a" ? state.selfA : state.selfB)
    : (active.actor === "a" ? state.predA : state.predB);
  const confidenceStore = active.actor === "a" ? state.confA : state.confB;

  clear(card);
  const category = categoriesById.get(item.cat);
  const promptId = `km-${item.id}`;
  const options = element("div", { class: "option-list", role: "radiogroup", "aria-labelledby": promptId });

  optionChoices(item).forEach((choice) => {
    const selected = store[item.id] === choice.value;
    const button = element("button", {
      type: "button",
      class: `option-button${choice.muted ? " option-button--muted" : ""}`,
      role: "radio",
      "aria-checked": selected ? "true" : "false"
    }, [element("span", { class: "option-marker", "aria-hidden": "true" }), element("span", { text: choice.text })]);
    button.addEventListener("click", () => {
      store[item.id] = choice.value;
      persist();
      paintPlayItem(card, meter, items, active);
    });
    options.append(button);
  });

  const promptText = active.kind === "self"
    ? item.prompt
    : item.prompt.replace(/^ما /, "برأيك، ما ").replace(/^كم /, "برأيك، كم ").replace(/^متى /, "برأيك، متى ").replace(/^هل /, "برأيك، هل ");

  card.append(element("div", { class: "stack" }, [
    element("p", { class: "question-number", text: category ? category.name : "" }),
    element("h2", { class: "question-prompt", id: promptId, text: promptText }),
    options
  ]));

  if (active.kind === "predict") {
    const row = element("div", { class: "chips", role: "group", "aria-label": "ما مدى ثقتك في هذا التخمين؟" });
    meta.confidenceLevels.forEach((level) => {
      const chip = element("button", {
        type: "button",
        class: "chip",
        "aria-pressed": (confidenceStore[item.id] || "medium") === level.id ? "true" : "false",
        text: level.label
      });
      chip.addEventListener("click", () => {
        confidenceStore[item.id] = level.id;
        persist();
        paintPlayItem(card, meter, items, active);
      });
      row.append(chip);
    });
    card.append(element("div", { class: "stack--sm" }, [
      element("p", { class: "fine-print", text: "ما مدى ثقتك في هذا التخمين؟ تُستخدم الثقة للتأمل فقط ولا تُحسب ضمن أي درجة." }),
      row
    ]));
  }

  const next = element("button", { type: "button", class: "button button--primary", text: state.index === items.length - 1 ? "انتهيت" : "التالي" });
  next.disabled = store[item.id] === undefined;
  next.addEventListener("click", () => {
    state.index += 1;
    persist();
    paintPlayItem(card, meter, items, active);
    card.focus({ preventScroll: true });
  });

  const previous = element("button", { type: "button", class: "button button--secondary", text: "السابق" });
  previous.disabled = state.index === 0;
  previous.addEventListener("click", () => {
    state.index -= 1;
    persist();
    paintPlayItem(card, meter, items, active);
  });

  card.append(element("div", { class: "quiz-nav" }, [previous, next]));
  meter.textContent = `البند ${state.index + 1} من ${items.length}`;
}

/* ----------------------------------------------------------------- handoff */

export function renderKnowMeHandoff() {
  if (!load()) return missingSession();
  const active = phase();
  if (active.kind !== "handoff") { navigate("#/know-me/play"); return element("div"); }
  setSensitiveView(true);

  /* No answer, prediction, or mark is rendered on this screen. */
  return element("section", { class: "container narrow-page page-section handoff-screen view-enter" }, [
    element("div", { class: "surface-card stack handoff-card" }, [
      element("p", { class: "eyebrow", text: "تسليم الجهاز" }),
      element("h1", { text: "الشاشة فارغة عمدًا" }),
      element("p", { class: "lede", text: active.message }),
      element("p", { class: "fine-print", text: "لا تظهر هنا أي إجابة أو تخمين. اضغطا زر المتابعة بعد تسليم الجهاز." }),
      element("div", { class: "cluster" }, [
        element("button", {
          type: "button",
          class: "button button--primary",
          text: `أنا ${nameOf(active.actor)} — متابعة`,
          onclick: () => {
            state.phaseIndex += 1;
            state.index = 0;
            persist();
            const next = phase();
            if (next.kind === "review") navigate("#/know-me/review");
            else if (next.kind === "done") navigate("#/know-me/result");
            else navigate("#/know-me/play");
          }
        }),
        element("button", { type: "button", class: "button button--danger", text: "أنهِ وامسح", onclick: () => exitChallenge() })
      ])
    ])
  ]);
}

/* ------------------------------------------------------------------ review */

export function renderKnowMeReview() {
  if (!load()) return missingSession();
  const active = phase();
  if (active.kind !== "review") { navigate("#/know-me/play"); return element("div"); }

  const items = sessionItems();
  setSensitiveView(items.some((item) => item.sensitivity === "intimate"));
  const selfAnswers = active.about === "a" ? state.selfA : state.selfB;
  const predictions = active.about === "a" ? state.predB : state.predA;
  const marks = active.about === "a" ? state.marksA : state.marksB;
  const guesserName = nameOf(active.about === "a" ? "b" : "a");

  const list = element("div", { class: "stack" });
  items.forEach((item) => {
    const suggested = autoCompare(item, selfAnswers[item.id], predictions[item.id]);
    if (marks[item.id] === undefined) marks[item.id] = suggested;
    const optionText = (value) => {
      if (value === "unsure") return "لست متأكدًا";
      if (value === "private") return "أفضل عدم الإجابة";
      const option = item.options.find((entry) => entry.v === Number(value));
      return option ? option.t : "بدون إجابة";
    };

    const row = element("div", { class: "chips", role: "group", "aria-label": `تقييم التخمين في: ${item.prompt}` });
    meta.reviewMarks.forEach((mark) => {
      const chip = element("button", {
        type: "button",
        class: "chip",
        "aria-pressed": marks[item.id] === mark.id ? "true" : "false",
        text: mark.label
      });
      chip.addEventListener("click", () => {
        marks[item.id] = mark.id;
        persist();
        row.querySelectorAll(".chip").forEach((button) => button.setAttribute("aria-pressed", String(button === chip)));
      });
      row.append(chip);
    });

    list.append(element("article", { class: "surface-card stack--sm" }, [
      element("h3", { text: item.prompt }),
      element("p", {}, [element("strong", { text: "إجابتك: " }), optionText(selfAnswers[item.id])]),
      element("p", {}, [element("strong", { text: `تخمين ${guesserName}: ` }), optionText(predictions[item.id])]),
      row
    ]));
  });

  persist();

  return element("section", { class: "container page-section stack--lg view-enter" }, [
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: `مراجعة ${nameOf(active.actor)}` }),
      element("h1", { text: "أنت من يقرر ما إذا كان التخمين دقيقًا" }),
      element("p", { text: "علّم كل بند كما تراه. البنود التي تصفها بأنها غامضة أو لم تعد تصفك أو خاصة لا تدخل في أي حساب." })
    ]),
    list,
    element("div", { class: "cluster" }, [
      element("button", { type: "button", class: "button button--primary", text: "تابع", onclick: () => advancePhase() }),
      element("button", { type: "button", class: "button button--danger", text: "أنهِ وامسح", onclick: () => exitChallenge() })
    ])
  ]);
}

/* ------------------------------------------------------------------ result */

function directionResult(items, selfAnswers, predictions, confidences, marks) {
  const entries = items.map((item) => ({
    itemId: item.id,
    selfAnswer: selfAnswers[item.id],
    prediction: predictions[item.id],
    confidence: confidences[item.id] || "medium",
    mark: marks[item.id]
  }));
  return scoreDirection(items, entries);
}

function resultBlock(title, result, items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const categoryRows = result.byCategory.filter((entry) => entry.reportable);

  return element("section", { class: "surface-card stack" }, [
    element("h2", { text: title }),
    element("div", { class: "stat-grid" }, [
      element("div", { class: "stat-card" }, [element("span", { text: "ما عرفته بدقة" }), element("strong", { text: String(result.exact) })]),
      element("div", { class: "stat-card" }, [element("span", { text: "إجابات كانت قريبة" }), element("strong", { text: String(result.close) })]),
      element("div", { class: "stat-card" }, [element("span", { text: "أشياء تستحق سؤالًا" }), element("strong", { text: String(result.different) })]),
      element("div", { class: "stat-card" }, [element("span", { text: "أمور لم نتكلم عنها بعد" }), element("strong", { text: String(result.excluded) })])
    ]),
    result.percentage === null
      ? element("p", { class: "fine-print", text: "لم يبقَ بند واحد قابل للحساب في هذه الجولة، فلا توجد نسبة تُعرض. هذا ليس نتيجة سيئة؛ هو ببساطة لا شيء لنحسبه." })
      : element("p", { class: "fine-print", text: `نسبة التعرّف في هذه الجلسة: ${result.percentage}٪ من ${result.eligible} بندًا مؤهلًا. تصف هذه النسبة هذه الجلسة وحدها.` }),
    categoryRows.length
      ? element("ul", { class: "stack--sm" }, categoryRows.map((entry) =>
          element("li", { text: `${categoriesById.get(entry.categoryId)?.name || entry.categoryId}: ${entry.percentage}٪ من ${entry.counted} بندًا` })
        ))
      : element("p", { class: "fine-print", text: "لا توجد فئة فيها عدد كافٍ من البنود المؤهلة لعرض تفصيل، فلن نعرض أرقامًا لا تحتمل التفسير." }),
    result.discoveries.length
      ? element("div", { class: "stack--sm" }, [
          element("h3", { text: "أسئلة يقترحها الاختلاف" }),
          element("ul", { class: "stack--sm" }, result.discoveries.slice(0, 5).map((row) =>
            element("li", { text: byId.get(row.itemId)?.prompt || "" })
          ))
        ])
      : null,
    result.confidentMisses.length
      ? element("div", { class: "notice" }, [
          element("strong", { text: "افتراضات تستحق مراجعة" }),
          element("p", { text: `في ${result.confidentMisses.length} بندًا كان التخمين واثقًا ومختلفًا. هذه ليست درجة ولا حكمًا؛ هي مجرد إشارة إلى افتراض يستحق سؤالًا.` })
        ])
      : null
  ]);
}

export function renderKnowMeResult() {
  if (!load()) return missingSession();
  const items = sessionItems();
  setSensitiveView(false);

  const bKnowsA = directionResult(items, state.selfA, state.predB, state.confB, state.marksA);
  const aKnowsB = directionResult(items, state.selfB, state.predA, state.confA, state.marksB);
  const nameA = nameOf("a");
  const nameB = nameOf("b");

  const root = element("section", { class: "container page-section stack--lg view-enter" }, [
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "اتجاهان منفصلان · بلا فائز" }),
      element("h1", { text: "نتيجة الجلسة" }),
      element("p", { class: "lede", text: "تُعرض النتيجتان منفصلتين ولا تُجمعان في رقم واحد للعلاقة. معرفة شخص لإجابات شخص آخر ليست مقياسًا للحب أو الالتزام." })
    ]),
    element("div", { class: "notice notice--warning" }, [element("p", { text: meta.disclaimer })])
  ]);

  root.append(resultBlock(`معرفة ${nameB} بإجابات ${nameA}`, bKnowsA, items));
  root.append(resultBlock(`معرفة ${nameA} بإجابات ${nameB}`, aKnowsB, items));

  const status = element("p", { class: "status-message", role: "status", "aria-live": "polite" });
  root.append(element("section", { class: "surface-card stack" }, [
    element("h2", { text: "قبل أن تغلقا" }),
    element("p", { text: "تُمسح كل إجابات هذه الجلسة عند الإنهاء. يمكنكما اختياريًا حفظ ملخص عددي فقط — عدد الدقيق والقريب والمختلف والمستبعد — دون أي بند أو إجابة." }),
    element("div", { class: "cluster" }, [
      element("button", {
        type: "button",
        class: "button button--secondary",
        text: "احفظ ملخصًا عدديًا فقط",
        onclick: async () => {
          const confirmed = await confirmAction({
            title: "حفظ ملخص عددي؟",
            message: "سيُحفظ عدد الإجابات الدقيقة والقريبة والمختلفة والمستبعدة فقط. لن تُحفظ أي إجابة ولا أي بند.",
            confirmLabel: "احفظ الملخص"
          });
          if (!confirmed) return;
          storage.addKnowledgeSummary(summaryForStorage(`${nameB} ← ${nameA}`, bKnowsA));
          storage.addKnowledgeSummary(summaryForStorage(`${nameA} ← ${nameB}`, aKnowsB));
          status.textContent = "حُفظ الملخص العددي. لم تُحفظ أي إجابة.";
          announce("حُفظ الملخص العددي.");
        }
      }),
      element("button", { type: "button", class: "button button--danger", text: "أنهِ وامسح إجابات الجلسة", onclick: () => exitChallenge("#/know-me") }),
      element("a", { class: "button button--primary", href: "#/questions", text: "افتحا أسئلة بيننا" })
    ]),
    status
  ]));
  return root;
}

/* ------------------------------------------------------------------- shared */

function missingSession() {
  setSensitiveView(false);
  return element("section", { class: "container narrow-page page-section view-enter" }, [
    element("div", { class: "surface-card stack" }, [
      element("h1", { text: "لا توجد جلسة مفتوحة" }),
      element("p", { text: "تعيش هذه اللعبة داخل الجلسة فقط، وقد انتهت الجلسة أو مُسحت إجاباتها. هذا هو السلوك المقصود لحماية الخصوصية." }),
      element("a", { class: "button button--primary", href: "#/know-me/setup", text: "ابدآ جلسة جديدة" })
    ])
  ]);
}

async function exitChallenge(destination = "#/know-me") {
  const confirmed = await confirmAction({
    title: "إنهاء الجلسة ومسح الإجابات؟",
    message: "ستُمسح كل إجابات وتخمينات هذه الجلسة نهائيًا. لا يمكن استرجاعها.",
    confirmLabel: "أنهِ وامسح",
    danger: true
  });
  if (!confirmed) return;
  clearKnowledgeSession();
  announce("مُسحت إجابات الجلسة.");
  navigate(destination);
}

export function renderKnowMeRoute(route) {
  if (route.subpage === "setup") return renderKnowMeSetup();
  if (route.subpage === "play") return renderKnowMePlay();
  if (route.subpage === "handoff") return renderKnowMeHandoff();
  if (route.subpage === "review") return renderKnowMeReview();
  if (route.subpage === "result") return renderKnowMeResult();
  return renderKnowMeIntro();
}
