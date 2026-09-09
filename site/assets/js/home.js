import { element } from "./dom.js";
import { assessmentPath } from "./router.js";

const link = (href, text, className = "editorial-link") => element("a", { href, class: className, text });

export function renderHome() {
  const tests = window.BAYNANA_DATA.tests;
  const question = window.BAYNANA_CONVERSATION_QUESTIONS?.questions?.[0];
  return element("div", { class: "home-page" }, [
    element("section", { class: "container home-opening" }, [
      element("div", { class: "opening-copy" }, [
        element("h1", {}, ["لكلٍّ منكما حكاية.", element("br"), element("em", { text: "وبينكما مساحة للفهم." })]),
        element("p", { class: "lede", text: "مساحة عربية خاصة لشخصين بالغين قبل الزواج. لفهم الذات، ومناقشة الاختيارات، وطرح الأسئلة التي تستحق وقتكما." }),
        element("p", { class: "opening-promise", text: "لا نسبة توافق، ولا حكم على العلاقة. فقط بداية لحوار أوضح." }),
        element("div", { class: "cluster" }, [link("#/assessments", "استكشفا التقييمات الذاتية", "button button--primary"), link("#/premarital", "الرحلة قبل الزواج ←")])
      ]),
      element("aside", { class: "opening-aside", "aria-label": "خصوصية المساحة وطريقة استخدامها" }, [
        element("svg", { viewBox: "0 0 200 100", class: "perspectives-mark", "aria-hidden": "true" }, [
          element("path", { d: "M80 12H30v76h50M120 12h50v76h-50M88 50h24", fill: "none", stroke: "currentColor", "stroke-width": "1.5" })
        ]),
        element("h2", { text: "على مهل، وبخصوصية" }),
        element("ul", { class: "quiet-list" }, ["تجيبان عن نفسيكما باستقلال", "تبقى الإجابات على الجهاز", "تشاركان الملخص حين تختاران", "دون حسابات أو إعلانات"].map(text => element("li", { text }))),
        link("#/privacy", "كيف نحافظ على الخصوصية؟")
      ])
    ]),
    element("section", { class: "container experience-index", "aria-label": "التجارب الأربع" }, [
      link("#/assessments", "فهم الذات"), link("#/premarital", "مناقشة الاختيارات"), link("#/questions", "فتح حوار"), link("#/know-me", "اكتشاف ما تعرفانه")
    ]),
    element("section", { class: "container home-chapter assessment-chapter" }, [
      element("header", { class: "stack" }, [
        element("h2", { text: "ابدأ بما تعرفه عن نفسك" }),
        element("p", { text: "تقييمات ذاتية للسلوك اليومي. يقرأ كل شخص أبعاده الستة، ثم يختار ما يريد مناقشته. ليست أدوات تشخيصية." }),
        link("#/assessments", `جميع التقييمات · ${tests.length} تقييمًا ←`)
      ]),
      element("div", { class: "assessment-directory" }, tests.slice(0, 3).map(test => link(assessmentPath(test.id), `${test.title} ←`, "directory-entry")))
    ]),
    element("section", { class: "alignment-chapter" }, [
      element("div", { class: "container home-chapter" }, [
        element("header", { class: "stack" }, [
          element("h2", { text: "اختياراتكما تستحق أن تُسمع" }),
          element("p", { text: "المال، والأهل، والأطفال، والعمل، وطريقة الحياة. خرائط محايدة تساعدكما على تسمية ما ناقشتماه وما لم تناقشاه بعد." }),
          link("#/premarital", "استكشفا الرحلة وخرائط الحوار ←")
        ]),
        element("div", { class: "alignment-language stack" }, [
          element("h3", { text: "أكثر من طريقة لبدء الحديث" }),
          element("div", { class: "neutral-statuses" }, ["متفقان", "قريبان", "مختلفان", "لم نتحدث بعد"].map(text => element("span", { text }))),
          element("p", { class: "fine-print", text: "أوصاف متساوية في قيمتها. الاختلاف ليس عيبًا، والاتفاق ليس ضمانًا." })
        ])
      ])
    ]),
    element("section", { class: "container home-chapter conversation-chapter" }, [
      element("header", { class: "stack" }, [
        element("h2", { text: "قد يبدأ الفهم بسؤال واحد" }),
        element("p", { text: "مكتبة أسئلة أصلية: من تفاصيل اليوم إلى القرارات التي تشكّل حياتكما. اختارا سؤالًا، واتركا مساحة للإجابة." }),
        link("#/questions", "افتحا مكتبة أسئلة بيننا ←")
      ]),
      element("blockquote", { class: "conversation-excerpt" }, [
        element("p", { text: question.prompt }),
        element("footer", { text: "سؤال من مكتبة بيننا" })
      ])
    ]),
    element("section", { class: "container knowledge-chapter" }, [
      element("div", { class: "stack" }, [
        element("h2", { text: "قد إيه تعرفني؟" }),
        element("p", { text: "مساحة أخف لاكتشاف تفضيلات بعضكما. تجيبان، وتخمّنان، ثم تستمعان إلى ما فاتكما. جلسة واحدة على جهاز واحد." })
      ]),
      link("#/know-me", "استكشفا تحدي المعرفة ←", "button button--secondary")
    ]),
    element("section", { class: "container home-close" }, [
      element("p", { text: "لا يلزم أن تنهيا كل شيء اليوم." }),
      link("#/how", "تعرّفا على طريقة الاستخدام"),
      link("#/safety", "الخصوصية والأمان")
    ])
  ]);
}
