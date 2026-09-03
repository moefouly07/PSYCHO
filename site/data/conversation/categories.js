/*
 * "أسئلة بيننا" — conversation categories (content kind: "conversation").
 *
 * Conversation content is never scored. There is no polarity, no dimension,
 * no percentage, and no right answer. The library exists to open a talk,
 * not to measure anyone.
 */
(function () {
  "use strict";

  var SCHEMA_VERSION = 1;
  var CONTENT_VERSION = 1;

  function category(id, name, short, description, sensitivity) {
    return {
      id: id,
      name: name,
      short: short,
      description: description,
      sensitivity: sensitivity || "standard",
      kind: "conversation",
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION
    };
  }

  var categories = [
    category("identity", "الهوية وصورة الذات", "الهوية", "من أنت في نظر نفسك، وكيف تكوّنت هذه الصورة."),
    category("values", "القيم والاختيارات الأخلاقية", "القيم", "ما الذي يحكم اختياراتك حين تتعارض الاعتبارات."),
    category("meaning", "المعنى والغاية والأثر", "المعنى", "ما الذي يجعل الحياة ذات معنى بالنسبة إليك، وما الذي تودّ أن يبقى بعدك.", "personal"),
    category("love", "الحب والتقدير والشعور بالقيمة", "الحب", "كيف تُحبّ وكيف تعرف أنك محبوب."),
    category("needs", "الاحتياجات العاطفية والدعم", "الاحتياجات", "ما الذي تحتاج إليه فعلًا، وكيف يصل إليك الدعم."),
    category("communication", "التواصل والإصغاء", "التواصل", "كيف تقول ما تريد، وكيف تسمع ما يُقال."),
    category("repair", "الخلاف والاعتذار والإصلاح", "الإصلاح", "ما الذي يحدث بينكما بعد الخلاف، لا أثناءه فقط.", "personal"),
    category("trust", "الثقة والغيرة والخصوصية الرقمية", "الثقة", "ما الذي يبني الثقة، وما الذي يخدشها، وأين تقف الخصوصية.", "personal"),
    category("commitment", "الالتزام وتوقعات الزواج", "الالتزام", "ما الذي يعنيه الالتزام عمليًا، وما التوقعات غير المقولة."),
    category("money", "المال والدين والالتزامات", "المال", "علاقتك بالمال وما تعلّمته عنه، والالتزامات المتوقعة.", "personal"),
    category("work", "العمل والطموح والتعليم والسكن", "العمل", "مكانة العمل والدراسة والمكان في خطة حياتك."),
    category("daily", "الحياة اليومية والوقت والمسؤوليات", "اليومي", "الإيقاع والعادات وتقسيم ما يجب أن يُفعل."),
    category("family", "الأهل والأقارب والحدود", "الأهل", "مساحة العائلة الممتدة، والحدود التي تحتاجانها.", "personal"),
    category("friends", "الأصدقاء والمجتمع", "الأصدقاء", "الصداقات والحياة الاجتماعية ومكانها بينكما."),
    category("faith", "الدين والروحانية والعادات", "الدين والعادات", "الممارسة والمعنى والعادات، مع احترام الاختلاف.", "personal"),
    category("intimacy", "المودة والحميمية والموافقة", "المودة", "المودة والقرب والموافقة والخصوصية، للبالغين ووحدة اختيارية.", "intimate"),
    category("children", "الأطفال والإنجاب والتربية", "الأطفال", "الرغبة والتوقيت وشكل التربية المتوقع.", "personal"),
    category("health", "الصحة الجسدية والنفسية والرعاية", "الصحة", "العناية بالنفس، وطلب المساعدة، ورعاية الآخر عند المرض.", "personal"),
    category("leisure", "الترفيه والفضول والمغامرة", "الترفيه", "ما الذي يمتعك، وكيف ترتاح، وما الذي تودّ أن تجرّبه."),
    category("change", "الأزمات والفقد والتغيّر والمستقبل", "التغيّر", "كيف تتعامل مع الفقد والتغيّر، وما الذي تتخيله للمستقبل.", "personal")
  ];

  window.BAYNANA_CONVERSATION_CATEGORIES = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    categories: categories,
    groups: [
      { id: "discovery", label: "أسئلة تعارف", hint: "بداية خفيفة تفتح الحديث." },
      { id: "deep", label: "أسئلة عميقة", hint: "تأمل أطول في المعنى والخبرة." },
      { id: "decision", label: "أسئلة قرار ومفاضلة", hint: "اختيار بين أمرين كلاهما مهم." },
      { id: "scenario", label: "مواقف مستقبلية", hint: "موقف متخيّل يكشف التوقعات مبكرًا." }
    ],
    depthLevels: [
      { id: "light", label: "خفيف" },
      { id: "personal", label: "شخصي" },
      { id: "deep", label: "عميق" },
      { id: "sensitive", label: "حساس" }
    ],
    sensitivityLevels: [
      { id: "standard", label: "عادي" },
      { id: "personal", label: "شخصي" },
      { id: "intimate", label: "حميمي" },
      { id: "safety", label: "متعلق بالسلامة" }
    ],
    modes: [
      { id: "open", label: "تأمل مفتوح" },
      { id: "example", label: "مثال ملموس" },
      { id: "philosophical", label: "سؤال فلسفي" },
      { id: "tradeoff", label: "مفاضلة" },
      { id: "scenario", label: "موقف مستقبلي" },
      { id: "ranking", label: "ترتيب أولويات" },
      { id: "decision", label: "قرار" },
      { id: "checkin", label: "مراجعة أسبوعية" }
    ],
    stages: [
      { id: "any", label: "أي مرحلة" },
      { id: "dating", label: "تعارف" },
      { id: "engaged", label: "خطوبة" },
      { id: "premarital", label: "ما قبل الزواج مباشرة" }
    ]
  };
}());
