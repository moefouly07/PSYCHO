/*
 * Safety page and the private safety self-check.
 *
 * The self-check is answered on this device, in sessionStorage only. Its
 * answers are never shared with a partner, never scored into a couple result,
 * never added to the discussion agenda, never shown on a handoff screen, never
 * exported, and never encoded into any result code.
 */

import { storage } from "./storage.js";
import { element, clear, announce, breadcrumbs } from "./dom.js";
import {
  safetyCheckItems, safetyCheckAnswers, evaluateSafetyCheck,
  setSensitiveView, quickExitLimitations
} from "./safety.js";
import { navigate } from "./router.js";

export function renderSafety() {
  setSensitiveView(true);
  return element("section", { class: "container page-section stack--lg view-enter" }, [
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "السلامة قبل التفاعل" }),
      element("h1", { text: "الخصوصية والأمان" }),
      element("p", { class: "lede", text: "بعض ما يحدث بين شخصين ليس اختلافًا في الأسلوب. التهديد والإكراه والمراقبة والإذلال والضغط الجنسي والتحكم المالي والخوف مسائل سلامة، ولا تُعامل هنا محتوى ترفيهيًا عن التوافق." })
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "ما الذي لا يفعله هذا الموقع" }),
      element("ul", { class: "stack--sm" }, [
        element("li", { text: "لا يحوّل الإكراه أو التهديد أو المراقبة إلى لعبة توافق أو نتيجة مشتركة." }),
        element("li", { text: "لا ينصح ببدء مواجهة مع الطرف الآخر إذا كنت تخشى رد الفعل." }),
        element("li", { text: "لا يلوم من يتعرض للأذى ولا يطلب منه تفسير ما حدث." }),
        element("li", { text: "لا يخترع أرقام طوارئ أو جهات في بلدك، لأن ذلك قد يوجّهك إلى جهة خاطئة." }),
        element("li", { text: "لا يَعِد بسرية لا يستطيع المتصفح ضمانها." })
      ])
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "إذا شعرت بالخطر" }),
      element("ol", { class: "stack--sm" }, [
        element("li", { text: "إن كان الخطر فوريًا، انتقل إلى مكان آمن واتصل بخدمات الطوارئ المحلية في بلدك." }),
        element("li", { text: "تحدث على انفراد مع شخص تثق به قبل أي خطوة مشتركة." }),
        element("li", { text: "ابحث عن مختص محلي مؤهل أو جهة دعم معترف بها في بلدك." }),
        element("li", { text: "استخدم جهازًا لا يستطيع الطرف الآخر الوصول إليه إذا كنت تخشى المراقبة." })
      ])
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "الخروج السريع" }),
      element("p", { text: "يظهر زر «خروج سريع» في الصفحات الحساسة. يمكنك أيضًا الضغط على مفتاح Escape مرتين متتاليتين. يغطي الزر المحتوى فورًا، ويمسح بيانات الجلسة الحساسة، ثم ينقلك إلى صفحة محايدة." }),
      element("div", { class: "notice notice--warning" }, [
        element("strong", { text: "حدود الخروج السريع" }),
        element("ul", { class: "stack--sm" }, quickExitLimitations.map((line) => element("li", { text: line })))
      ])
    ]),
    element("section", { class: "surface-card stack" }, [
      element("h2", { text: "مراجعة خاصة بك وحدك" }),
      element("p", { text: "ثمانية أسئلة قصيرة للتأمل الفردي. لا تُشارك مع أي طرف، ولا تدخل في أي نتيجة أو مقارنة أو أجندة أو رمز أو ملف مُصدَّر، ولا تُحفظ بعد إغلاق هذه الجلسة." }),
      element("a", { class: "button button--primary", href: "#/safety/check", text: "افتح المراجعة الخاصة" })
    ])
  ]);
}

export function renderSafetyCheck() {
  setSensitiveView(true);
  const stored = storage.readSession(storage.sessionKey.safetyCheck) || {};
  const answers = { ...stored };
  const resultBox = element("div", { class: "stack" });

  const list = element("div", { class: "stack" }, safetyCheckItems.map((item) => {
    const row = element("div", { class: "chips", role: "group", "aria-label": item.prompt });
    safetyCheckAnswers.forEach((option) => {
      const chip = element("button", {
        type: "button",
        class: "chip",
        "aria-pressed": answers[item.id] === option.id ? "true" : "false",
        text: option.label
      });
      chip.addEventListener("click", () => {
        answers[item.id] = option.id;
        storage.writeSession(storage.sessionKey.safetyCheck, answers);
        row.querySelectorAll(".chip").forEach((button) => button.setAttribute("aria-pressed", String(button === chip)));
        paintResult();
      });
      row.append(chip);
    });
    return element("article", { class: "surface-card stack--sm" }, [
      element("p", { class: "question-text", text: item.prompt }),
      row
    ]);
  }));

  function paintResult() {
    const outcome = evaluateSafetyCheck(answers);
    clear(resultBox);
    if (!outcome.answered) {
      resultBox.append(element("p", { class: "fine-print", text: "أجب عمّا تشاء. لا شيء إلزامي، ولا يُرسل شيء إلى أي مكان." }));
      return;
    }
    if (outcome.level === "none") {
      resultBox.append(element("div", { class: "notice notice--success" }, [
        element("p", { text: "لم تظهر في إجاباتك إشارة سلامة ضمن هذه الأسئلة. هذا لا يعني أن كل شيء بخير بالضرورة؛ أنت أعرف بوضعك، وهذه الأسئلة لا تغطي كل شيء." })
      ]));
      return;
    }
    resultBox.append(element("div", { class: `notice ${outcome.level === "high" ? "notice--danger" : "notice--warning"}` }, [
      element("strong", { text: outcome.level === "high" ? "رسالة خاصة بك وحدك" : "وقفة هادئة" }),
      element("p", { text: outcome.message })
    ]));
  }

  const root = element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    breadcrumbs([{ label: "الخصوصية والأمان", href: "#/safety" }, { label: "مراجعة خاصة" }]),
    element("header", { class: "section-heading" }, [
      element("p", { class: "eyebrow", text: "لا تُشارَك · لا تُحفظ بعد الجلسة" }),
      element("h1", { text: "مراجعة خاصة للسلامة" }),
      element("p", { text: "هذه الأسئلة لك وحدك. لا تُعرض للطرف الآخر، ولا تدخل في أي نتيجة مشتركة أو أجندة حوار أو رمز مشاركة أو ملف مُصدَّر، ولا تُحفظ في ذاكرة المتصفح الدائمة." })
    ]),
    element("div", { class: "notice" }, [
      element("p", { text: "إذا كنت تخشى أن يرى أحد هذه الصفحة، استخدم زر الخروج السريع أو اضغط Escape مرتين. لا يستطيع الخروج السريع مسح سجل المتصفح أو منع مراقبة الجهاز." })
    ]),
    list,
    resultBox,
    element("div", { class: "cluster" }, [
      element("button", {
        type: "button",
        class: "button button--danger",
        text: "امسح هذه الإجابات الآن",
        onclick: () => {
          Object.keys(answers).forEach((itemId) => delete answers[itemId]);
          storage.removeSession(storage.sessionKey.safetyCheck);
          announce("مُسحت إجابات المراجعة الخاصة.");
          navigate("#/safety");
        }
      }),
      element("a", { class: "button button--secondary", href: "#/safety", text: "ارجع إلى صفحة الأمان" })
    ])
  ]);

  paintResult();
  return root;
}
