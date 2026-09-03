/* Central product copy and cross-assessment settings. */
(function () {
  "use strict";

  var categories = [
    {
      id: "self",
      name: "فهم الذات",
      description: "التعرّف إلى المشاعر والموارد الداخلية وطريقة التعامل مع الذات."
    },
    {
      id: "attachment",
      name: "أنماط التعلق",
      description: "فهم القرب والاعتماد والطمأنينة دون تحويل النمط إلى هوية ثابتة."
    },
    {
      id: "communication",
      name: "التواصل والخلاف",
      description: "مهارات الاستماع والتعبير والتهدئة والإصلاح بعد سوء الفهم."
    },
    {
      id: "needs",
      name: "الاحتياجات والتوافق",
      description: "استكشاف الاحتياجات والقيم والتفضيلات التي تستحق حوارًا واضحًا."
    },
    {
      id: "traits",
      name: "السمات والسلوكيات",
      description: "مراجعة ذاتية حذرة لسلوكيات قد تؤثر في الأمان والاحترام المتبادل."
    },
    {
      id: "beliefs",
      name: "المعتقدات والتفكير النقدي",
      description: "فحص طريقة تقييم الأدلة وأثر الادعاءات في الحياة والعلاقة باحترام وحياد."
    }
  ];

  var config = {
    schemaVersion: 3,
    storageNamespace: "baynana:v1",
    /* Neutral destination used by the quick-exit control. Configurable. */
    quickExitDestination: "https://www.wikipedia.org/",
    brand: {
      name: "بيننا",
      heading: "افهما ما بينكما بصورة أعمق",
      headline: "افهما ما بينكما بصورة أعمق",
      support: "اختبارات عاطفية ونفسية إرشادية تساعدكما على اكتشاف نقاط التشابه والاختلاف وفتح حوار أكثر وضوحًا."
    },
    audience: {
      minimumAge: 18,
      label: "مصمّم لشخصين بالغين في علاقة عاطفية حالية أو ملتزمة",
      ageLabel: "للبالغين من عمر 18 عامًا فأكثر"
    },
    assessmentDescription: "اختبارات تقييم ذاتي إرشادية مستندة إلى أطر نفسية منشورة",
    navigation: [
      { id: "home", label: "الرئيسية", route: "#/" },
      { id: "assessments", label: "الاختبارات", route: "#/assessments" },
      { id: "how", label: "كيف يعمل؟", route: "#/how" },
      { id: "privacy", label: "الخصوصية", route: "#/privacy" },
      { id: "science", label: "الأساس العلمي", route: "#/science" }
    ],
    primaryAction: "ابدآ اختبارًا",
    categories: categories,
    counts: {
      assessments: 20,
      originalAssessments: 17,
      alignmentMaps: 8,
      conversationCategories: 20,
      conversationQuestions: 240,
      conversationDecks: 10,
      knowledgeCategories: 12,
      knowledgeItems: 96,
      questionsPerAssessment: 18,
      dimensionsPerAssessment: 6,
      questionsPerDimension: 3,
      answersPerQuestion: 3
    },
    comparison: {
      overallLabel: "نسبة تقارب الإجابات",
      explanation: "تمثل هذه النسبة مقدار التشابه بين النتائج المجمّعة في الأبعاد الستة، ولا تقيس جودة العلاقة ولا تتنبأ بمستقبلها.",
      ranges: [
        { min: 0, max: 10, label: "تقارب واضح" },
        { min: 11, max: 24, label: "اختلاف متوسط" },
        { min: 25, max: 100, label: "اختلاف يستحق الحوار" }
      ],
      rangesDisclaimer: "هذه نطاقات وصفية أولية للمنتج، وليست حدودًا علمية أو سريرية."
    },
    disclaimers: {
      global: "هذه اختبارات تقييم ذاتي إرشادية مستندة إلى أطر نفسية منشورة. صيغت بنودها لهذا الموقع، ولم تُقدَّم بوصفها أدوات عربية مُقنّنة أو اختبارات سريرية. لا تشخّص اضطرابًا ولا تحلّ محل تقييم مختص مؤهل.",
      selfReport: "أجب عن سلوكك وأفكارك ومشاعرك أنت؛ لا تستخدم النتيجة لتشخيص الطرف الآخر أو وضع ملصق عليه.",
      comparison: "المقارنة تصف تقارب الإجابات واختلافها فقط. لا تمنح نسبة للحب أو نجاح الزواج، ولا تحدد أيكما أفضل.",
      privacy: "تبقى الإجابات والتقدم والنتائج داخل هذا المتصفح، ولا تُرسل إلى خادم.",
      pairing: "رمز النتيجة مشفّر ترميزيًا للنقل فقط، وليس تشفيرًا أمنيًا. لا يحتوي الرمز على الإجابات الخام.",
      safety: "إذا وُجد تهديد أو إكراه أو إذلال أو مراقبة أو خوف أو أذى، فالأولوية للأمان وطلب دعم خاص من شخص موثوق ومختص محلي مؤهل. عند وجود خطر فوري، تواصل مع خدمات الطوارئ المحلية.",
      mahdi: "لا يستطيع أي استبيان نفسي تحديد المهدي أو إثبات هوية دينية أو خارقة أو نفيها. يراجع هذا التقييم طريقة فحص الأدلة، وإمكان التحقق المستقل، ووجود الإكراه أو الاستغلال، وأثر الاعتقاد في الحياة والعلاقة فقط."
    },
    safety: {
      privateMessageHeading: "الأمان أولًا",
      avoidJointConfrontation: "لا تبدأ مواجهة مشتركة فورًا إذا كنت تخشى رد فعل الطرف الآخر. اطلب دعمًا خاصًا وآمنًا أولًا.",
      immediateDanger: "إذا كان هناك خطر فوري، ابتعد إلى مكان آمن وتواصل مع خدمات الطوارئ المحلية."
    }
  };

  window.BAYNANA_CONFIG = config;
}());
