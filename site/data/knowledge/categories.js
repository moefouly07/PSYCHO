/*
 * "قد إيه تعرفني؟" — knowledge challenge categories (content kind: "knowledge").
 *
 * This is a same-device, session-only activity. It measures recognition of
 * this session's answers and nothing else: not love, not commitment, not
 * honesty, not compatibility, and not relationship quality.
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
      kind: "knowledge",
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION
    };
  }

  var categories = [
    category("routines", "الروتين اليومي والراحة", "الروتين", "الإيقاع اليومي وما يريح فعلًا في نهاية اليوم."),
    category("joy", "المتعة والتفضيلات", "المتعة", "ما الذي يُدخل البهجة، وما الذي يُختار في وقت الفراغ."),
    category("stress", "الضغط والدعم المطلوب", "الضغط", "علامات الضغط وشكل الدعم الذي يفيد.", "personal"),
    category("communication", "تفضيلات التواصل", "التواصل", "طريقة الحديث المفضلة وتوقيته."),
    category("repair", "الخلاف والاعتذار والإصلاح", "الإصلاح", "ما يحدث أثناء الخلاف وبعده.", "personal"),
    category("values", "القيم والأولويات", "القيم", "ما الذي يأتي أولًا عند التعارض.", "personal"),
    category("future", "الأهداف والأحلام", "المستقبل", "ما الذي يُخطط له وما الذي يبقى أمنية."),
    category("money", "المال", "المال", "الموقف من الصرف والادخار والأمان المالي.", "personal"),
    category("family", "الأهل والعلاقات الاجتماعية", "الأهل", "مساحة الأهل والأصدقاء والحياة الاجتماعية.", "personal"),
    category("boundaries", "الحدود والخصوصية الرقمية", "الحدود", "ما هو خاص، وكيف يُقال «لا».", "personal"),
    category("affection", "المودة والحميمية", "المودة", "شكل المودة المفضل والراحة في التعبير. وحدة اختيارية للبالغين.", "intimate"),
    category("growth", "المخاوف والنمو والمعنى", "النمو", "ما يُخاف منه، وما يُراد تغييره، وما يعطي معنى.", "personal")
  ];

  window.BAYNANA_KNOWLEDGE_CATEGORIES = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    categories: categories,
    reviewMarks: [
      { id: "accurate", label: "دقيق", scores: true, value: 1 },
      { id: "close", label: "قريب بما يكفي", scores: true, value: 0.5 },
      { id: "different", label: "مختلف", scores: true, value: 0 },
      { id: "ambiguous", label: "غامض أو لم يعد يصفني", scores: false },
      { id: "private", label: "خاص", scores: false }
    ],
    confidenceLevels: [
      { id: "low", label: "غير متأكد" },
      { id: "medium", label: "أظن ذلك" },
      { id: "high", label: "متأكد" }
    ],
    sessionLengths: [
      { id: "short", label: "قصيرة", items: 12 },
      { id: "medium", label: "متوسطة", items: 24 },
      { id: "long", label: "طويلة", items: 36 }
    ],
    disclaimer: "يقيس هذا التحدي التعرّف على إجابات هذه الجلسة فقط. لا يقيس الحب ولا الالتزام ولا الصدق ولا التوافق ولا جودة العلاقة."
  };
}());
