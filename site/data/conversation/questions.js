/*
 * "أسئلة بيننا" — 240 original Arabic conversation questions.
 *
 * NOT an assessment. No question here carries a score, a dimension, a
 * polarity, or a right answer. Written answers are never collected or stored.
 *
 * Each category holds exactly twelve questions in four groups of three:
 *   discovery · deep · decision · scenario
 *
 * None of these questions reproduces, translates, or paraphrases the wording
 * of any published question set, including the widely circulated 36-question
 * procedure. Gradual reciprocal disclosure informed the ORDER of the library
 * (light → personal → deep), nothing more. Baynana does not claim that any
 * sequence of questions makes people fall in love.
 */
(function () {
  "use strict";

  var SCHEMA_VERSION = 1;
  var CONTENT_VERSION = 1;

  var GROUP_DEFAULTS = {
    discovery: { depth: "light", mode: "open", minutes: 3 },
    deep: { depth: "deep", mode: "philosophical", minutes: 7 },
    decision: { depth: "personal", mode: "tradeoff", minutes: 5 },
    scenario: { depth: "personal", mode: "scenario", minutes: 5 }
  };

  var currentCategory = null;
  var currentSensitivity = "standard";
  var questions = [];

  function group(categoryId, sensitivity) {
    currentCategory = categoryId;
    currentSensitivity = sensitivity || "standard";
  }

  /* q(id, group, prompt, followUp, extra) */
  function q(id, groupId, prompt, followUp, extra) {
    var defaults = GROUP_DEFAULTS[groupId];
    var options = extra || {};
    questions.push({
      id: id,
      cat: currentCategory,
      kind: "conversation",
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      group: groupId,
      prompt: prompt,
      followUp: followUp || "",
      depth: options.depth || defaults.depth,
      mode: options.mode || defaults.mode,
      sensitivity: options.sensitivity || currentSensitivity,
      minutes: options.minutes || defaults.minutes,
      stage: options.stage || "any",
      decks: options.decks || []
    });
  }

  /* ===================== ١ الهوية وصورة الذات ===================== */
  group("identity");
  q("id01", "discovery", "ما الوصف الذي يستخدمه الناس عنك وتشعر أنه أبعد ما يكون عن حقيقتك؟", "ومن أين جاء هذا الوصف في رأيك؟", { decks: ["light-start", "deep-talk"] });
  q("id02", "discovery", "ما المهارة أو الاهتمام الذي يعرفه عنك عدد قليل جدًا من الناس؟", "ما الذي جعلك تحتفظ به لنفسك؟", { decks: ["light-start"] });
  q("id03", "discovery", "لو طُلب منك وصف نفسك بثلاث كلمات لا تتضمن عملك ولا علاقاتك، ماذا ستقول؟", "", { decks: ["light-start"] });
  q("id04", "deep", "ما الجزء منك الذي تغيّر أكثر من غيره في السنوات الخمس الأخيرة؟", "ما الذي دفع هذا التغيير: موقف بعينه أم تراكم؟", { decks: ["deep-talk"] });
  q("id05", "deep", "متى شعرت أنك كنت على طبيعتك تمامًا مع شخص آخر؟", "ما الذي كان موجودًا في تلك اللحظة وجعل ذلك ممكنًا؟", { decks: ["deep-talk", "affection"] });
  q("id06", "deep", "ما الشيء الذي تعلّمته عن نفسك بعد موقف لم تخرج منه كما دخلت؟", "", { depth: "deep", decks: ["deep-talk"] });
  q("id07", "decision", "لو خُيّرت بين أن يفهمك الناس أو أن يقدّروك، أيهما تختار؟", "ما الذي يجعل أحدهما أثقل من الآخر عندك؟", { decks: ["deep-talk"] });
  q("id08", "decision", "أيهما أقرب إليك: أن تبقى ثابتًا على ما أنت عليه، أم أن تتغير باستمرار؟", "ما الثمن الذي دفعته مقابل اختيارك؟");
  q("id09", "decision", "لو اضطررت إلى التخلي عن جانب واحد من هويتك لأجل حياة أسهل، ما الجانب الذي ترفض التخلي عنه أبدًا؟", "", { decks: ["hard-decisions"] });
  q("id10", "scenario", "تخيّل أنك انتقلت إلى مكان لا يعرفك فيه أحد. ما الذي ستحرص على أن تبقيه من نفسك؟", "وما الذي ستسمح لنفسك بتغييره؟", { decks: ["our-future"] });
  q("id11", "scenario", "لو كتب عنك شخص يعرفك جيدًا صفحة واحدة، ما الذي تتمنى أن يذكره؟ وما الذي تخشى أن يذكره؟", "");
  q("id12", "scenario", "بعد عشر سنوات، ما الشيء الذي تتمنى أن تقوله عن نفسك ولا تستطيع قوله اليوم؟", "", { decks: ["our-future", "deep-talk"] });

  /* ===================== ٢ القيم والاختيارات الأخلاقية ===================== */
  group("values");
  q("va01", "discovery", "ما القاعدة التي تعلّمتها في بيتكم وما زلت تعمل بها حتى اليوم؟", "وهل اخترتها أم ورثتها؟", { decks: ["light-start", "premarital-basics"] });
  q("va02", "discovery", "ما الموقف الصغير الذي يكشف أخلاق الشخص أكثر من المواقف الكبيرة في رأيك؟", "", { decks: ["light-start"] });
  q("va03", "discovery", "ما القيمة التي تراها نادرة في الناس اليوم؟", "متى رأيتها آخر مرة؟");
  q("va04", "deep", "هل هناك قيمة كنت متمسكًا بها ثم غيّرت رأيك فيها؟", "ما الذي جعلك تراجعها؟", { decks: ["deep-talk"] });
  q("va05", "deep", "ما الفرق عندك بين أن يكون التصرف مقبولًا وأن يكون صحيحًا؟", "", { decks: ["deep-talk"] });
  q("va06", "deep", "ما الموقف الذي عرفت فيه ما هو الصواب لكنك لم تفعله؟", "ما الذي منعك، وماذا فعلت بعدها؟", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("va07", "decision", "أيهما أثقل عندك: كذبة صغيرة تحمي شخصًا، أم صدق يجرحه؟", "", { decks: ["hard-decisions"] });
  q("va08", "decision", "لو تعارضت العدالة مع مصلحة شخص قريب منك، أي الطرفين تختار؟", "هل حدث ذلك فعلًا من قبل؟", { decks: ["hard-decisions"] });
  q("va09", "decision", "أيهما أهم في القرار: النية أم النتيجة؟", "");
  q("va10", "scenario", "لو عُرض عليك عمل جيد الدخل لكنه يخالف قناعة عندك، ماذا ستفعل؟", "وما الذي قد يغيّر جوابك؟", { decks: ["hard-decisions", "our-future"] });
  q("va11", "scenario", "لو اكتشفت أن صديقًا قريبًا يظلم شخصًا بلا علمه، ماذا ستفعل؟", "");
  q("va12", "scenario", "لو طُلب منك أن تصمت عن خطأ مقابل راحة الجميع، ما الذي سيحسم قرارك؟", "", { decks: ["hard-decisions"] });

  /* ===================== ٣ المعنى والغاية والأثر ===================== */
  group("meaning", "personal");
  q("me01", "discovery", "ما النشاط الذي تنسى الوقت وأنت تفعله؟", "ما الذي فيه تحديدًا يفعل ذلك بك؟", { decks: ["light-start"] });
  q("me02", "discovery", "من الشخص الذي ترك في حياتك أثرًا لا يعرف هو بحجمه؟", "", { decks: ["deep-talk"] });
  q("me03", "discovery", "ما الشيء الذي تفعله ولا يراه أحد لكنك تعتبره مهمًا؟", "");
  q("me04", "deep", "ما الذي يجعل يومًا عاديًا يستحق أن يُعاش في نظرك؟", "", { decks: ["deep-talk"] });
  q("me05", "deep", "كيف تغيّرت فكرتك عن النهاية والموت مع الوقت؟", "وهل غيّرت شيئًا في طريقة عيشك؟", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("me06", "deep", "ما الذي تودّ أن يستمر بعدك: فكرة، أم عادة، أم شخص تغيّر بسببك؟", "", { decks: ["deep-talk", "our-future"] });
  q("me07", "decision", "أيهما تختار: حياة هادئة قليلة الأثر، أم حياة متعبة واسعة الأثر؟", "", { decks: ["hard-decisions"] });
  q("me08", "decision", "لو خُيّرت بين أن تُذكر بعملك أو بأخلاقك، أيهما تفضّل؟", "");
  q("me09", "decision", "أيهما أقرب إليك: أن تترك أثرًا في عدد قليل بعمق، أم في عدد كبير بسطحية؟", "");
  q("me10", "scenario", "لو علمت أن أمامك سنة واحدة فقط بصحة كاملة، ما أول شيء ستغيّره؟", "وما الذي يمنعك من تغييره الآن؟", { decks: ["deep-talk", "our-future"] });
  q("me11", "scenario", "لو أتيح لك أن تكتب رسالة تُقرأ بعد عشرين سنة، لمن ستكتبها وماذا ستقول؟", "");
  q("me12", "scenario", "تخيّل أن كل ما تملكه ذهب وبقي ما تعرفه وتحبه. ما الذي ستبني به من جديد؟", "", { decks: ["crisis"] });

  /* ===================== ٤ الحب والتقدير والشعور بالقيمة ===================== */
  group("love");
  q("lv01", "discovery", "ما التصرف الصغير الذي يجعلك تشعر بأنك محبوب أكثر من الكلام؟", "متى فعله أحد آخر مرة؟", { decks: ["light-start", "affection", "weekly"] });
  q("lv02", "discovery", "كيف تعرف أن أحدهم يفكر فيك دون أن يقول؟", "", { decks: ["light-start", "affection"] });
  q("lv03", "discovery", "ما الشيء الذي أحببته في شخص قبل أن تعرفه جيدًا وتبيّن أنه صحيح؟", "", { decks: ["affection"] });
  q("lv04", "deep", "ما الفرق عندك بين أن تُحَبّ وأن تُفهم؟", "أيهما تفتقده أكثر؟", { decks: ["deep-talk", "affection"] });
  q("lv05", "deep", "كيف تعلّمت أن تعبّر عن الحب: بالمشاهدة أم بالتجربة أم بالحرمان؟", "", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("lv06", "deep", "ما الذي يجعل التقدير يصل إليك فعلًا بدل أن يمر كمجاملة؟", "", { decks: ["affection", "weekly"] });
  q("lv07", "decision", "أيهما أهم لك: أن يُظهر لك الحب أمام الناس، أم في التفاصيل بينكما؟", "", { decks: ["affection"] });
  q("lv08", "decision", "لو خُيّرت بين شريك يفهمك بصمت أو شريك يعبّر كثيرًا، أيهما تختار؟", "");
  q("lv09", "decision", "أيهما أصعب عليك: أن تطلب الاهتمام، أم أن تنتظر أن يُلاحظ؟", "", { decks: ["affection", "weekly"] });
  q("lv10", "scenario", "لو مرّت فترة طويلة انشغلتما فيها، ما العلامة التي ستطمئنك أن شيئًا لم يتغير؟", "", { decks: ["affection", "our-future"] });
  q("lv11", "scenario", "لو أردت أن تُريني كيف تحب دون أن تتكلم، ماذا ستفعل في أسبوع واحد؟", "", { decks: ["affection"] });
  q("lv12", "scenario", "تخيّل يومًا سيئًا جدًا مرّ بك. ما الذي تتمنى أن يفعله من يحبك في ذلك اليوم؟", "", { decks: ["affection", "weekly", "crisis"] });

  /* ===================== ٥ الاحتياجات العاطفية والدعم ===================== */
  group("needs");
  q("nd01", "discovery", "ما الذي يهدّئك بسرعة حين تكون متوترًا؟", "", { decks: ["light-start", "weekly"] });
  q("nd02", "discovery", "حين تحكي عن مشكلة، هل تريد إنصاتًا أم رأيًا أم مساعدة عملية؟", "وهل يختلف ذلك بحسب الموقف؟", { decks: ["weekly", "premarital-basics"] });
  q("nd03", "discovery", "ما الشيء الذي تحتاج إليه بعد يوم طويل ولا تطلبه عادةً؟", "", { decks: ["weekly", "affection"] });
  q("nd04", "deep", "ما الاحتياج الذي تعلّمت أن تخفيه لأنك ظننته ثقيلًا على الآخرين؟", "", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("nd05", "deep", "متى شعرت آخر مرة أن أحدًا فهم ما تحتاج إليه دون أن تشرح؟", "ما الذي جعله يفهم؟", { decks: ["deep-talk", "affection"] });
  q("nd06", "deep", "ما الفرق عندك بين الاعتماد على شخص والاتكال عليه؟", "", { decks: ["deep-talk"] });
  q("nd07", "decision", "أيهما تفضّل حين تكون متعبًا: أن يُترك لك المجال، أم أن يقترب منك أحد؟", "", { decks: ["weekly", "premarital-basics"] });
  q("nd08", "decision", "أيهما أصعب: أن تطلب مساعدة، أم أن ترفض مساعدة لا تريدها؟", "");
  q("nd09", "decision", "لو كان عليك اختيار احتياج واحد يُلبّى دائمًا، ماذا ستختار: الأمان، أم التقدير، أم المساحة؟", "", { mode: "ranking", decks: ["premarital-basics"] });
  q("nd10", "scenario", "لو مررت بفترة ضعف طويلة، ما الشكل الذي تريد أن يأخذه الدعم؟", "وما الشكل الذي سيزيد الأمر سوءًا؟", { decks: ["crisis", "our-future"] });
  q("nd11", "scenario", "تخيّل أنك احتجت إلى شيء وطلبته ولم يصل. ماذا ستفعل بعدها؟", "", { decks: ["weekly"] });
  q("nd12", "scenario", "لو تعارض احتياجك للراحة مع احتياج شريكك للحديث في اللحظة نفسها، كيف تحلّانها؟", "", { decks: ["premarital-basics", "weekly"] });

  /* ===================== ٦ التواصل والإصغاء ===================== */
  group("communication");
  q("cm01", "discovery", "ما الوقت الأنسب لك للحديث في موضوع مهم؟", "", { decks: ["light-start", "weekly", "premarital-basics"] });
  q("cm02", "discovery", "ما الجملة التي تجعلك تغلق باب الحديث فورًا؟", "", { decks: ["premarital-basics", "weekly"] });
  q("cm03", "discovery", "كيف تعرف أن أحدهم يستمع إليك فعلًا؟", "", { decks: ["light-start"] });
  q("cm04", "deep", "ما الموضوع الذي يصعب عليك أن تبدأه دائمًا؟", "ما الذي يجعله صعبًا: الموضوع نفسه أم رد الفعل المتوقع؟", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("cm05", "deep", "ما الذي تعلّمته في بيتكم عن الحديث في الأمور الصعبة؟", "وهل تريد أن تكرره؟", { decks: ["deep-talk", "premarital-basics"] });
  q("cm06", "deep", "متى كان صمتك أوضح من كلامك؟", "");
  q("cm07", "decision", "أيهما تفضّل: أن يقال لك الأمر بصراحة قد تجرح، أم بلطف قد يخفي؟", "", { decks: ["premarital-basics", "weekly"] });
  q("cm08", "decision", "أيهما أفضل عندك: حسم النقاش الآن، أم تأجيله حتى يهدأ الطرفان؟", "", { decks: ["premarital-basics"] });
  q("cm09", "decision", "لو اضطررت للاختيار: شريك يقول كل شيء فورًا، أم شريك يفكر ثم يتكلم؟", "");
  q("cm10", "scenario", "لو أردت أن تخبرني بشيء تعرف أنه سيزعجني، كيف ستبدأ؟", "", { decks: ["premarital-basics", "weekly"] });
  q("cm11", "scenario", "تخيّل أنك شرحت شيئًا مرتين ولم يُفهم. ماذا ستفعل في المرة الثالثة؟", "");
  q("cm12", "scenario", "لو اتفقنا على إشارة تعني «أحتاج إلى توقف الآن»، ما الشكل الذي تقترحه؟", "", { decks: ["weekly", "crisis"] });

  /* ===================== ٧ الخلاف والاعتذار والإصلاح ===================== */
  group("repair", "personal");
  q("rp01", "discovery", "ما الذي يساعدك على الهدوء بعد خلاف؟", "كم من الوقت تحتاج عادةً؟", { decks: ["premarital-basics", "weekly"] });
  q("rp02", "discovery", "كيف يبدو الاعتذار المقبول عندك؟", "", { decks: ["premarital-basics", "weekly"] });
  q("rp03", "discovery", "ما العلامة التي تقول لك إن الخلاف انتهى فعلًا؟", "", { decks: ["weekly"] });
  q("rp04", "deep", "ما الخلاف الذي غيّر شيئًا فيك للأفضل؟", "", { decks: ["deep-talk"] });
  q("rp05", "deep", "ما الذي يجعل المسامحة ممكنة عندك؟ وما الذي يجعلها مستحيلة؟", "", { depth: "deep", decks: ["deep-talk", "crisis"] });
  q("rp06", "deep", "هل تعلّمت الخلاف من بيت يتشاجر أم من بيت يصمت؟", "وماذا أخذت من ذلك؟", { decks: ["deep-talk", "premarital-basics"] });
  q("rp07", "decision", "أيهما أهم بعد الخطأ: الاعتذار أم تغيير السلوك؟", "", { decks: ["premarital-basics"] });
  q("rp08", "decision", "أيهما تفضّل: خلاف واضح وصريح، أم تجاهل يمر بسلام؟", "");
  q("rp09", "decision", "لو تكرر خطأ صغير كثيرًا، هل تتحدث في كل مرة أم تجمعها لحديث واحد؟", "", { decks: ["weekly"] });
  q("rp10", "scenario", "لو قلت في لحظة غضب جملة جارحة، ماذا تتوقع أن يحدث بعدها؟", "", { decks: ["premarital-basics", "crisis"] });
  q("rp11", "scenario", "تخيّل خلافًا لم يُحسم بعد أسبوعين. ما الخطوة التي تقترحها؟", "", { decks: ["crisis"] });
  q("rp12", "scenario", "لو احتجنا يومًا إلى طرف ثالث محايد، متى تعتبر ذلك مناسبًا؟", "", { decks: ["crisis", "premarital-basics"] });

  /* ===================== ٨ الثقة والغيرة والخصوصية ===================== */
  group("trust", "personal");
  q("tr01", "discovery", "ما الذي يبني الثقة عندك ببطء ولا يُختصر؟", "", { decks: ["premarital-basics", "family-limits"] });
  q("tr02", "discovery", "ما معنى الخصوصية بالنسبة إليك داخل علاقة؟", "", { decks: ["premarital-basics", "family-limits"] });
  q("tr03", "discovery", "ما الذي يطمئنك حين تشعر بعدم اليقين؟", "", { decks: ["weekly"] });
  q("tr04", "deep", "ما الفرق عندك بين السرية والخصوصية؟", "", { decks: ["deep-talk", "family-limits"] });
  q("tr05", "deep", "متى شعرت بالغيرة وكانت الرسالة الحقيقية شيئًا آخر؟", "ما الذي كنت تحتاج إليه فعلًا؟", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("tr06", "deep", "هل يمكن أن تعود الثقة كما كانت بعد خدشها؟", "ما الذي يجعل ذلك ممكنًا؟", { decks: ["deep-talk", "crisis"] });
  q("tr07", "decision", "أيهما تفضّل: شفافية كاملة في الهواتف، أم خصوصية متفق عليها؟", "", { decks: ["family-limits", "premarital-basics", "hard-decisions"] });
  q("tr08", "decision", "لو عرفت خبرًا يخص شريكك من شخص آخر، هل تسأله مباشرة أم تنتظر؟", "", { decks: ["family-limits"] });
  q("tr09", "decision", "أيهما أثقل: كذبة صغيرة متكررة، أم صمت طويل عن أمر مهم؟", "", { decks: ["hard-decisions"] });
  q("tr10", "scenario", "لو شعرت بقلق تجاه شيء ولم يكن لديك دليل، ماذا ستفعل؟", "", { decks: ["family-limits", "weekly"] });
  q("tr11", "scenario", "تخيّل أن صداقة قديمة لأحدنا أزعجت الآخر. كيف نتعامل معها؟", "", { decks: ["family-limits"] });
  q("tr12", "scenario", "لو اتفقنا على قواعد للخصوصية الرقمية، ما القاعدة الأولى التي تقترحها؟", "", { decks: ["premarital-basics", "family-limits"] });

  /* ===================== ٩ الالتزام وتوقعات الزواج ===================== */
  group("commitment");
  q("cm01x", "discovery", "ما التصرف اليومي الذي يقول لك: هذا شخص ملتزم؟", "", { decks: ["premarital-basics", "our-future"] });
  q("cm02x", "discovery", "ما الذي تتوقعه من السنة الأولى بعد الزواج؟", "", { decks: ["premarital-basics", "our-future"], stage: "engaged" });
  q("cm03x", "discovery", "ما الشيء الذي تعتبره غير قابل للتفاوض في الزواج؟", "", { decks: ["premarital-basics"] });
  q("cm04x", "deep", "ما الفرق عندك بين الاستمرار في العلاقة واختيارها من جديد كل يوم؟", "", { decks: ["deep-talk", "our-future"] });
  q("cm05x", "deep", "ما الذي رأيته في زيجات من حولك وقررت ألا تكرره؟", "وما الذي قررت أن تأخذه؟", { depth: "deep", decks: ["deep-talk", "premarital-basics"] });
  q("cm06x", "deep", "هل الالتزام عندك وعد أم قرار متجدد أم مسؤولية؟", "وما الموقف الذي جعلك تراه هكذا؟", { decks: ["deep-talk"] });
  q("cm07x", "decision", "أيهما أهم في بداية الزواج: الاستقرار المالي أم الاستقرار العاطفي؟", "", { decks: ["hard-decisions", "premarital-basics", "money-duties"] });
  q("cm08x", "decision", "لو تأخر الزواج سنتين لظرف خارج إرادتنا، ما الذي سيحدد قرارنا؟", "", { decks: ["hard-decisions", "our-future"], stage: "engaged" });
  q("cm09x", "decision", "أيهما تفضّل: خطة واضحة للسنوات الخمس، أم مرونة بلا خطة؟", "", { decks: ["our-future"] });
  q("cm10x", "scenario", "لو تغيّر ظرف كبير عند أحدنا بعد الزواج، ما الذي تتوقع أن يبقى ثابتًا؟", "", { decks: ["our-future", "crisis"] });
  q("cm11x", "scenario", "تخيّل أننا اختلفنا في قرار كبير ولم نتفق. ما الطريقة التي نحسم بها؟", "", { decks: ["hard-decisions", "premarital-basics"] });
  q("cm12x", "scenario", "لو أردنا مراجعة توقعاتنا بعد سنة من الزواج، ما أول سؤال نبدأ به؟", "", { decks: ["our-future", "weekly"] });

  /* ===================== ١٠ المال والدين والالتزامات ===================== */
  group("money", "personal");
  q("mn01", "discovery", "ما أول شيء تعلّمته عن المال في بيتكم؟", "وهل ما زال يؤثر فيك؟", { decks: ["money-duties", "premarital-basics"] });
  q("mn02", "discovery", "ما الشيء الذي لا تندم أبدًا على الصرف عليه؟", "", { decks: ["money-duties", "light-start"] });
  q("mn03", "discovery", "ما الذي يشعرك بالأمان المالي: المبلغ في الحساب أم مصدر دخل ثابت؟", "", { decks: ["money-duties"] });
  q("mn04", "deep", "ما الذي يمثله المال بالنسبة إليك: حرية، أم أمان، أم مكانة، أم أداة؟", "", { decks: ["money-duties", "deep-talk"] });
  q("mn05", "deep", "هل مررت بفترة ضيق مالي غيّرت نظرتك؟", "ما الذي تغيّر؟", { depth: "deep", sensitivity: "personal", decks: ["money-duties", "deep-talk"] });
  q("mn06", "deep", "ما الذي يجعل الحديث عن المال صعبًا بين اثنين في رأيك؟", "", { decks: ["money-duties", "deep-talk"] });
  q("mn07", "decision", "أيهما تفضّل: حساب مشترك بالكامل، أم حسابات منفصلة مع مصروف مشترك؟", "", { decks: ["money-duties", "hard-decisions", "premarital-basics"] });
  q("mn08", "decision", "أيهما أهم: سداد دين قائم بسرعة، أم بناء احتياطي للطوارئ؟", "", { decks: ["money-duties", "hard-decisions"] });
  q("mn09", "decision", "أيهما أقرب إليك: الصرف على تجربة تُنسى بعد شهر، أم الادخار لشيء بعيد؟", "", { decks: ["money-duties"] });
  q("mn10", "scenario", "لو احتاج أحد الأهل إلى دعم مالي كبير، كيف نقرر؟", "", { decks: ["money-duties", "family-limits", "hard-decisions"] });
  q("mn11", "scenario", "لو فقد أحدنا مصدر دخله لستة أشهر، ما أول ثلاثة أشياء نغيّرها؟", "", { decks: ["money-duties", "crisis"] });
  q("mn12", "scenario", "لو اكتشفنا أن أحدنا صرف مبلغًا كبيرًا دون حديث، ماذا نفعل بعدها؟", "", { decks: ["money-duties", "crisis"] });

  /* ===================== ١١ العمل والطموح والتعليم والسكن ===================== */
  group("work");
  q("wk01", "discovery", "ما الجزء الذي تحبه فعلًا في عملك أو دراستك؟", "", { decks: ["light-start"] });
  q("wk02", "discovery", "ما الشيء الذي تودّ أن تتعلمه ولم تجد له وقتًا؟", "", { decks: ["light-start", "our-future"] });
  q("wk03", "discovery", "ما شكل البيت الذي تشعر فيه بالراحة؟", "", { decks: ["premarital-basics", "our-future"] });
  q("wk04", "deep", "ما الذي يجعل العمل ذا معنى بالنسبة إليك، لا مجرد مصدر دخل؟", "", { decks: ["deep-talk"] });
  q("wk05", "deep", "هل غيّرت طموحك مع الوقت؟", "ما الذي جعلك تغيّره: نضج أم تعب أم ظرف؟", { depth: "deep", decks: ["deep-talk"] });
  q("wk06", "deep", "ما الذي تخاف أن تخسره وأنت تلاحق ما تريد؟", "", { decks: ["deep-talk", "our-future"] });
  q("wk07", "decision", "أيهما تختار: عمل مستقر بدخل أقل، أم عمل متقلب بدخل أعلى؟", "", { decks: ["hard-decisions", "money-duties"] });
  q("wk08", "decision", "لو تعارض ترقّي أحدنا مع استقرار الآخر، كيف نقرر؟", "", { decks: ["hard-decisions", "our-future"] });
  q("wk09", "decision", "أيهما أهم عند اختيار السكن: القرب من العمل، أم القرب من الأهل؟", "", { decks: ["hard-decisions", "family-limits", "premarital-basics"] });
  q("wk10", "scenario", "لو جاءت فرصة عمل ممتازة في مدينة أخرى، ما الذي سنسأله قبل القرار؟", "", { decks: ["hard-decisions", "our-future"] });
  q("wk11", "scenario", "تخيّل أن أحدنا أراد العودة إلى الدراسة بدوام كامل. كيف ندبّر ذلك؟", "", { decks: ["our-future", "money-duties"] });
  q("wk12", "scenario", "لو صار العمل يأخذ أغلب وقتنا لسنة، ما الذي نحميه من التآكل؟", "", { decks: ["our-future", "weekly"] });

  /* ===================== ١٢ الحياة اليومية والوقت والمسؤوليات ===================== */
  group("daily");
  q("dy01", "discovery", "ما الروتين الصغير الذي يجعل يومك أفضل؟", "", { decks: ["light-start", "weekly"] });
  q("dy02", "discovery", "ما المهمة المنزلية التي لا تمانع تكرارها؟ وما التي تتهرب منها؟", "", { decks: ["premarital-basics", "light-start"] });
  q("dy03", "discovery", "متى تكون في أفضل حالاتك خلال اليوم؟", "", { decks: ["light-start", "weekly"] });
  q("dy04", "deep", "ما الفوضى التي لا تزعجك؟ وما الفوضى التي تستنزفك؟", "", { decks: ["premarital-basics"] });
  q("dy05", "deep", "من كان يحمل التخطيط والتذكّر في بيتكم؟", "وكيف أثّر ذلك في توقعاتك؟", { depth: "deep", decks: ["deep-talk", "premarital-basics"] });
  q("dy06", "deep", "ما معنى الراحة بالنسبة إليك: فراغ تام أم نشاط تختاره؟", "", { decks: ["deep-talk"] });
  q("dy07", "decision", "أيهما تفضّل: تقسيم ثابت للمهام، أم مرونة أسبوعية؟", "", { decks: ["premarital-basics", "hard-decisions"] });
  q("dy08", "decision", "لو ضاق الوقت، أيهما يُضحّى به أولًا: النظافة، أم الطعام المطبوخ، أم النوم؟", "", { mode: "ranking", decks: ["premarital-basics"] });
  q("dy09", "decision", "أيهما أهم: أن يُنجز العمل بطريقتك، أم أن يُنجز وينتهي؟", "", { decks: ["premarital-basics"] });
  q("dy10", "scenario", "لو مرّ أسبوع مزدحم على كلينا، ما الشيء الذي نحميه رغم كل شيء؟", "", { decks: ["weekly", "our-future"] });
  q("dy11", "scenario", "تخيّل أن أحدنا مرض أسبوعًا كاملًا. كيف يتغير توزيع اليوم؟", "", { decks: ["crisis", "premarital-basics"] });
  q("dy12", "scenario", "لو لاحظ أحدنا أن التوزيع لم يعد منصفًا، كيف يقولها؟", "", { decks: ["weekly", "premarital-basics"] });

  /* ===================== ١٣ الأهل والأقارب والحدود ===================== */
  group("family", "personal");
  q("fm01", "discovery", "ما العادة العائلية التي تودّ أن تنقلها معك؟", "", { decks: ["family-limits", "light-start"] });
  q("fm02", "discovery", "من الشخص في عائلتك الذي تلجأ إليه أولًا؟", "", { decks: ["family-limits"] });
  q("fm03", "discovery", "ما مقدار الزيارات العائلية الذي يريحك؟", "", { decks: ["family-limits", "premarital-basics"] });
  q("fm04", "deep", "ما الذي تعلّمته من علاقة والديك ببعضهما وقررت أن تفعله بشكل مختلف؟", "", { depth: "deep", sensitivity: "personal", decks: ["deep-talk", "family-limits"] });
  q("fm05", "deep", "ما الذي يجعل قول «لا» لأهلك صعبًا أو سهلًا؟", "", { decks: ["family-limits", "deep-talk"] });
  q("fm06", "deep", "هل هناك جرح عائلي قديم ما زال يؤثر في قراراتك؟", "لا داعي للتفاصيل إن لم ترغب.", { depth: "sensitive", sensitivity: "personal", decks: ["deep-talk"] });
  q("fm07", "decision", "أيهما تفضّل: قرب كبير من الأهل مع تدخل أكثر، أم مسافة أوسع مع استقلال أكبر؟", "", { decks: ["family-limits", "hard-decisions"] });
  q("fm08", "decision", "من يتكلم مع أهله حين نحتاج إلى وضع حد؟", "", { decks: ["family-limits", "premarital-basics"] });
  q("fm09", "decision", "أيهما أثقل عليك: أن تخيّب ظن أهلك، أم أن تخالف رغبتك؟", "", { decks: ["family-limits", "hard-decisions"] });
  q("fm10", "scenario", "لو قال أحد الأهل شيئًا جارحًا للطرف الآخر، ماذا تتوقع أن يحدث؟", "", { decks: ["family-limits", "crisis"] });
  q("fm11", "scenario", "تخيّل أن الأهل يريدون قرارًا ونحن نريد غيره. كيف نتصرف؟", "", { decks: ["family-limits", "hard-decisions"] });
  q("fm12", "scenario", "لو احتاج أحد الوالدين إلى رعاية يومية، كيف نرتّب حياتنا؟", "", { decks: ["family-limits", "crisis", "our-future"] });

  /* ===================== ١٤ الأصدقاء والمجتمع ===================== */
  group("friends");
  q("fr01", "discovery", "من الصديق الذي تغيّر معك ولم تتغير الصداقة؟", "", { decks: ["light-start"] });
  q("fr02", "discovery", "ما الذي تحتاجه من صديق ولا تحتاجه من شريك؟", "", { decks: ["light-start", "family-limits"] });
  q("fr03", "discovery", "كم مرة تحتاج إلى لقاء أصدقائك حتى تشعر بالتوازن؟", "", { decks: ["family-limits", "weekly"] });
  q("fr04", "deep", "ما الذي ينهي صداقة عندك؟", "", { decks: ["deep-talk"] });
  q("fr05", "deep", "هل تغيّرت صداقاتك بعد دخولك في علاقة جادة؟", "ما الذي تغيّر؟", { decks: ["deep-talk", "family-limits"] });
  q("fr06", "deep", "ما معنى الانتماء إلى مجتمع بالنسبة إليك؟", "", { decks: ["deep-talk"] });
  q("fr07", "decision", "أيهما تفضّل: دائرة صغيرة عميقة، أم دائرة واسعة خفيفة؟", "", { decks: ["light-start"] });
  q("fr08", "decision", "أيهما أهم: أن تكون صداقاتنا مشتركة، أم أن يحتفظ كل منا بصداقاته؟", "", { decks: ["family-limits", "hard-decisions"] });
  q("fr09", "decision", "لو تعارض موعد مع أصدقائك مع وقتنا معًا، كيف تختار؟", "", { decks: ["family-limits", "weekly"] });
  q("fr10", "scenario", "لو لم يرتح أحدنا لصديق مقرب من الآخر، ماذا نفعل؟", "", { decks: ["family-limits", "hard-decisions"] });
  q("fr11", "scenario", "تخيّل أننا انتقلنا إلى مكان لا نعرف فيه أحدًا. كيف نبني دائرة جديدة؟", "", { decks: ["our-future"] });
  q("fr12", "scenario", "لو احتاج صديق إلى مساعدة كبيرة منا، ما الحد الذي نتفق عليه؟", "", { decks: ["family-limits", "money-duties"] });

  /* ===================== ١٥ الدين والروحانية والعادات ===================== */
  group("faith", "personal");
  q("fa01", "discovery", "ما الممارسة التي تمنحك سكينة، دينية كانت أو غير ذلك؟", "", { decks: ["premarital-basics"] });
  q("fa02", "discovery", "ما العادة الموسمية التي تنتظرها كل سنة؟", "", { decks: ["light-start"] });
  q("fa03", "discovery", "ما الذي ورثته من قناعات ولم تراجعه بعد؟", "", { decks: ["deep-talk"] });
  q("fa04", "deep", "كيف تغيّرت علاقتك بالمعنى أو الدين مع الوقت؟", "", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("fa05", "deep", "ما الذي تجده صعبًا في التوفيق بين قناعتك وواقعك؟", "", { depth: "deep", sensitivity: "personal", decks: ["deep-talk"] });
  q("fa06", "deep", "ما الفرق عندك بين الممارسة والقناعة؟", "", { decks: ["deep-talk"] });
  q("fa07", "decision", "أيهما أهم في البيت: التزام مشترك واحد، أم مساحة لكل شخص؟", "", { decks: ["premarital-basics", "hard-decisions"] });
  q("fa08", "decision", "لو اختلفت ممارستنا، أيهما تفضّل: أن نتفق على حد أدنى مشترك، أم أن يترك كل منا للآخر مساحته؟", "", { decks: ["hard-decisions", "premarital-basics"] });
  q("fa09", "decision", "أيهما أثقل عليك: تنازل في العادات، أم تنازل في القناعة؟", "", { decks: ["hard-decisions"] });
  q("fa10", "scenario", "لو تغيّرت قناعة أحدنا بعد سنوات، ما الذي نحتاج إليه لنبقى بخير؟", "", { depth: "sensitive", decks: ["our-future", "crisis"] });
  q("fa11", "scenario", "تخيّل مناسبة تختلف فيها عادات عائلتينا. كيف ندبّرها؟", "", { decks: ["family-limits", "premarital-basics"] });
  q("fa12", "scenario", "لو أردنا أن نبني عادة روحية أو معنوية خاصة بنا، ما شكلها؟", "", { decks: ["our-future", "affection"] });

  /* ===================== ١٦ المودة والحميمية والموافقة ===================== */
  group("intimacy", "intimate");
  q("in01", "discovery", "ما نوع القرب الذي يريحك في يوم عادي؟", "", { depth: "personal", decks: ["affection"] });
  q("in02", "discovery", "ما الذي يجعلك تشعر بالراحة والأمان في وجود شخص؟", "", { depth: "personal", decks: ["affection"] });
  q("in03", "discovery", "كيف تحب أن يُطلب منك شيء، وكيف تحب أن يُستقبل رفضك؟", "", { depth: "personal", decks: ["affection", "premarital-basics"] });
  q("in04", "deep", "ما الفرق عندك بين القرب الجسدي والقرب العاطفي؟", "", { depth: "deep", decks: ["affection", "deep-talk"] });
  q("in05", "deep", "ما الذي يجعل الحديث في هذا الجانب سهلًا أو صعبًا عليك؟", "", { depth: "deep", decks: ["affection"] });
  q("in06", "deep", "ما الذي تعنيه الموافقة بالنسبة إليك في كل سياق، بما في ذلك الزواج؟", "", { depth: "deep", decks: ["affection", "premarital-basics"] });
  q("in07", "decision", "أيهما تفضّل: أن نتحدث في التوقعات صراحة، أم أن نكتشفها بالتجربة؟", "", { depth: "personal", decks: ["affection", "premarital-basics"] });
  q("in08", "decision", "أيهما أهم لك: الانتظام، أم أن تكون كل مرة باختيار متجدد؟", "", { depth: "personal", decks: ["affection"] });
  q("in09", "decision", "أيهما أصعب: أن تقول ما تريد، أم أن تقول ما لا تريد؟", "", { depth: "personal", decks: ["affection"] });
  q("in10", "scenario", "لو اختلف احتياج كل منا في فترة ما، كيف نتحدث عنه دون أن يشعر أحد بالرفض؟", "", { depth: "personal", decks: ["affection"] });
  q("in11", "scenario", "لو أراد أحدنا التوقف في لحظة ما، ما الشكل الذي يجعل ذلك سهلًا وآمنًا؟", "", { depth: "personal", decks: ["affection", "premarital-basics"] });
  q("in12", "scenario", "لو احتجنا إلى استشارة مختص مؤهل في هذا الجانب، متى ترى ذلك مناسبًا؟", "", { depth: "personal", decks: ["affection", "crisis"] });

  /* ===================== ١٧ الأطفال والإنجاب والتربية ===================== */
  group("children", "personal");
  q("ch01", "discovery", "ما أجمل ما تتذكره من طفولتك وتودّ أن يعيشه طفل؟", "", { decks: ["our-future", "light-start"] });
  q("ch02", "discovery", "ما الذي يخيفك في فكرة أن تصبح أبًا أو أمًا؟", "", { decks: ["our-future", "premarital-basics"] });
  q("ch03", "discovery", "ما الصفة التي تتمنى أن يراها الطفل فيك؟", "", { decks: ["our-future"] });
  q("ch04", "deep", "ما الذي تريد أن تكسره من طريقة تربيتك؟", "", { depth: "deep", sensitivity: "personal", decks: ["deep-talk", "our-future"] });
  q("ch05", "deep", "هل الأبوة أو الأمومة اختيار أم مرحلة طبيعية في نظرك؟", "وما الذي شكّل هذه النظرة عندك؟", { decks: ["deep-talk", "premarital-basics"] });
  q("ch06", "deep", "ما القيمة التي تريد أن ينشأ عليها الطفل قبل غيرها؟", "", { decks: ["deep-talk", "our-future"] });
  q("ch07", "decision", "أيهما أهم في التربية: الحدود الواضحة، أم مساحة التجربة؟", "", { decks: ["hard-decisions", "our-future"] });
  q("ch08", "decision", "أيهما تفضّل: الإنجاب مبكرًا مع ضيق مالي، أم التأجيل حتى الاستقرار؟", "", { decks: ["hard-decisions", "money-duties", "our-future"] });
  q("ch09", "decision", "لو اختلفنا أمام الطفل، هل نتفق أمامه ونناقش لاحقًا، أم نكون صريحين باختلافنا؟", "", { decks: ["hard-decisions", "our-future"] });
  q("ch10", "scenario", "لو تأخر الإنجاب عن المتوقع، ما الذي نحتاج إلى الاتفاق عليه مسبقًا؟", "", { depth: "sensitive", decks: ["our-future", "crisis"] });
  q("ch11", "scenario", "تخيّل طفلًا يختار مسارًا لا نرضاه. كيف نتصرف؟", "", { decks: ["our-future"] });
  q("ch12", "scenario", "لو تعارضت رعاية الطفل مع عمل أحدنا، كيف نقرر؟", "", { decks: ["hard-decisions", "our-future", "money-duties"] });

  /* ===================== ١٨ الصحة الجسدية والنفسية والرعاية ===================== */
  group("health", "personal");
  q("hl01", "discovery", "ما العادة الصحية التي تودّ أن تبنيها ولم تنجح بعد؟", "", { decks: ["light-start", "weekly"] });
  q("hl02", "discovery", "كيف تعرف أنك وصلت إلى حدك ويجب أن تتوقف؟", "", { decks: ["weekly", "crisis"] });
  q("hl03", "discovery", "ما الذي تحتاجه حين تمرض؟", "", { decks: ["crisis", "weekly"] });
  q("hl04", "deep", "ما الذي يجعل طلب المساعدة صعبًا عليك؟", "", { depth: "deep", sensitivity: "personal", decks: ["deep-talk", "crisis"] });
  q("hl05", "deep", "كيف تتعامل مع فترات الإرهاق النفسي؟", "لا داعي لتفاصيل لا ترغب في مشاركتها.", { depth: "sensitive", sensitivity: "personal", decks: ["deep-talk", "crisis"] });
  q("hl06", "deep", "ما معنى العناية بالنفس عندك: راحة، أم انضباط، أم كلاهما؟", "", { decks: ["deep-talk"] });
  q("hl07", "decision", "أيهما تفضّل عند التعب: أن تُترك وحدك، أم أن يبقى أحد قريبًا؟", "", { decks: ["crisis", "weekly", "premarital-basics"] });
  q("hl08", "decision", "أيهما أهم: الالتزام بعادة صحية صعبة، أم راحة نفسية أكبر؟", "");
  q("hl09", "decision", "متى ترى استشارة مختص خطوة مناسبة لا خطوة أخيرة؟", "", { decks: ["crisis", "premarital-basics"] });
  q("hl10", "scenario", "لو مرّ أحدنا بفترة صعبة نفسيًا، ما الذي يساعد وما الذي يزيد الأمر سوءًا؟", "", { depth: "sensitive", decks: ["crisis", "our-future"] });
  q("hl11", "scenario", "تخيّل مرضًا طويلًا يحتاج إلى رعاية. كيف نوزع الأدوار ونحمي أنفسنا؟", "", { decks: ["crisis", "our-future"] });
  q("hl12", "scenario", "لو لاحظ أحدنا تغيّرًا مقلقًا في الآخر، كيف يقولها بطريقة تصل؟", "", { decks: ["crisis", "weekly"] });

  /* ===================== ١٩ الترفيه والفضول والمغامرة ===================== */
  group("leisure");
  q("ls01", "discovery", "ما آخر شيء جرّبته لأول مرة؟", "", { decks: ["light-start", "weekly"] });
  q("ls02", "discovery", "ما الشيء الذي تحب أن تفعله وحدك ولا تريد مشاركته؟", "", { decks: ["light-start"] });
  q("ls03", "discovery", "ما نوع الإجازة التي تريحك فعلًا؟", "", { decks: ["light-start", "our-future"] });
  q("ls04", "deep", "ما الذي يثير فضولك ولا تعرف لماذا؟", "", { decks: ["deep-talk"] });
  q("ls05", "deep", "متى شعرت آخر مرة بدهشة حقيقية؟", "", { decks: ["deep-talk", "light-start"] });
  q("ls06", "deep", "ما الذي يمنعك من فعل ما تحب: الوقت، أم المال، أم شيء آخر؟", "", { decks: ["deep-talk"] });
  q("ls07", "decision", "أيهما تفضّل: خطة إجازة مرتبة، أم ترك الأمور تتشكل؟", "", { decks: ["our-future"] });
  q("ls08", "decision", "أيهما أهم في وقت الفراغ: أن نكون معًا، أم أن يرتاح كل منا بطريقته؟", "", { decks: ["weekly", "premarital-basics"] });
  q("ls09", "decision", "لو توفّر مبلغ إضافي، هل نصرفه على تجربة أم ندّخره؟", "", { decks: ["money-duties", "hard-decisions"] });
  q("ls10", "scenario", "لو كان أمامنا يوم كامل فارغ بلا التزامات، كيف نقضيه؟", "", { decks: ["weekly", "light-start"] });
  q("ls11", "scenario", "تخيّل أننا اتفقنا على تجربة جديدة كل شهر. ما أول ثلاث تجارب؟", "", { decks: ["our-future", "weekly"] });
  q("ls12", "scenario", "لو أراد أحدنا مغامرة يخاف منها الآخر، كيف نتصرف؟", "", { decks: ["hard-decisions"] });

  /* ===================== ٢٠ الأزمات والفقد والتغيّر والمستقبل ===================== */
  group("change", "personal");
  q("cg01", "discovery", "ما التغيير الذي خفت منه ثم كان في مصلحتك؟", "", { decks: ["crisis", "our-future"] });
  q("cg02", "discovery", "ما الشيء الذي يعيدك إلى توازنك بعد صدمة صغيرة؟", "", { decks: ["crisis", "weekly"] });
  q("cg03", "discovery", "من الشخص الذي تتصل به أولًا في الأزمة؟", "", { decks: ["crisis"] });
  q("cg04", "deep", "ما الفقد الذي غيّر ترتيب أولوياتك؟", "لا داعي للتفاصيل إن لم ترغب.", { depth: "sensitive", sensitivity: "personal", decks: ["crisis", "deep-talk"] });
  q("cg05", "deep", "كيف تعرف أنك تجاوزت شيئًا فعلًا لا أنك أجّلته؟", "", { depth: "deep", decks: ["deep-talk", "crisis"] });
  q("cg06", "deep", "ما الذي يجعلك تستمر حين لا تكون النتيجة مضمونة؟", "", { decks: ["deep-talk", "crisis"] });
  q("cg07", "decision", "في الأزمة، أيهما تفضّل: خطة سريعة، أم وقت للاستيعاب أولًا؟", "", { decks: ["crisis", "premarital-basics"] });
  q("cg08", "decision", "أيهما أصعب: تغيير كبير مفاجئ، أم انتظار طويل بلا وضوح؟", "", { decks: ["crisis"] });
  q("cg09", "decision", "لو اضطررنا لاختيار بين الاستقرار والفرصة، ما المعيار الذي نحتكم إليه؟", "", { decks: ["hard-decisions", "our-future"] });
  q("cg10", "scenario", "لو مررنا بسنة صعبة جدًا، ما الذي تتمنى أن نتذكره عنها لاحقًا؟", "", { decks: ["crisis", "our-future"] });
  q("cg11", "scenario", "تخيّلنا بعد عشر سنوات في يوم عادي. ما الذي تراه؟", "", { decks: ["our-future", "deep-talk"] });
  q("cg12", "scenario", "لو أردنا أن نراجع حياتنا مرة كل سنة، ما الأسئلة الثلاثة التي نسألها؟", "", { mode: "checkin", decks: ["our-future", "weekly"] });

  window.BAYNANA_CONVERSATION_QUESTIONS = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    questions: questions
  };
}());
