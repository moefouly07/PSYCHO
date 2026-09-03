const riskLabels = {
  threats: "التهديد أو التلويح بالأذى",
  coercion: "الإكراه أو الضغط الذي يلغي حرية الاختيار",
  humiliation: "الإهانة أو الإذلال المتعمّد",
  surveillance: "المراقبة أو طلب الوصول القسري للخصوصية",
  fear: "الخوف من رد الفعل أو العواقب",
  "financial-exploitation": "استغلال المال أو الضغط المالي",
  "pleasure-in-distress": "الاستمتاع بضيق الطرف الآخر",
  "unsafe-behavior": "سلوك قد يعرّض أحد الطرفين للخطر"
};

function compare(value, operator, threshold) {
  if (operator === ">=") return value >= threshold;
  if (operator === ">") return value > threshold;
  if (operator === "<=") return value <= threshold;
  if (operator === "<") return value < threshold;
  if (operator === "===") return value === threshold;
  return false;
}

function rank(level) {
  return level === "high" ? 2 : level === "caution" ? 1 : 0;
}

export function evaluateSafety(test, answers, score) {
  const flags = [];
  const reasons = [];
  let level = "none";

  test.questions.forEach((question) => {
    const selectedScore = answers?.[question.id];
    if (!Number.isInteger(selectedScore)) return;
    const selectedOption = question.options.find((option) => option.s === selectedScore);
    if (!selectedOption?.risk) return;
    const values = Array.isArray(selectedOption.risk) ? selectedOption.risk : [selectedOption.risk];
    values.forEach((value) => {
      if (typeof value === "string" && !flags.includes(value)) flags.push(value);
    });
  });

  if (flags.length) {
    level = "high";
    flags.forEach((flag) => reasons.push(riskLabels[flag] || "إجابة تشير إلى حاجة خاصة للسلامة"));
  }

  const rules = test.safety?.rules || [];
  const dimensions = Object.fromEntries(score.dimensions.map((dimension) => [dimension.id, dimension]));
  rules.forEach((rule) => {
    const dimension = dimensions[rule.dimension];
    if (!dimension) return;
    const value = rule.metric === "supportive" ? dimension.supportive : dimension.percentage;
    if (!compare(value, rule.operator || ">=", rule.threshold)) return;
    const ruleLevel = rule.severity === "high" ? "high" : "caution";
    if (rank(ruleLevel) > rank(level)) level = ruleLevel;
    if (rule.reason && !reasons.includes(rule.reason)) reasons.push(rule.reason);
  });

  const isReligiousClaimAssessment = test.id === "mahdi-claim-critical-thinking";
  let message = "";
  if (level === "high") {
    message = "تظهر في إجاباتك إشارة تستحق التعامل معها كمسألة سلامة، لا كمجرد فرق في الأسلوب. لا تبدأ مواجهة مشتركة إذا كنت تخشى رد الفعل. تواصل على انفراد مع شخص تثق به ومع مختص محلي مؤهل. إذا كان هناك خطر فوري، اتصل بخدمات الطوارئ المحلية.";
    if (isReligiousClaimAssessment) {
      message += " وعندما يرتبط الأمر بضيق شديد أو عزلة أو استغلال مالي أو سلوك غير آمن أو تعطّل كبير في الحياة اليومية، استشر أيضًا عالمًا دينيًا مؤهلًا وموثوقًا واختصاصيًا مرخصًا في الصحة النفسية؛ هذا الاختبار لا يثبت ولا ينفي أي هوية دينية أو غيبية.";
    }
  } else if (level === "caution") {
    message = "تشير بعض إجاباتك إلى نمط يحتاج وقفة هادئة وحدودًا أوضح. اختر وقتًا آمنًا للمراجعة، واطلب دعم مختص إذا كان الحديث يثير خوفًا أو ضغطًا أو يتكرر دون تحسن.";
    if (isReligiousClaimAssessment) {
      message += " لا يمكن لاستبيان نفسي أن يثبت أو ينفي هوية دينية أو غيبية؛ ركّز على قابلية التحقق والأثر على الحياة، واستعن بعالم ديني مؤهل واختصاصي صحة نفسية عند الحاجة.";
    }
  }

  return { level, flags, reasons, message };
}

export function sharedSafetyLevel(localSafety, peerDerived) {
  const localRank = rank(localSafety?.level || "none");
  const peerRank = Number(peerDerived?.safety) >= 2 ? 2 : Number(peerDerived?.safety) === 1 ? 1 : 0;
  const highest = Math.max(localRank, peerRank);
  return highest === 2 ? "high" : highest === 1 ? "caution" : "none";
}

export function sharedSafetyMessage(test, level) {
  if (level === "none") return "";
  const base = level === "high"
    ? "لأسباب تتعلق بالسلامة، لن تقترح هذه الصفحة مواجهة مباشرة أو تحوّل النتيجة إلى حديث مرح عن التوافق. راجع النتيجة على انفراد، وتواصل مع شخص تثق به ومختص محلي مؤهل. إذا كان هناك خطر فوري، اتصل بخدمات الطوارئ المحلية."
    : "ابدآ فقط بحوار تشعران فيه بالأمان والقدرة على التوقف. إذا وُجد خوف أو ضغط أو تهديد، فالأولوية لدعم فردي وآمن مع شخص موثوق ومختص محلي مؤهل.";
  if (test.id !== "mahdi-claim-critical-thinking") return base;
  return `${base} وعند وجود ضيق شديد أو عزلة أو استغلال مالي أو سلوك غير آمن أو تعطّل للحياة، استشيرا عالمًا دينيًا مؤهلًا وموثوقًا واختصاصيًا مرخصًا في الصحة النفسية. لا يستطيع هذا الاختبار إثبات أو نفي أي هوية غيبية.`;
}

/* ==========================================================================
   Quick exit, private safety reflection, and the shared-content safety guard.
   ========================================================================== */

/*
 * The private safety self-check.
 *
 * These items are self-reflection ONLY. They are answered in sessionStorage,
 * never scored into a couple result, never added to the discussion agenda,
 * never shown on a handoff screen, never exported, and never encoded into any
 * result code. `assertNoSafetyContent` below enforces that at the boundary.
 */
export const SAFETY_CHECK_ID = "private-safety-check";

export const safetyCheckItems = [
  { id: "sc1", prompt: "هل تغيّر تصرفك أو كلامك لتفادي رد فعل الطرف الآخر؟" },
  { id: "sc2", prompt: "هل حدث تهديد — بالأذى أو بالفضح أو بقطع المال أو بإخبار الأهل — للحصول على موافقتك؟" },
  { id: "sc3", prompt: "هل طُلب منك تسليم كلمات المرور أو موقعك أو رسائلك رغمًا عنك؟" },
  { id: "sc4", prompt: "هل شعرت بأنك مضطر إلى قبول قرب جسدي لم تكن ترغب فيه؟" },
  { id: "sc5", prompt: "هل يُتحكم في مالك أو عملك أو دراستك بطريقة تحدّ من استقلالك؟" },
  { id: "sc6", prompt: "هل جرى إذلالك أو السخرية منك أمام الآخرين بشكل متكرر؟" },
  { id: "sc7", prompt: "هل قلّت علاقتك بأهلك أو أصدقائك بسبب ضغط أو اعتراض متكرر؟" },
  { id: "sc8", prompt: "هل تشعر بالخوف حين تفكر في قول رأي مخالف؟" }
];

export const safetyCheckAnswers = [
  { id: "no", label: "لا", weight: 0 },
  { id: "sometimes", label: "أحيانًا", weight: 1 },
  { id: "often", label: "كثيرًا", weight: 2 },
  { id: "skip", label: "أفضل عدم الإجابة", weight: null }
];

export function evaluateSafetyCheck(answers) {
  const weights = safetyCheckItems
    .map((item) => safetyCheckAnswers.find((option) => option.id === answers?.[item.id])?.weight)
    .filter((weight) => Number.isInteger(weight));
  const flagged = weights.filter((weight) => weight >= 1).length;
  const strong = weights.filter((weight) => weight === 2).length;
  const level = strong >= 1 || flagged >= 3 ? "high" : flagged >= 1 ? "caution" : "none";
  return {
    level,
    answered: weights.length,
    flagged,
    private: true,
    message: level === "high"
      ? "ما وصفته يستحق التعامل معه كمسألة سلامة، لا كفرق في الأسلوب. لا تبدأ مواجهة إذا كنت تخشى رد الفعل. تحدث على انفراد مع شخص تثق به ومع مختص محلي مؤهل. إذا كان هناك خطر فوري، اتصل بخدمات الطوارئ المحلية. ما ظهر هنا لن يُشارَك مع أي طرف ولن يدخل في أي نتيجة مشتركة."
      : level === "caution"
        ? "بعض ما وصفته يستحق وقفة هادئة على انفراد. لست مضطرًا إلى مواجهة الآن. فكّر فيمن تثق به، وفي الدعم المحلي المؤهل المتاح لك. تبقى هذه الإجابات خاصة بك وحدك."
        : ""
  };
}

/*
 * Boundary guard. Any payload that leaves the device — a share code, an
 * exported summary, a discussion agenda entry, a handoff screen — is passed
 * through this before it is used. It throws rather than leaking.
 */
export function assertNoSafetyContent(payload, context = "shared payload") {
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload ?? "");
  const safetyItemIds = safetyCheckItems.map((item) => item.id);
  const markers = [SAFETY_CHECK_ID, "safetyCheck", "safety-check"];
  const hit = markers.find((marker) => serialized.includes(marker))
    || safetyItemIds.find((id) => new RegExp(`"${id}"`).test(serialized));
  if (hit) {
    throw new Error(`Refusing to include private safety content in ${context}`);
  }
  return payload;
}

/* ------------------------------------------------------------------ quick exit */

const QUICK_EXIT_DEFAULT_DESTINATION = "https://www.wikipedia.org/";

export const quickExitLimitations = [
  "لا يمسح الخروج السريع سجل المتصفح.",
  "لا يمنع مراقبة الشبكة أو برامج المراقبة المثبتة على الجهاز.",
  "لا يحذف لقطات الشاشة أو ما نُسخ إلى الحافظة.",
  "لا يخفي أن الجهاز كان مستخدمًا في هذا الوقت."
];

let quickExitState = null;

export function createQuickExit({ destination, onExit } = {}) {
  const target = typeof destination === "string" && /^https?:\/\//.test(destination)
    ? destination
    : QUICK_EXIT_DEFAULT_DESTINATION;

  let lastEscape = 0;
  let sensitive = false;

  function coverAndLeave() {
    const overlay = document.createElement("div");
    overlay.className = "quick-exit-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.textContent = "";
    document.body.append(overlay);
    document.body.classList.add("is-quick-exiting");
    try {
      if (typeof onExit === "function") onExit();
    } finally {
      window.location.replace(target);
    }
  }

  function onKeydown(event) {
    if (event.key !== "Escape" || !sensitive) return;
    // Never steal Escape from an open dialog: that would break dialog dismissal.
    if (document.querySelector("dialog[open]")) return;
    // Nor from an open mobile menu, whose own Escape handler closes it.
    if (document.querySelector("#menu-toggle[aria-expanded='true']")) return;
    const now = Date.now();
    if (now - lastEscape < 900) {
      lastEscape = 0;
      event.preventDefault();
      coverAndLeave();
      return;
    }
    lastEscape = now;
  }

  document.addEventListener("keydown", onKeydown);

  quickExitState = {
    destination: target,
    exit: coverAndLeave,
    setSensitive(value) { sensitive = Boolean(value); },
    isSensitive() { return sensitive; }
  };
  return quickExitState;
}

export function quickExit() {
  if (quickExitState) quickExitState.exit();
}

export function setSensitiveView(value) {
  if (quickExitState) quickExitState.setSensitive(value);
  document.body.classList.toggle("is-sensitive-view", Boolean(value));
}
