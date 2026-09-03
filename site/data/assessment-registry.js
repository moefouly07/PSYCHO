/* Normalized catalog metadata for the shared assessment engine. */
(function () {
  "use strict";

  var config = window.BAYNANA_CONFIG;
  var sources = window.BAYNANA_SOURCES;
  var legacyData = window.APP_DATA;

  if (!config || !sources || !legacyData || !Array.isArray(legacyData.TESTS)) {
    throw new Error("Baynana data files must load before assessment-registry.js.");
  }

  var safetyMessages = {
    jealousy: "قد تشير إجاباتك إلى مراقبة أو سيطرة تتجاوز الشعور بالغيرة نفسه. لا تُستخدم الخصوصية أو كلمات المرور أو التهديد وسيلةً للطمأنة. إذا وُجد خوف أو إكراه، اطلب دعمًا خاصًا وآمنًا.",
    anger: "الغضب شعور إنساني، أما التهديد أو الإيذاء أو التكسير أو التخويف فسلوك يحتاج إلى توقف وخطة أمان ودعم مهني. لا تبدأ نقاشًا مشتركًا في ذروة الخطر.",
    narcissism: "هذه النتيجة لا تثبت النرجسية ولا تشخّص اضطراب شخصية. لكنها قد تلفت إلى تحكم أو استغلال أو ضعف في تحمل المسؤولية؛ عند وجود خوف أو إكراه تكون الأولوية للأمان لا لمناقشة الملصق.",
    cruelty: "قد تشير إجاباتك المبلّغ عنها ذاتيًا إلى إذلال أو إكراه أو لامبالاة بضيق الآخر. لا تُعامل هذه السلوكيات كلعبة توافق، ولا تبدأ مواجهة مباشرة إذا كان ذلك قد يزيد الخطر.",
    mahdi: "لا يثبت هذا التقييم ادعاءً دينيًا ولا ينفيه. إذا ارتبط الادعاء بخوف شديد أو عزلة أو استغلال مالي أو سلوك غير آمن أو تعطيل كبير للحياة، فاطلب مراجعة مستقلة من عالم ديني مؤهل وموثوق ومن مختص صحة نفسية مرخّص."
  };

  var pairCopyByTest = {
    "self-compassion": {
      self_kindness: {
        gap: "أحدكما يميل إلى تهدئة نفسه بلطف بعد الخطأ، بينما يحتاج الآخر وقتًا أطول قبل أن يخفف قسوته على نفسه. اسألا ما العبارة التي تساعد فعلًا، ولا تفترضا أن التشجيع نفسه يناسبكما.",
        bothLow: "كلاكما قد يضيف لوم الذات إلى ألم الموقف. اتفقا على إيقاف العبارات الجارحة للنفس، ثم وصف الخطأ كسلوك يمكن إصلاحه لا كتعريف للشخص.",
        bothHigh: "لديكما قدرة جيدة على مخاطبة النفس برفق. استخدماها كي يصبح الاعتذار والتعلّم أسهل، لا لتجاوز أثر الخطأ بسرعة."
      },
      self_judgment: {
        gap: "أحدكما يفصل بين الخطأ وقيمته كشخص أكثر من الآخر. عندما يبدأ الحكم القاسي، ساعدا بعضكما بسؤال محدد: ما الفعل الذي يحتاج إصلاحًا فعلًا؟",
        bothLow: "يميل كلاكما إلى إصدار أحكام قاسية على نفسه، وقد يتحول الخلاف إلى دفاع عن القيمة الشخصية. التزما بمناقشة فعل واحد من دون أوصاف شاملة.",
        bothHigh: "يستطيع كلاكما مراجعة أخطائه دون جلد للذات. حافظا على هذا التوازن مع تحمل الأثر كاملًا وعدم استخدام الهدوء لتصغير ما حدث."
      },
      common_humanity: {
        gap: "أحدكما يتذكر بسهولة أن التعثر تجربة بشرية مشتركة، بينما قد يشعر الآخر بأنه وحده من يفشل. شاركا مثالًا واقعيًا من غير مقارنة أو تقليل.",
        bothLow: "قد يرى كل منكما صعوبته كدليل على أنه مختلف أو أقل من الآخرين. جربا تسمية التجربة المشتركة: نحن نتعلم هذا، ولسنا مطالبين بإتقانه من أول مرة.",
        bothHigh: "كلاكما يضع النقص داخل الخبرة الإنسانية المشتركة. هذه قوة عندما تمنح مساحة للتعلّم، بشرط ألا تتحول إلى تبرير لتكرار السلوك نفسه."
      },
      isolation: {
        gap: "أحدكما يبقى متصلًا بالآخر وقت الخجل أو الفشل، بينما ينسحب الآخر ويحمل الأمر وحده. اتفقا على إشارة تعني: أحتاج مساحة، لكنني لا أقطع الصلة.",
        bothLow: "يميل كلاكما إلى الانغلاق عندما يشتد النقد الداخلي، فيصعب أن يعرف كل شخص ما يحتاجه الآخر. حددا موعد عودة قصيرًا بدل الاختفاء المفتوح.",
        bothHigh: "تستطيعان الحفاظ على الشعور بالاتصال في الأوقات الصعبة. وازنا ذلك مع احترام المساحة؛ القرب الداعم ليس مطالبة بالكلام فورًا."
      },
      mindful_awareness: {
        gap: "أحدكما يلاحظ ألمه دون أن يبتلعه، بينما قد ينكره الآخر أو يغرق فيه. استخدما وصفًا بسيطًا للحالة قبل تقديم الحلول أو الطمأنة.",
        bothLow: "قد تجرف المشاعر كليكما أو تُدفع بعيدًا حتى تعود أقوى. خذا دقيقة لتسمية الشعور ودرجته وما يحتاجه الآن، من دون تحليل تاريخ العلاقة كله.",
        bothHigh: "لديكما قدرة على إبقاء الشعور حاضرًا بحجمه الواقعي. استفيدا منها لاختيار توقيت الحوار، لا لتحويل كل لحظة إلى تمرين تحليلي."
      },
      over_identification: {
        gap: "أحدكما يفصل بين اللحظة الصعبة وصورته الكاملة عن نفسه، بينما قد يرى الآخر الموقف كدليل شامل عليه. ذكّرا بعضكما بعبارة: هذا ما حدث الآن، وليس كل ما أنا عليه.",
        bothLow: "قد يتحول موقف صغير عند كليكما إلى قصة كاملة عن الفشل أو الرفض. اكتبا حقيقة واحدة عن الحدث وخطوة واحدة قابلة للإصلاح قبل استخلاص معنى أوسع.",
        bothHigh: "يستطيع كلاكما الحفاظ على منظور أوسع عند التعثر. لا تتعجلا استخدام المنظور لتهدئة الآخر؛ استمعا إلى الألم أولًا ثم وسّعا الصورة."
      }
    },
    resilience: {
      recovery: {
        gap: "سرعة عودتكما بعد الضغط مختلفة. لا تفسرا البطء كضعف ولا السرعة كقلة اهتمام؛ اتفقا على ما يحتاجه كل منكما قبل استئناف الحديث.",
        bothLow: "يحتاج كلاكما وقتًا طويلًا لاستعادة التوازن بعد الانتكاسات. جهزا خطة تعافٍ بسيطة تشمل الراحة وتأجيل القرارات وموعدًا واضحًا للمراجعة.",
        bothHigh: "تستعيدان توازنكما غالبًا بعد الصعوبات. احذرا أن تجعل هذه القدرة الحمل الزائد يبدو طبيعيًا أو أن تؤجل طلب المساندة."
      },
      adaptability: {
        gap: "أحدكما يغيّر خطته بسهولة أكبر، بينما يحتاج الآخر ثباتًا ومعلومات قبل التكيف. عند التغيير المفاجئ، حددا ما بقي ثابتًا وما أصبح قابلًا للتعديل.",
        bothLow: "يستنزف التغيير غير المتوقع كليكما وقد يضعكما في مواجهة بدل التعاون. ضعا خطة أساسية وبديلًا واحدًا مسبقًا للمواقف المتكررة.",
        bothHigh: "كلاكما مرن أمام تغير الظروف. حافظا على وضوح الاتفاقات حتى لا تتحول المرونة إلى قرارات تتبدل من دون إبلاغ الطرف الآخر."
      },
      persistence: {
        gap: "أحدكما يواصل المحاولة مدة أطول، بينما يتعب الآخر أو يعيد تقييم الجدوى أبكر. قسّما المهمة وحددا نقطة مراجعة بدل وصف أحدكما بالعناد أو الاستسلام.",
        bothLow: "قد تتوقفان عندما تبدو المهمة كبيرة أو بطيئة النتائج. اختارا خطوة مشتركة لا تتجاوز عشر دقائق، ثم قررا الخطوة التالية بعد إنجازها.",
        bothHigh: "لديكما مثابرة واضحة في المشروعات المشتركة. راقبا الفرق بين الإصرار المفيد والاستمرار في خطة لم تعد آمنة أو واقعية."
      },
      emotion_regulation: {
        gap: "أحدكما يحافظ على قدر أكبر من التنظيم وقت الضغط. يمكنه المساعدة في إبطاء الإيقاع، لكنه ليس مسؤولًا عن تنظيم مشاعر الطرف الآخر بدلًا منه.",
        bothLow: "عندما يزداد الضغط، يصعب على كليكما البقاء في حوار منتج. اتفقا مسبقًا على استراحة محددة ووسيلة تهدئة ووقت عودة.",
        bothHigh: "تستطيعان غالبًا تنظيم الانفعال تحت الضغط. اختبرا هذه المهارة في الموضوعات الحساسة أيضًا، ولا تخلطا الهدوء بكتمان الاحتياج."
      },
      realistic_optimism: {
        gap: "أحدكما يرى إمكان التحسن أسرع، والآخر يلتقط المخاطر مبكرًا. اجمعا القوتين بسؤالين: ما الذي يدعم الأمل؟ وما الذي يحتاج خطة احتياط؟",
        bothLow: "قد يبدو المستقبل مسدودًا لكليكما عند التعثر. اكتبا ثلاث حقائق مؤكدة وخطوة قريبة واحدة بدل بناء القرار على أسوأ احتمال.",
        bothHigh: "لديكما تفاؤل يستند عادةً إلى الواقع. حافظا عليه مع فحص التكلفة والمخاطر؛ الأمل الجيد لا يلغي المعلومات المزعجة."
      },
      support_seeking: {
        gap: "أحدكما يطلب الدعم بسهولة، بينما يميل الآخر إلى حمل العبء وحده. اجعلا الدعوة محددة وغير ضاغطة: هل تريد استماعًا أم مساعدة عملية أم مساحة؟",
        bothLow: "قد تحاولان تجاوز الصعوبات وحدكما حتى يزداد الإرهاق. اكتبا اسم شخص موثوق ومورد مهني يمكن الرجوع إليهما قبل الأزمة لا خلالها فقط.",
        bothHigh: "تعرفان كيف تطلبان المساندة وتستخدمانها. احتفظا أيضًا بشبكة خارج العلاقة حتى لا يصبح كل العبء العاطفي على شخص واحد."
      }
    },
    "relationship-readiness": {
      emotional_availability: {
        gap: "أحدكما أكثر استعدادًا للحضور العاطفي الآن، بينما يحتاج الآخر وقتًا أو أمانًا أكبر. ناقشا القدرة الحالية بصدق بدل الضغط على سرعة متساوية.",
        bothLow: "قد تتجاوران دون تواصل عاطفي كافٍ عندما يزداد الضغط. اختارا موعدًا قصيرًا ومنتظمًا للحضور المتبادل من دون هواتف أو حل فوري للمشكلات.",
        bothHigh: "كلاكما متاح عاطفيًا في معظم الأوقات. تذكرا أن الحضور لا يعني الوصول غير المحدود؛ يظل من حق كل شخص طلب راحة أو مساحة."
      },
      self_awareness: {
        gap: "أحدكما يرى أنماطه واحتياجاته بسرعة أكبر، بينما يفهمها الآخر بعد الموقف. اسألا عن النمط المتكرر دون تحويل الأكثر وعيًا إلى محلل للطرف الثاني.",
        bothLow: "قد يتركز انتباهكما على الحدث أو خطأ الآخر، فتضيع مساهمة كل شخص في النمط. ليذكر كل منكما سلوكًا واحدًا يستطيع تغييره بنفسه.",
        bothHigh: "تستطيعان تسمية أنماطكما بوضوح. اجعلا الوعي يقود إلى سلوك صغير قابل للملاحظة، لا إلى تحليل طويل بلا تغيير."
      },
      boundaries: {
        gap: "أحدكما يصرّح بحدوده أسرع، بينما يرسل الآخر إشارات غير مباشرة أو يوافق ثم يتضايق. اكتبا اتفاقًا محددًا يمكن لكليكما قبوله أو رفضه بحرية.",
        bothLow: "قد تعتمد الحدود عند كليكما على التخمين ثم يظهر الاستياء متأخرًا. تدربا على جملتين: لا أستطيع هذا، وأستطيع بدلًا منه كذا.",
        bothHigh: "لديكما وضوح جيد في الحدود واحترام الرفض. راجعا الاتفاقات عند تغير الظروف؛ الحد الصحي واضح وقابل للنقاش وليس أداة عقاب."
      },
      emotional_independence: {
        gap: "أحدكما يحافظ على توازنه وهويته خارج العلاقة أكثر من الآخر. ناقشا الاحتياج إلى القرب دون جعل الاستقلال برودًا أو الاعتماد عيبًا.",
        bothLow: "قد يرتبط مزاج كل منكما وقيمته باستجابة الآخر بصورة مرهقة. حافظا على نشاط وعلاقة داعمة وقرار شخصي لكل منكما خارج مساحة الزوجين.",
        bothHigh: "لديكما استقلال عاطفي جيد. تأكدا أنه يترك مكانًا للاعتماد المتبادل وطلب المساندة، لا أن يتحول إلى حياة متوازية."
      },
      communication_repair: {
        gap: "أحدكما يعود إلى الحوار ويصلح سوء الفهم أسرع، بينما يحتاج الآخر وقتًا أطول. اتفقا على موعد عودة واقعي بدل المطاردة أو الصمت المفتوح.",
        bothLow: "قد تنتهي خلافاتكما بتوقف الكلام لا بإصلاح الأثر. ابدآ بمراجعة قصيرة: ماذا حدث، ما الأثر، وما الخطوة المختلفة في المرة المقبلة؟",
        bothHigh: "تملكان موارد جيدة للحوار والإصلاح. حافظا على الاعتذار المحدد وتغيير السلوك؛ استعادة الهدوء وحدها ليست إصلاحًا كاملًا."
      },
      realistic_expectations: {
        gap: "توقعات أحدكما عن العلاقة أكثر واقعية أو مرونة من الآخر. قارنا ما تتوقعانه من الوقت والقرب والخلاف والالتزام بدل انتظار أن تكشفه الأزمات.",
        bothLow: "قد تحملان صورًا مثالية أو افتراضات غير معلنة عن العلاقة. اختارا توقعًا واحدًا واختبرا هل هو ممكن ومتبادل وقابل للتفاوض.",
        bothHigh: "لديكما توقعات واقعية عن القرب والجهد والخلاف. لا تجعلا الواقعية تقلل الطموح؛ حددا ما تريدان بناءه وكيف ستراجعان التقدم."
      }
    },
    "anger-management": {
      trigger_awareness: {
        gap: "أحدكما يلتقط ما يثير غضبه مبكرًا، بينما لا يعرف الآخر إلا بعد التصعيد. شاركا المثيرات كخريطة للوقاية لا كقائمة اتهامات.",
        bothLow: "قد يفاجئكما الغضب كأنه بدأ من الصفر. سجلا الموقف والتفسير والاحتياج بعد كل مرة، وابحثا عن النمط المتكرر في وقت هادئ.",
        bothHigh: "تعرفان مثيراتكما غالبًا. استخدما هذه المعرفة لطلب استراحة أو توضيح مبكر، لا لإثبات أن الطرف الآخر مسؤول عن غضبكما."
      },
      physical_signs: {
        gap: "أحدكما يقرأ إشارات جسده قبل ارتفاع الغضب أكثر من الآخر. قارنا أول علامتين لديكما واتفقا أن ذكرهما سبب كافٍ لإبطاء الحوار.",
        bothLow: "لا تلتقطان إنذار الجسد إلا بعد اشتداد الانفعال. راقبا الفك والتنفس والحرارة واليدين في الخلاف التالي قبل التركيز في الكلمات.",
        bothHigh: "تلاحظان العلامات الجسدية مبكرًا. حوّلا الملاحظة إلى فعل متفق عليه، مثل خفض الصوت أو شرب الماء أو استراحة محددة."
      },
      impulse_control: {
        gap: "أحدكما يستطيع تأجيل الرد والقرار وقت الغضب أكثر من الآخر. اتفقا أن الشخص الأهدأ يحمي الإيقاع، لكنه لا يتحمل مسؤولية منع تصرف مؤذٍ من الطرف الثاني.",
        bothLow: "يحتاج ضبط الاندفاع إلى أولوية قبل أي نقاش مشترك. لا رسائل ولا قرارات ولا قيادة متهورة في الذروة؛ ابتعدا بأمان واطلبا دعمًا مهنيًا إذا ظهر تهديد أو أذى.",
        bothHigh: "كلاكما يستطيع إيقاف الاندفاع في الغالب. لا يعني ذلك غياب الغضب؛ قولا الاعتراض بوضوح بعد الهدوء بدل دفنه."
      },
      assertive_expression: {
        gap: "أحدكما يقول اعتراضه بوضوح أكبر، بينما قد يكتم الآخر أو يلوم أو يلمّح. استخدما صيغة تصف الفعل والأثر والطلب من دون إهانة.",
        bothLow: "قد يتحول غضبكما إلى كبت أو حدة بدل طلب مفهوم. ليقل كل منكما جملة واحدة تبدأ بما حدث وتنتهي بما يحتاجه الآن.",
        bothHigh: "تستطيعان التعبير عن الغضب دون إهانة في أغلب المواقف. حافظا على الإصغاء أيضًا؛ الوضوح ليس تناوبًا على إلقاء المرافعات."
      },
      de_escalation: {
        gap: "أحدكما يخفض التصعيد بسهولة أكبر. اجعلا طلب الاستراحة حقًا متبادلًا مع وقت عودة، ولا تطلبا من الأهدأ البقاء في موقف مخيف.",
        bothLow: "يتغذى تصعيد كل منكما من الآخر بسرعة. أوقفا الحوار عند العلامة الأولى المتفق عليها، وتفرقا بأمان حتى يعود التنفس والصوت إلى مستوى هادئ.",
        bothHigh: "تجيدان تهدئة الإيقاع غالبًا. تأكدا أن التهدئة لا تنهي الموضوع بلا مراجعة، وأن الاستراحة لها عودة واضحة."
      },
      repair_accountability: {
        gap: "أحدكما يعود للاعتذار وتحمل الأثر أسرع، بينما يميل الآخر إلى التبرير أو الانتظار. افصلا الاعتذار عن سؤال من بدأ الخلاف.",
        bothLow: "قد يهدأ الغضب عندكما من دون إصلاح ما قيل أو فُعل. يحتاج كل شخص إلى تسمية فعله وأثره والتغيير المحدد الذي سيتحمله بنفسه.",
        bothHigh: "تستطيعان تحمل المسؤولية والإصلاح بعد الغضب. راقبا التكرار؛ الاعتذار الصادق يكتمل بخطوة تمنع النمط نفسه من العودة."
      }
    }
  };

  function safetyConfig(message, rules) {
    return {
      enabled: true,
      private: true,
      suppressPlayfulComparison: true,
      discourageImmediateJointConfrontation: true,
      message: message,
      rules: rules
    };
  }

  var definitions = [
    {
      id: "emotional-clarity",
      category: "self",
      featured: true,
      featuredRank: 1,
      tone: "lilac",
      card: { size: "wide", kicker: "وعي عاطفي", art: "emotion-window" },
      scoreMode: "skill",
      overallLabel: "مؤشر وضوح المشاعر"
    },
    {
      id: "attachment-style",
      category: "attachment",
      featured: true,
      featuredRank: 2,
      tone: "cream",
      card: { size: "tall", kicker: "قرب وطمأنينة", art: "shared-bench" },
      scoreMode: "attachment",
      overallLabel: "مؤشر الأمان العاطفي المشتق"
    },
    {
      id: "conflict-style",
      category: "communication",
      featured: true,
      featuredRank: 3,
      tone: "blush",
      card: { size: "standard", kicker: "خلاف وإصلاح", art: "conversation-chairs" },
      scoreMode: "skill",
      overallLabel: "مؤشر مهارات إدارة الخلاف"
    },
    {
      id: "emotional-communication",
      category: "communication",
      featured: true,
      featuredRank: 4,
      tone: "lavender",
      card: { size: "standard", kicker: "استماع وتعبير", art: "speech-bridge" },
      scoreMode: "skill",
      overallLabel: "مؤشر مهارات التواصل العاطفي"
    },
    {
      id: "partner-compatibility",
      category: "needs",
      featured: true,
      featuredRank: 5,
      tone: "peach",
      card: { size: "wide", kicker: "قيم وتفضيلات", art: "two-paths" },
      scoreMode: "profile",
      overallLabel: "ملف تفضيلات العلاقة"
    },
    {
      id: "emotional-needs",
      category: "needs",
      featured: true,
      featuredRank: 6,
      tone: "sage",
      card: { size: "standard", kicker: "احتياج ومساحة", art: "care-hands" },
      scoreMode: "profile",
      overallLabel: "ملف الاحتياجات العاطفية"
    },
    {
      id: "romantic-jealousy",
      category: "traits",
      featured: false,
      tone: "peach",
      card: { size: "standard", kicker: "ثقة وحدود", art: "open-door" },
      scoreMode: "skill",
      overallLabel: "مؤشر إدارة الغيرة",
      safety: safetyConfig(safetyMessages.jealousy, [
        {
          dimension: "checking_behavior",
          metric: "reported",
          operator: ">=",
          threshold: 50,
          severity: "high",
          signal: "surveillance-control",
          reason: "تكرار التفتيش أو المراقبة أو المطالبة بالوصول إلى الخصوصية يستدعي رسالة أمان خاصة."
        }
      ])
    },
    {
      id: "empathy",
      category: "self",
      featured: false,
      tone: "lilac",
      card: { size: "standard", kicker: "فهم دون ذوبان", art: "listening-figures" },
      scoreMode: "skill",
      overallLabel: "مؤشر التعاطف المتوازن"
    },
    {
      id: "self-compassion",
      category: "self",
      featured: false,
      tone: "blush",
      card: { size: "standard", kicker: "لطف داخلي", art: "self-care" },
      scoreMode: "skill",
      overallLabel: "مؤشر التعاطف مع الذات"
    },
    {
      id: "resilience",
      category: "self",
      featured: false,
      tone: "sage",
      card: { size: "standard", kicker: "تعافٍ وتكيّف", art: "growing-plant" },
      scoreMode: "skill",
      overallLabel: "مؤشر موارد المرونة النفسية"
    },
    {
      id: "relationship-readiness",
      category: "needs",
      featured: false,
      tone: "cream",
      card: { size: "standard", kicker: "حدود والتزام", art: "shared-plan" },
      scoreMode: "skill",
      overallLabel: "مؤشر موارد العلاقة الصحية"
    },
    {
      id: "anger-management",
      category: "communication",
      featured: false,
      tone: "peach",
      card: { size: "standard", kicker: "تهدئة ومسؤولية", art: "calm-pause" },
      scoreMode: "skill",
      overallLabel: "مؤشر مهارات إدارة الغضب",
      safety: safetyConfig(safetyMessages.anger, [
        {
          dimension: "impulse_control",
          metric: "supportive",
          operator: "<=",
          threshold: 33,
          severity: "high",
          signal: "loss-of-control",
          reason: "انخفاض ضبط الاندفاع قد يصاحب تهديدًا أو إيذاءً أو تصرفات لا يمكن التراجع عنها."
        },
        {
          dimension: "de_escalation",
          metric: "supportive",
          operator: "<=",
          threshold: 33,
          severity: "medium",
          signal: "escalation",
          reason: "صعوبة إيقاف التصعيد تستدعي إرشادًا خاصًا قبل أي حوار مشترك."
        }
      ])
    },
    {
      id: "narcissistic-traits",
      category: "traits",
      featured: false,
      tone: "sage",
      card: { size: "standard", kicker: "مراجعة ذاتية", art: "balanced-mirror" },
      scoreMode: "risk",
      overallLabel: "مؤشر السمات النرجسية المبلّغ عنها ذاتيًا",
      safety: safetyConfig(safetyMessages.narcissism, [
        {
          dimension: "exploitation_control",
          metric: "reported",
          operator: ">=",
          threshold: 50,
          severity: "high",
          signal: "exploitation-control",
          reason: "مؤشرات الاستغلال أو التحكم تتطلب تقديم السلامة على لغة التوافق أو النقاش المشترك."
        },
        {
          dimension: "reciprocity_accountability",
          metric: "reported",
          operator: ">=",
          threshold: 67,
          severity: "medium",
          signal: "accountability-gap",
          reason: "الارتفاع في صعوبة التبادلية وتحمل المسؤولية يدعم رسالة خاصة غير تشخيصية."
        }
      ])
    },
    {
      id: "cruelty-sadism-indicators",
      category: "traits",
      featured: false,
      tone: "sage",
      card: { size: "wide", kicker: "أمان واحترام", art: "boundary-shield" },
      scoreMode: "risk",
      overallLabel: "مؤشر القسوة والسلوكيات السادية المبلّغ عنها ذاتيًا",
      safety: safetyConfig(safetyMessages.cruelty, [
        {
          dimension: "dominance_humiliation",
          metric: "reported",
          operator: ">=",
          threshold: 50,
          severity: "high",
          signal: "humiliation",
          reason: "الاستمتاع بالهيمنة أو الإذلال يستدعي حجب اللغة المرحة وإظهار رسالة أمان."
        },
        {
          dimension: "distress_indifference",
          metric: "reported",
          operator: ">=",
          threshold: 50,
          severity: "high",
          signal: "distress-indifference",
          reason: "اللامبالاة المتكررة بضيق الآخر مؤشر أمان مهم حتى دون استنتاج تشخيصي."
        },
        {
          dimension: "coercive_punishment",
          metric: "reported",
          operator: ">=",
          threshold: 33,
          severity: "high",
          signal: "coercion-punishment",
          reason: "أي نمط متكرر من العقاب القسري أو التخويف أو التحكم يحتاج إلى توجيه خاص للأمان."
        },
        {
          dimension: "consent_boundaries",
          metric: "reported",
          operator: ">=",
          threshold: 33,
          severity: "high",
          signal: "consent-boundary-violation",
          reason: "عدم احترام الموافقة والحدود لا يُعامل كاختلاف عادي بين الشريكين."
        }
      ])
    },
    {
      id: "anxious-attachment",
      category: "attachment",
      featured: false,
      tone: "lavender",
      card: { size: "standard", kicker: "طمأنة وحدود", art: "steady-thread" },
      scoreMode: "attachment",
      overallLabel: "مؤشر تنشيط التعلق القلق المبلّغ عنه ذاتيًا"
    },
    {
      id: "avoidant-attachment",
      category: "attachment",
      featured: false,
      tone: "cream",
      card: { size: "standard", kicker: "قرب واستقلال", art: "returning-path" },
      scoreMode: "attachment",
      overallLabel: "مؤشر الابتعاد التجنبي المبلّغ عنه ذاتيًا"
    },
    {
      id: "mahdi-claim-critical-thinking",
      category: "beliefs",
      featured: false,
      tone: "sage",
      card: { size: "wide", kicker: "دليل وأثر", art: "evidence-lantern" },
      scoreMode: "critical-thinking",
      overallLabel: "مؤشر فحص الادعاءات بأمان",
      safety: safetyConfig(safetyMessages.mahdi, [
        {
          dimension: "manipulation_exploitation",
          metric: "reported",
          operator: ">=",
          threshold: 33,
          severity: "high",
          signal: "manipulation-exploitation",
          reason: "الإكراه أو العزل أو طلب المال أو الطاعة باسم الادعاء يستدعي رسالة أمان واستشارة مستقلة."
        },
        {
          dimension: "daily_functioning",
          metric: "reported",
          operator: ">=",
          threshold: 50,
          severity: "high",
          signal: "functional-disruption",
          reason: "التعطيل الواضح للنوم أو العمل أو المال أو العلاقة يستدعي مراجعة دينية ومهنية محايدة."
        }
      ])
    },
    {
      id: "partner-responsiveness",
      category: "needs",
      featured: false,
      tone: "sage",
      card: { size: "standard", kicker: "استجابة ودعم", art: "care-hands" },
      scoreMode: "skill",
      overallLabel: "مؤشر مهارات الاستجابة والدعم"
    },
    {
      id: "shared-decision-making",
      category: "communication",
      featured: false,
      tone: "lavender",
      card: { size: "standard", kicker: "قرار مشترك", art: "two-paths" },
      scoreMode: "skill",
      overallLabel: "مؤشر مهارات القرار المشترك"
    },
    {
      id: "trust-autonomy-boundaries",
      category: "traits",
      featured: false,
      tone: "cream",
      card: { size: "standard", kicker: "ثقة واستقلال", art: "open-door" },
      scoreMode: "skill",
      overallLabel: "مؤشر مهارات الحدود والثقة",
      safety: safetyConfig(
        "الإلحاح المتكرر والصمت العقابي والتلويح بالعواقب وسائل ضغط لا وسائل حوار. إذا وُجد خوف أو إكراه، فالأولوية للسلامة: تواصل على انفراد مع شخص تثق به ومع مختص محلي مؤهل، ولا تبدأ مواجهة تخشى رد الفعل عليها.",
        [
          {
            dimension: "boundary_pressure",
            metric: "raw",
            operator: ">=",
            threshold: 50,
            severity: "high",
            signal: "boundary-pressure",
            reason: "الضغط المتكرر لتجاوز حدّ رُفض صراحةً إشارة سلامة مستقلة عن سبب الطلب."
          }
        ]
      )
    }
  ];

  var testsById = Object.create(null);
  legacyData.TESTS.forEach(function (test) {
    if (testsById[test.id]) {
      throw new Error("Duplicate assessment id: " + test.id);
    }
    testsById[test.id] = test;
  });

  var missing = definitions.filter(function (definition) {
    return !testsById[definition.id];
  }).map(function (definition) {
    return definition.id;
  });

  if (missing.length) {
    throw new Error("Missing assessment definitions: " + missing.join(", "));
  }

  var tests = definitions.map(function (definition) {
    var test = testsById[definition.id];
    test.category = definition.category;
    test.partner = true;
    test.workflow = "paired";
    test.featured = definition.featured;
    test.featuredRank = definition.featuredRank || null;
    test.tone = definition.tone;
    test.card = definition.card;
    test.scoreMode = definition.scoreMode;
    test.overallLabel = definition.overallLabel;
    test.safety = definition.safety || null;
    test.sourceId = definition.id;
    var pairCopy = pairCopyByTest[test.id];
    if (pairCopy) {
      test.dimensions.forEach(function (dimension) {
        if (!dimension.pair && pairCopy[dimension.id]) {
          dimension.pair = pairCopy[dimension.id];
        }
      });
    }
    return test;
  });

  var categories = config.categories.map(function (category) {
    var count = tests.filter(function (test) {
      return test.category === category.id;
    }).length;
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      count: count
    };
  });

  legacyData.TESTS = tests;
  legacyData.CATEGORIES = categories;
  legacyData.GLOBAL_DISCLAIMER = config.disclaimers.global;

  window.BAYNANA_DATA = {
    tests: tests,
    categories: categories,
    config: config,
    sources: sources
  };
}());
