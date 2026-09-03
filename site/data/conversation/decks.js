/*
 * Curated conversation decks.
 *
 * A deck NEVER duplicates question text. It stores an ordered list of
 * canonical question IDs resolved from data/conversation/questions.js.
 * Membership is declared on each question via its `decks` tag, so a question
 * can appear in several decks while existing exactly once in the library.
 */
(function () {
  "use strict";

  var SCHEMA_VERSION = 1;
  var CONTENT_VERSION = 1;
  var MINIMUM_PER_DECK = 12;

  var library = window.BAYNANA_CONVERSATION_QUESTIONS;
  if (!library || !Array.isArray(library.questions)) {
    throw new Error("conversation/questions.js must load before conversation/decks.js");
  }

  var definitions = [
    {
      id: "light-start",
      title: "بداية خفيفة",
      description: "أسئلة قصيرة تفتح الحديث دون ضغط. مناسبة لأول جلسة.",
      depthHint: "light",
      sensitivity: "standard"
    },
    {
      id: "premarital-basics",
      title: "قبل الزواج: الأساسيات",
      description: "الموضوعات التي يُفضَّل ألا تُترك لما بعد الزواج: التوقعات، والتواصل، والمال، والأهل، والأدوار.",
      depthHint: "personal",
      sensitivity: "personal"
    },
    {
      id: "deep-talk",
      title: "حوار عميق",
      description: "أسئلة تحتاج إلى وقت وهدوء. اختارا سؤالًا أو سؤالين فقط في الجلسة.",
      depthHint: "deep",
      sensitivity: "personal"
    },
    {
      id: "hard-decisions",
      title: "القرارات الصعبة",
      description: "مفاضلات لا توجد فيها إجابة مريحة. الهدف معرفة معيار كل منكما، لا الاتفاق.",
      depthHint: "personal",
      sensitivity: "personal"
    },
    {
      id: "money-duties",
      title: "المال والمسؤوليات",
      description: "المال والدين والالتزامات تجاه الأهل، بلغة عملية بلا أرقام شخصية.",
      depthHint: "personal",
      sensitivity: "personal"
    },
    {
      id: "family-limits",
      title: "الأهل والحدود",
      description: "مساحة العائلة والأصدقاء والخصوصية، وكيف تُوضع الحدود ومن يضعها.",
      depthHint: "personal",
      sensitivity: "personal"
    },
    {
      id: "our-future",
      title: "مستقبلنا معًا",
      description: "الصورة التي يتخيلها كل منكما للسنوات القادمة، وما الذي يجب أن يُقال الآن.",
      depthHint: "personal",
      sensitivity: "standard"
    },
    {
      id: "weekly",
      title: "جلسة أسبوعية",
      description: "أسئلة قصيرة للمراجعة المنتظمة. لا تحتاج إلى أكثر من ربع ساعة.",
      depthHint: "light",
      sensitivity: "standard"
    },
    {
      id: "crisis",
      title: "وقت الأزمات",
      description: "الفقد والمرض والضغط والتغيّر المفاجئ: ما الذي يساعد كل منكما فعلًا.",
      depthHint: "deep",
      sensitivity: "personal"
    },
    {
      id: "affection",
      title: "المودة والحميمية",
      description: "المودة والقرب والموافقة. وحدة اختيارية للبالغين، ويمكن تخطي أي سؤال دون تفسير.",
      depthHint: "personal",
      sensitivity: "intimate",
      adultOnly: true,
      optional: true
    }
  ];

  var decks = definitions.map(function (definition) {
    var questionIds = library.questions
      .filter(function (question) { return question.decks.indexOf(definition.id) !== -1; })
      .map(function (question) { return question.id; });

    if (questionIds.length < MINIMUM_PER_DECK) {
      throw new Error("Deck " + definition.id + " needs at least " + MINIMUM_PER_DECK + " questions, found " + questionIds.length);
    }

    return {
      id: definition.id,
      kind: "conversation-deck",
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      title: definition.title,
      description: definition.description,
      depthHint: definition.depthHint,
      sensitivity: definition.sensitivity,
      adultOnly: Boolean(definition.adultOnly),
      optional: Boolean(definition.optional),
      questionIds: questionIds
    };
  });

  window.BAYNANA_CONVERSATION_DECKS = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    minimumPerDeck: MINIMUM_PER_DECK,
    decks: decks
  };
}());
