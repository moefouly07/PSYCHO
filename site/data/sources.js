/* Verified foundations used to inform original, non-diagnostic item writing. */
(function () {
  "use strict";

  var referencePool = {
    "apa-assessment-guidelines": {
      id: "apa-assessment-guidelines",
      displayTitle: "إرشادات جمعية علم النفس الأمريكية للتقييم النفسي",
      authors: "جمعية علم النفس الأمريكية",
      kind: "professional-guideline",
      kindLabel: "إرشاد مهني",
      url: "https://www.apa.org/about/policy/guidelines-psychological-assessment-evaluation.pdf",
      description: "مرجع مهني لحدود التقييم، وكفاية الأدلة، والتفسير المسؤول، ومراعاة السياق."
    },
    "testing-standards-2014": {
      id: "testing-standards-2014",
      displayTitle: "معايير الاختبارات التربوية والنفسية، إصدار 2014",
      authors: "جمعية البحوث التربوية الأمريكية، وجمعية علم النفس الأمريكية، والمجلس الوطني للقياس في التعليم",
      year: 2014,
      kind: "professional-standard",
      kindLabel: "معيار مهني",
      url: "https://www.testingstandards.net/open-access-files.html",
      description: "معايير مهنية لبناء الاختبارات واستخدام الدرجات والصدق والإنصاف والتواصل حول القيود."
    },
    "salovey-1995-tmms": {
      id: "salovey-1995-tmms",
      displayTitle: "الانتباه للمشاعر ووضوحها وتنظيمها: استكشاف الذكاء العاطفي بمقياس الحالة المزاجية الواعية",
      authors: "سالوفي، وماير، وغولدمان، وتيرفي، وبالفاي",
      year: 1995,
      kind: "foundational-research",
      kindLabel: "مرجع بحثي تأسيسي",
      url: "https://doi.org/10.1037/10182-006",
      description: "يعرض التمييز المفاهيمي بين الانتباه للحالة العاطفية ووضوحها والقدرة على تنظيمها."
    },
    "lane-1990-leas": {
      id: "lane-1990-leas",
      displayTitle: "مقياس مستويات الوعي العاطفي: قياس معرفي نمائي للمشاعر",
      authors: "لين، وكوينلان، وشوارتز، وووكر، وزيتلين",
      year: 1990,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1080/00223891.1990.9674052",
      description: "دراسة أصلية عن تدرج القدرة على التعرف إلى الخبرة العاطفية ووصفها وتمييزها."
    },
    "fraley-2000-ecrr": {
      id: "fraley-2000-ecrr",
      displayTitle: "تحليل بنظرية الاستجابة للبند لمقاييس التقرير الذاتي عن تعلق البالغين",
      authors: "فريلي، ووالر، وبرينان",
      year: 2000,
      kind: "validation-study",
      kindLabel: "دراسة قياس أصلية",
      url: "https://doi.org/10.1037/0022-3514.78.2.350",
      description: "الدراسة الأصلية لمقياس الخبرات في العلاقات الوثيقة المنقح، وتدعم النظر إلى القلق والتجنب كبعدين مستمرين."
    },
    "fraley-ecrr-university": {
      id: "fraley-ecrr-university",
      displayTitle: "معلومات جامعة إلينوي عن استبيان الخبرات في العلاقات الوثيقة المنقح",
      authors: "مختبر آر. كريس فريلي، جامعة إلينوي",
      kind: "official-university-resource",
      kindLabel: "مصدر جامعي رسمي",
      url: "https://labs.psychology.illinois.edu/~rcfraley/measures/ecrr.htm",
      description: "شرح رسمي للبعدين وطريقة التصحيح وحدود تحويل الدرجات المستمرة إلى أنماط ثابتة."
    },
    "fraley-2011-ecrrs": {
      id: "fraley-2011-ecrrs",
      displayTitle: "استبيان الخبرات في العلاقات الوثيقة ـ بنية العلاقات: قياس توجهات التعلق عبر العلاقات",
      authors: "فريلي، وهيفرنان، وفيكاري، وبرومبو",
      year: 2011,
      kind: "validation-study",
      kindLabel: "دراسة قياس أصلية",
      url: "https://doi.org/10.1037/a0022898",
      description: "يوضح أن توجهات التعلق قد تختلف باختلاف العلاقة، وهو ما يدعم تجنب وصفها كهوية دائمة."
    },
    "fraley-ecrrs-university": {
      id: "fraley-ecrrs-university",
      displayTitle: "معلومات جامعة إلينوي عن استبيان بنية العلاقات",
      authors: "مختبر آر. كريس فريلي، جامعة إلينوي",
      kind: "official-university-resource",
      kindLabel: "مصدر جامعي رسمي",
      url: "https://labs.psychology.illinois.edu/~rcfraley/measures/relstructures.htm",
      description: "شرح رسمي لقياس القلق والتجنب بالنسبة إلى علاقة محددة، مع معلومات التصحيح والتحديثات والاستخدام السياقي."
    },
    "kurdek-1994-conflict": {
      id: "kurdek-1994-conflict",
      displayTitle: "أساليب حل الخلاف لدى أنواع متعددة من الأزواج",
      authors: "كورديك",
      year: 1994,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      url: "https://doi.org/10.2307/352880",
      description: "بحث في أساليب حل الخلاف، بما فيها الحل الإيجابي والانسحاب والامتثال والانخراط التصادمي."
    },
    "christensen-2017-cpq": {
      id: "christensen-2017-cpq",
      displayTitle: "تصحيح منقح وثبات محسّن لاستبيان أنماط التواصل",
      authors: "كرينشو، وكريستنسن، ودونالد بوكوم، وإبستين، وبرايان بوكوم",
      year: 2017,
      kind: "measurement-study",
      kindLabel: "دراسة قياس",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5346477/",
      description: "دراسة لأنماط التواصل بين الشريكين أثناء المشكلات، ومنها التواصل البنّاء وأنماط الطلب والانسحاب."
    },
    "bodie-2011-aels": {
      id: "bodie-2011-aels",
      displayTitle: "مقياس الاستماع النشط المتعاطف: البناء المفاهيمي وأدلة الصدق في المجال بين الأشخاص",
      authors: "بودي",
      year: 2011,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1080/01463373.2011.583495",
      description: "يدعم تناول الاستماع بوصفه عملية تشمل الاستشعار والمعالجة والاستجابة، لا مجرد الصمت أثناء حديث الآخر."
    },
    "crasta-2021-responsiveness": {
      id: "crasta-2021-responsiveness",
      displayTitle: "نحو قياس محسّن لاستجابة الشريك المدركة: تطوير مقياس الاستجابة وعدم الحساسية والتحقق منه",
      authors: "كراستا، وروغي، ومانياتشي",
      year: 2021,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://pubmed.ncbi.nlm.nih.gov/33600200/",
      description: "دراسة أصلية لخبرة الشعور بأن الشريك يفهم ويقدّر ويستجيب، مع تمييزها عن عدم الحساسية."
    },
    "spanier-1976-das": {
      id: "spanier-1976-das",
      displayTitle: "قياس التكيف الثنائي: مقاييس جديدة لتقدير جودة الزواج والعلاقات الثنائية المشابهة",
      authors: "سبانيير",
      year: 1976,
      kind: "validation-study",
      kindLabel: "دراسة قياس أصلية",
      url: "https://doi.org/10.2307/350547",
      description: "مرجع تأسيسي متعدد الأبعاد لدراسة الاتفاق والرضا والتماسك والتعبير العاطفي في العلاقات الثنائية."
    },
    "funk-2007-csi": {
      id: "funk-2007-csi",
      displayTitle: "اختبار دقة قياس الرضا العلاقي بنظرية الاستجابة للبند: مؤشر رضا الأزواج",
      authors: "فانك وروغي",
      year: 2007,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://pubmed.ncbi.nlm.nih.gov/18179329/",
      description: "دراسة قياس للرضا العلاقي؛ تُذكر هنا كأساس بحثي لا بوصفها مصدرًا لاحتمال نجاح العلاقة."
    },
    "laguardia-2000-needs": {
      id: "laguardia-2000-needs",
      displayTitle: "التباين داخل الشخص في أمان التعلق: منظور نظرية تقرير المصير حول التعلق وإشباع الاحتياجات والرفاه",
      authors: "لا غوارديا، ورايان، وكوتشمان، وديسي",
      year: 2000,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      url: "https://selfdeterminationtheory.org/SDT/documents/2000_LaGuardiaRyanCouchDeci.pdf",
      description: "يفحص ارتباط إشباع احتياجات الاستقلال والكفاءة والارتباط بأمان التعلق والرفاه داخل علاقات محددة."
    },
    "pfeiffer-1989-jealousy": {
      id: "pfeiffer-1989-jealousy",
      displayTitle: "الغيرة متعددة الأبعاد",
      authors: "فايفر ووونغ",
      year: 1989,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1177/026540758900600203",
      description: "دراسة أصلية تميز الجوانب المعرفية والعاطفية والسلوكية للغيرة بدل اختزالها في شعور واحد."
    },
    "who-2012-ipv": {
      id: "who-2012-ipv",
      displayTitle: "فهم العنف ضد المرأة والتعامل معه: عنف الشريك الحميم",
      authors: "منظمة الصحة العالمية ومنظمة الصحة للبلدان الأمريكية",
      year: 2012,
      kind: "professional-guidance",
      kindLabel: "إرشاد صحي رسمي",
      url: "https://www.who.int/publications/i/item/WHO-RHR-12.36",
      description: "مرجع رسمي يوضح أن العنف العاطفي والسلوكيات المسيطرة من صور عنف الشريك، فلا تُقدَّم المراقبة أو الإكراه كغيرة طبيعية."
    },
    "davis-1983-iri": {
      id: "davis-1983-iri",
      displayTitle: "قياس الفروق الفردية في التعاطف: أدلة على منظور متعدد الأبعاد",
      authors: "ديفيس",
      year: 1983,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1037/0022-3514.44.1.113",
      description: "مرجع تأسيسي يميز أخذ المنظور والاهتمام التعاطفي والضيق الشخصي بدل جمعها في سمة واحدة."
    },
    "peloquin-2010-couples-empathy": {
      id: "peloquin-2010-couples-empathy",
      displayTitle: "قياس التعاطف لدى الأزواج: صدق وثبات مؤشر التفاعل بين الأشخاص للأزواج",
      authors: "بيلوكان ولافونتين",
      year: 2010,
      kind: "validation-study",
      kindLabel: "دراسة قياس",
      url: "https://pubmed.ncbi.nlm.nih.gov/20155564/",
      description: "يفحص استخدام أبعاد التعاطف في سياق العلاقة الزوجية ويدعم الفصل بين الاهتمام بالآخر والضيق الشخصي."
    },
    "neff-2003-self-compassion": {
      id: "neff-2003-self-compassion",
      displayTitle: "تطوير مقياس لقياس التعاطف مع الذات والتحقق منه",
      authors: "نيف",
      year: 2003,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1080/15298860309027",
      description: "الدراسة الأصلية لأبعاد اللطف مع الذات والإنسانية المشتركة والوعي المتزن وأبعادها المقابلة التي تُصحح عكسيًا."
    },
    "smith-2008-brs": {
      id: "smith-2008-brs",
      displayTitle: "مقياس المرونة المختصر: تقييم القدرة على التعافي",
      authors: "سميث وزملاؤه",
      year: 2008,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://pubmed.ncbi.nlm.nih.gov/18696313/",
      description: "يعرّف جانبًا محوريًا من المرونة بوصفه القدرة على استعادة التوازن بعد الضغط."
    },
    "connor-2003-cdrisc": {
      id: "connor-2003-cdrisc",
      displayTitle: "تطوير مقياس جديد للمرونة: مقياس كونور ـ ديفيدسون للمرونة",
      authors: "كونور وديفيدسون",
      year: 2003,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://pubmed.ncbi.nlm.nih.gov/12964174/",
      description: "دراسة أصلية لبناء مقياس متعدد الجوانب للمرونة النفسية."
    },
    "riggio-2011-relationship-efficacy": {
      id: "riggio-2011-relationship-efficacy",
      displayTitle: "التحقق الأولي من مقياس الكفاءة الذاتية في العلاقات العاطفية",
      authors: "ريجيو، ووايزر، وفالينزويلا، ولوي، ومونتيس، وهوير",
      year: 2011,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1016/j.paid.2011.05.026",
      description: "يفحص الثقة في القدرة على أداء مهام العلاقة، وهو مكوّن واحد من الاستعداد وليس حكمًا على نجاح العلاقة."
    },
    "stanley-1992-commitment": {
      id: "stanley-1992-commitment",
      displayTitle: "تقييم الالتزام في العلاقات الشخصية",
      authors: "ستانلي وماركمان",
      year: 1992,
      kind: "primary-research",
      kindLabel: "بحث قياس أصلي",
      url: "https://doi.org/10.2307/353245",
      description: "يميز جوانب مختلفة من الالتزام والقيود، ما يدعم عدم اختزال الاستعداد في رغبة عامة واحدة."
    },
    "buss-1992-aggression": {
      id: "buss-1992-aggression",
      displayTitle: "استبيان العدوان",
      authors: "بَس وبيري",
      year: 1992,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1037/0022-3514.63.3.452",
      description: "دراسة أصلية تميز الغضب بوصفه انفعالًا عن العدوان اللفظي والجسدي والعدائية."
    },
    "pincus-2009-pni": {
      id: "pincus-2009-pni",
      displayTitle: "البناء الأولي والتحقق من قائمة النرجسية المرضية",
      authors: "بينكوس وزملاؤه",
      year: 2009,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://pubmed.ncbi.nlm.nih.gov/19719348/",
      description: "بحث قياس لسمات نرجسية متعددة؛ لا يجعل تقييم الموقع أداة تشخيص لاضطراب الشخصية النرجسية."
    },
    "back-2013-narc": {
      id: "back-2013-narc",
      displayTitle: "الإعجاب النرجسي والتنافس النرجسي: فصل الجوانب المضيئة والمظلمة للنرجسية",
      authors: "باك، وكوفنر، ودوفنر، وغيرهم",
      year: 2013,
      kind: "validation-study",
      kindLabel: "دراسة نظرية وقياس",
      url: "https://pubmed.ncbi.nlm.nih.gov/24128186/",
      description: "يطور نموذجًا يميز استراتيجيات السعي للإعجاب عن التنافس وخفض قيمة الآخرين."
    },
    "omeara-2011-ssis": {
      id: "omeara-2011-ssis",
      displayTitle: "الخصائص السيكومترية وفائدة مقياس الاندفاع السادي المختصر",
      authors: "أوميرا، وديفيز، وهاموند",
      year: 2011,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1037/a0022400",
      description: "دراسة قياس أولية لمؤشرات الاستمتاع بإيذاء الآخرين أو إذلالهم؛ لا تمنح أساسًا لتشخيص اضطراب."
    },
    "paulhus-2021-sd4": {
      id: "paulhus-2021-sd4",
      displayTitle: "المسح عن الشخصيات المظلمة: تطوير رباعية الظلام المختصرة",
      authors: "بولهوس، وباكلز، وترابنل، وجونز",
      year: 2021,
      kind: "validation-study",
      kindLabel: "دراسة تطوير وقياس",
      url: "https://doi.org/10.1027/1015-5759/a000602",
      description: "دراسة أصلية لمقياس موجز يميز السادية عن سمات مظلمة أخرى على مستوى السمات."
    },
    "lobbestael-2023-sadism-review": {
      id: "lobbestael-2023-sadism-review",
      displayTitle: "السادية واضطرابات الشخصية",
      authors: "لوبيستيل، وسلاوي، وغولفيتسر",
      year: 2023,
      kind: "peer-reviewed-review",
      kindLabel: "مراجعة علمية محكّمة",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10654167/",
      description: "مراجعة لحدود المفهوم وعلاقته بالسمات واضطرابات الشخصية، وتدعم الحذر من الاستنتاج التشخيصي من تقرير ذاتي قصير."
    },
    "liu-2023-csd4": {
      id: "liu-2023-csd4",
      displayTitle: "تطوير النسخة الصينية من رباعية الظلام المختصرة والتحقق منها",
      authors: "ليو، وتشو، وأويانغ، ويانغ، وشيه",
      year: 2023,
      kind: "validation-study",
      kindLabel: "دراسة تحقق ثقافي",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9938411/",
      description: "دراسة تحقق مستقلة لبنية رباعية الظلام، وتُذكر كمرجع قياس لا كتحقق للنسخة العربية في هذا الموقع."
    },
    "mikulincer-2003-regulation": {
      id: "mikulincer-2003-regulation",
      displayTitle: "نظرية التعلق وتنظيم الانفعال: ديناميات استراتيجيات التعلق ونموها ونتائجها المعرفية",
      authors: "ميكولينسر، وشيفر، وبيرغ",
      year: 2003,
      kind: "peer-reviewed-review",
      kindLabel: "مراجعة نظرية محكّمة",
      url: "https://doi.org/10.1023/A:1024515519160",
      description: "يشرح استراتيجيات فرط التنشيط المرتبطة بالقلق واستراتيجيات التعطيل المرتبطة بالتجنب وتنظيم الانفعال."
    },
    "stanovich-2023-aot": {
      id: "stanovich-2023-aot",
      displayTitle: "التفكير المنفتح بنشاط وطرق قياسه",
      authors: "ستانوفيتش وتوبلاك",
      year: 2023,
      kind: "measurement-review",
      kindLabel: "مراجعة قياس علمية",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9966223/",
      description: "يناقش الاستعداد للبحث عن أدلة مخالفة ومراجعة الرأي وتجنب التحيز من جانبي الحجة."
    },
    "apa-cultural-formulation": {
      id: "apa-cultural-formulation",
      displayTitle: "الوحدات التكميلية لمقابلة الصياغة الثقافية",
      authors: "الجمعية الأمريكية للطب النفسي",
      kind: "professional-guidance",
      kindLabel: "إرشاد مهني",
      url: "https://www.psychiatry.org/getmedia/aca8f5a2-9b1b-456c-a3b7-f7f852edcf7c/APA-DSM5TR-CulturalFormulationInterviewSupplementaryModules.pdf",
      description: "إطار مهني لفهم الدين والروحانية والسياق الثقافي باحترام، دون تصديق ادعاء استثنائي أو السخرية من المعتقد."
    },
    "peters-1999-religious-ideation": {
      id: "peters-1999-religious-ideation",
      displayTitle: "الأفكار الضلالية لدى مجموعات دينية ومجموعات ذهانية",
      authors: "بيترز، وداي، وماكينا، وأورباخ",
      year: 1999,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      url: "https://pubmed.ncbi.nlm.nih.gov/10212739/",
      description: "بحث يوضح أهمية الضيق والانشغال والأثر في الحياة عند فهم المعتقدات، بدل الحكم من غرابة المحتوى وحدها."
    },

    /* ----------------------------------------------------------------------
       مراجع أُضيفت لمسار «الرحلة قبل الزواج».
       تُوثَّق هنا حقول إضافية (doi, sourceType, supports, itemUse,
       verification, accessedOn) وفق ما تطلبه docs/CONTENT_METHODOLOGY.md.
       ---------------------------------------------------------------------- */
    "reis-2004-responsiveness": {
      id: "reis-2004-responsiveness",
      displayTitle: "استجابة الشريك المُدرَكة بوصفها مفهومًا ناظمًا في دراسة الحميمية والقرب",
      authors: "ريس، وكلارك، وهولمز",
      year: 2004,
      kind: "foundational-research",
      kindLabel: "فصل مرجعي تأسيسي",
      doi: "10.4324/9781410610010-19",
      url: "https://doi.org/10.4324/9781410610010-19",
      sourceType: "book-chapter",
      supports: "بناء نطاق «الاستجابة والدعم»: الفهم والتقدير والرعاية كعملية يلاحظها الطرف الآخر.",
      itemUse: "لا توجد بنود منشورة استُخدمت؛ المفهوم فقط.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "يعرّف استجابة الشريك المدركة بوصفها عملية يشعر فيها الشخص بأن شريكه ينتبه إليه ويستجيب لما يعرّفه فعلًا."
    },
    "aron-1997-closeness": {
      id: "aron-1997-closeness",
      displayTitle: "التوليد التجريبي للقرب بين الأشخاص: إجراء ونتائج أولية",
      authors: "آرون، وميلينات، وآرون، وفالون، وباتور",
      year: 1997,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      doi: "10.1177/0146167297234003",
      url: "https://doi.org/10.1177/0146167297234003",
      sourceType: "journal-article",
      supports: "مبدأ التدرج والتبادل في الإفصاح الشخصي، وهو ما استرشدت به بنية مكتبة «أسئلة بيننا» من الخفيف إلى العميق.",
      itemUse: "لم تُنقل أو تُترجم أو تُعاد صياغة أي من الأسئلة المنشورة في الدراسة؛ جميع أسئلة بيننا أصلية.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "دراسة أصلية عن أثر الإفصاح الشخصي المتدرج والمتبادل في زيادة الشعور بالقرب. لا تدّعي صناعة الحب ولا تضمنه."
    },
    "swann-1997-partner-accuracy": {
      id: "swann-1997-partner-accuracy",
      displayTitle: "الثقة والدقة في إدراك الأشخاص: هل نعرف ما نظن أننا نعرفه عن شركائنا؟",
      authors: "سوان، وجيل",
      year: 1997,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      doi: "10.1037/0022-3514.73.4.747",
      url: "https://doi.org/10.1037/0022-3514.73.4.747",
      sourceType: "journal-article",
      supports: "الأساس المفاهيمي لتحدي «قد إيه تعرفني؟»: الثقة في معرفة الشريك لا ترتفع بالضرورة مع دقتها.",
      itemUse: "لا بنود منقولة؛ استُخدم التمييز بين الثقة والدقة فقط.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "بحث يوضح أن طول العلاقة يرفع الثقة في معرفة الشريك دون أن يرفع الدقة بالضرورة؛ ولهذا تُعرض الثقة للتأمل لا للتقييم."
    },
    "papp-2009-money-conflict": {
      id: "papp-2009-money-conflict",
      displayTitle: "في الغنى والفقر: المال موضوعًا للخلاف الزوجي في البيت",
      authors: "باب، وكامينغز، وغويكه ـ موري",
      year: 2009,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      doi: "10.1111/j.1741-3729.2008.00537.x",
      url: "https://doi.org/10.1111/j.1741-3729.2008.00537.x",
      sourceType: "journal-article",
      supports: "تبرير إفراد خريطة مستقلة للمال والالتزامات: خلافات المال أكثر تكرارًا وأقل حسمًا من غيرها.",
      itemUse: "لا بنود منقولة.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "دراسة يوميات لخلافات زوجية تبيّن أن الخلافات المتعلقة بالمال أطول وأقل قابلية للحسم من غيرها من الموضوعات."
    },
    "stanley-2006-sliding-deciding": {
      id: "stanley-2006-sliding-deciding",
      displayTitle: "الانزلاق مقابل القرار: القصور الذاتي وأثر المعايشة قبل الزواج",
      authors: "ستانلي، ورودز، وماركمان",
      year: 2006,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      doi: "10.1111/j.1741-3729.2006.00418.x",
      url: "https://doi.org/10.1111/j.1741-3729.2006.00418.x",
      sourceType: "journal-article",
      supports: "أهمية وضوح القرار والالتزام المُعلَن مقابل الانتقال التدريجي غير المقصود؛ أساس خريطة «توقعات الزواج ووضوح الالتزام».",
      itemUse: "لا بنود منقولة.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "يميّز بين الوصول إلى التزام كبير عبر قرار معلن وبين الوصول إليه بالتدرج دون قرار واضح."
    },
    "carlson-2020-housework": {
      id: "carlson-2020-housework",
      displayTitle: "تقسيم أعمال المنزل والتواصل ورضا الأزواج عن العلاقة",
      authors: "كارلسون، وميلر، ورَد",
      year: 2020,
      kind: "primary-research",
      kindLabel: "بحث أصلي",
      doi: "10.1177/2378023120924805",
      url: "https://doi.org/10.1177/2378023120924805",
      sourceType: "journal-article",
      supports: "أساس خريطة «البيت والعبء الذهني»: إدراك الإنصاف والتواصل حول التقسيم أهم من التقسيم بالتساوي عدديًا.",
      itemUse: "لا بنود منقولة.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "بحث مفتوح الوصول عن العلاقة بين تقسيم أعمال المنزل والتواصل حوله والرضا، دون افتراض توزيع صحيح واحد."
    },
    "itc-2017-test-adaptation": {
      id: "itc-2017-test-adaptation",
      displayTitle: "إرشادات لجنة الاختبارات الدولية لترجمة الاختبارات وتكييفها، الإصدار الثاني",
      authors: "لجنة الاختبارات الدولية",
      year: 2017,
      kind: "professional-standard",
      kindLabel: "معيار مهني",
      doi: "10.1080/15305058.2017.1398166",
      url: "https://www.intestcom.org/files/guideline_test_adaptation_2ed.pdf",
      sourceType: "guideline",
      supports: "سبب امتناع بيننا عن وصف نفسه بأنه نسخة عربية مُقنّنة: التكييف يتطلب إجراءات لغوية وسيكومترية لم تُجرَ بعد.",
      itemUse: "معيار إجرائي، لا بنود.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "معيار مهني لترجمة الاختبارات وتكييفها ثقافيًا، ويشترط مقابلات معرفية وتحققًا سيكومتريًا قبل ادعاء التكافؤ."
    },
    "prepare-enrich-domains": {
      id: "prepare-enrich-domains",
      displayTitle: "الصفحة الرسمية لوصف مجالات تقييم PREPARE/ENRICH",
      authors: "PREPARE/ENRICH",
      kind: "commercial-instrument-documentation",
      kindLabel: "توثيق أداة تجارية",
      url: "https://www.prepare-enrich.com/the-assessment/",
      sourceType: "official-website",
      supports: "استُخدم وصف المجالات كنقطة انطلاق لخريطة النطاقات الأربعة عشر فقط.",
      itemUse: "أداة تجارية محمية. لم يُطلب ترخيص ولم يُمنح، ولذلك لم يُنقل ولم يُترجم ولم يُعَد صياغة أي بند منها.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "وصف رسمي لمجالات التقييم قبل الزواج. استُرشد بقائمة المجالات فقط، ولم تُستخدم أي بنود من الأداة."
    },
    "wcag-22": {
      id: "wcag-22",
      displayTitle: "إرشادات إتاحة محتوى الويب، الإصدار 2.2",
      authors: "اتحاد شبكة الويب العالمية (W3C)",
      year: 2023,
      kind: "technical-standard",
      kindLabel: "معيار تقني",
      url: "https://www.w3.org/TR/WCAG22/",
      sourceType: "standard",
      supports: "المرجع المستهدف لإتاحة الواجهة عند المستوى AA.",
      itemUse: "معيار تقني، لا بنود.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "التوصية الرسمية لإرشادات إتاحة محتوى الويب 2.2، وهي المرجع المعتمد لفحوص الإتاحة في هذا المشروع."
    },
    "owasp-csp": {
      id: "owasp-csp",
      displayTitle: "ورقة OWASP المرجعية لسياسة أمان المحتوى",
      authors: "مشروع OWASP",
      kind: "technical-guidance",
      kindLabel: "إرشاد تقني",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html",
      sourceType: "guideline",
      supports: "أساس سياسة الرؤوس الأمنية في vercel.json، وسبب رفض unsafe-inline وunsafe-eval.",
      itemUse: "إرشاد تقني، لا بنود.",
      verification: "verified",
      accessedOn: "2026-09-02",
      description: "إرشاد تقني لبناء سياسة أمان محتوى صارمة دون الاعتماد على السماح بالتنفيذ المضمّن."
    }
  };

  function pick(ids) {
    return ids.map(function (id) { return referencePool[id]; });
  }

  var byAssessment = {
    "emotional-clarity": {
      title: "الأساس العلمي لاختبار وضوح المشاعر",
      description: "استُلهمت الأبعاد من أبحاث الوعي العاطفي ووضوح المشاعر. البنود أصلية وليست ترجمة لمقياس منشور.",
      references: pick(["salovey-1995-tmms", "lane-1990-leas"])
    },
    "attachment-style": {
      title: "الأساس العلمي لاختبار نمط التعلق العاطفي",
      description: "يعتمد الإطار على بعدي القلق والتجنب المستمرين. أي ميل وصفي تقريبي ومؤقت، وليس هوية أو تشخيصًا.",
      references: pick(["fraley-2000-ecrr", "fraley-ecrr-university", "fraley-2011-ecrrs", "fraley-ecrrs-university"])
    },
    "conflict-style": {
      title: "الأساس العلمي لاختبار أسلوب إدارة الخلاف",
      description: "تجمع البنية بين أساليب حل الخلاف وأنماط التواصل البنّاء والطلب والانسحاب، مع بنود أصلية.",
      references: pick(["kurdek-1994-conflict", "christensen-2017-cpq"])
    },
    "emotional-communication": {
      title: "الأساس العلمي لاختبار التواصل العاطفي",
      description: "يركز الإطار على الاستماع النشط والاستجابة المدركة والتعبير والإصلاح، دون نسخ أدوات القياس المنشورة.",
      references: pick(["bodie-2011-aels", "crasta-2021-responsiveness"])
    },
    "partner-compatibility": {
      title: "الأساس العلمي لاختبار توافق الشريكين",
      description: "تُنظم المحاور حوارًا حول مجالات العلاقة. تقارب الإجابات ليس جودةً للعلاقة ولا احتمالًا لنجاح الزواج.",
      references: pick(["spanier-1976-das", "funk-2007-csi"])
    },
    "emotional-needs": {
      title: "الأساس العلمي لاختبار الاحتياجات العاطفية",
      description: "يجمع الإطار بين إشباع الاحتياجات داخل العلاقة وتجربة استجابة الشريك، ولا يمثل اختبار لغات الحب الخمس.",
      references: pick(["laguardia-2000-needs", "crasta-2021-responsiveness"])
    },
    "romantic-jealousy": {
      title: "الأساس العلمي لاختبار الغيرة العاطفية",
      description: "يفصل الإطار بين الفكر والشعور والسلوك، ويعامل المراقبة والإكراه والسيطرة كإشارات أمان لا كدليل حب.",
      references: pick(["pfeiffer-1989-jealousy", "who-2012-ipv"])
    },
    "empathy": {
      title: "الأساس العلمي لاختبار التعاطف",
      description: "يتعامل الاختبار مع التعاطف كبنية متعددة الأبعاد؛ امتصاص ضيق الآخر بلا حدود ليس تعاطفًا صحيًا تلقائيًا.",
      references: pick(["davis-1983-iri", "peloquin-2010-couples-empathy"])
    },
    "self-compassion": {
      title: "الأساس العلمي لاختبار التعاطف مع الذات",
      description: "تتبع الأبعاد النموذج متعدد الجوانب للتعاطف مع الذات، مع تصحيح الجوانب السلبية عكسيًا وبنود عربية أصلية.",
      references: pick(["neff-2003-self-compassion"])
    },
    "resilience": {
      title: "الأساس العلمي لاختبار المرونة النفسية",
      description: "يجمع الإطار بين التعافي والتكيف والمثابرة والتنظيم وطلب الدعم. المرونة لا تعني تحمّل الإساءة أو بيئة مؤذية.",
      references: pick(["smith-2008-brs", "connor-2003-cdrisc"])
    },
    "relationship-readiness": {
      title: "الأساس العلمي لاختبار الاستعداد لعلاقة صحية",
      description: "الاستعداد هنا ملف تأملي للكفاءة والحدود والالتزام والتوقعات، وليس حكمًا قطعيًا على أهلية الشخص للعلاقة.",
      references: pick(["riggio-2011-relationship-efficacy", "stanley-1992-commitment"])
    },
    "anger-management": {
      title: "الأساس العلمي لاختبار إدارة الغضب",
      description: "يميّز الإطار بوضوح بين الغضب بوصفه انفعالًا مشروعًا وبين العدوان أو التهديد أو الإيذاء بوصفها سلوكيات غير مقبولة.",
      references: pick(["buss-1992-aggression", "who-2012-ipv"])
    },
    "narcissistic-traits": {
      title: "الأساس العلمي لاختبار مؤشرات السمات النرجسية في العلاقة",
      description: "تسترشد الأبعاد بأبحاث السمات النرجسية المتعددة. النتيجة تقرير ذاتي للمؤشرات وليست تشخيصًا لاضطراب الشخصية النرجسية.",
      references: pick(["pincus-2009-pni", "back-2013-narc"])
    },
    "cruelty-sadism-indicators": {
      title: "الأساس العلمي لاختبار مؤشرات القسوة والسلوك السادي",
      description: "يركز الاختبار على السلوك بين الأشخاص غير الجنسي، وعلى الإكراه والإذلال والضرر غير التوافقي، ولا يشخّص اضطرابًا.",
      references: pick(["omeara-2011-ssis", "paulhus-2021-sd4", "lobbestael-2023-sadism-review", "liu-2023-csd4"])
    },
    "anxious-attachment": {
      title: "الأساس العلمي لاختبار التعلق القلق",
      description: "يفحص فرط تنشيط نظام التعلق في علاقة حالية بوصفه درجة قابلة للتغير، لا نمطًا ثابتًا أو تشخيصًا.",
      references: pick(["fraley-2000-ecrr", "fraley-ecrr-university", "mikulincer-2003-regulation"])
    },
    "avoidant-attachment": {
      title: "الأساس العلمي لاختبار التعلق التجنبي",
      description: "يفحص استراتيجيات التعطيل والابتعاد في علاقة حالية بوصفها درجات مستمرة قابلة للتغير، لا هوية دائمة.",
      references: pick(["fraley-2000-ecrr", "fraley-ecrr-university", "mikulincer-2003-regulation"])
    },
    "mahdi-claim-critical-thinking": {
      title: "الأساس العلمي لاختبار التفكير النقدي في ادعاءات المهدوية",
      description: "لا تختبر هذه المراجع هوية دينية أو خارقة. إنها تدعم فحص الأدلة والانفتاح على المراجعة وفهم السياق والضيق والأثر الوظيفي باحترام.",
      references: pick(["stanovich-2023-aot", "apa-cultural-formulation", "peters-1999-religious-ideation"])
    },
    "partner-responsiveness": {
      title: "الأساس العلمي لاختبار الاستجابة والدعم",
      description: "استُلهمت الأبعاد من أدبيات استجابة الشريك المُدرَكة وملاءمة الدعم للاحتياج. البنود أصلية ولم تُنقل من أي مقياس منشور.",
      references: pick(["reis-2004-responsiveness", "crasta-2021-responsiveness", "laguardia-2000-needs"])
    },
    "shared-decision-making": {
      title: "الأساس العلمي لاختبار اتخاذ القرار المشترك",
      description: "استُلهمت الأبعاد من أدبيات وضوح القرار مقابل الانتقال التدريجي، ومن أنماط التواصل عند الخلاف. البنود أصلية.",
      references: pick(["stanley-2006-sliding-deciding", "stanley-1992-commitment", "christensen-2017-cpq"])
    },
    "trust-autonomy-boundaries": {
      title: "الأساس العلمي لاختبار الثقة والاستقلال والحدود",
      description: "استُلهمت الأبعاد من أدبيات الغيرة والمراقبة، ومن إرشادات منظمة الصحة العالمية بشأن عنف الشريك، لتمييز الحد المُعلن عن الضغط والإكراه. البنود أصلية.",
      references: pick(["pfeiffer-1989-jealousy", "who-2012-ipv", "laguardia-2000-needs"])
    }
  };

  /*
   * خرائط التوافق والمكتبة الحوارية والتحدي ليست اختبارات مُسجَّلة الدرجات،
   * ولذلك تُوثَّق مراجعها منفصلة حتى لا تُقرأ بوصفها أساسًا سيكومتريًا.
   */
  var byModule = {
    "marriage-expectations": { references: pick(["stanley-2006-sliding-deciding", "stanley-1992-commitment", "prepare-enrich-domains"]) },
    "values-faith-culture": { references: pick(["apa-cultural-formulation", "prepare-enrich-domains"]) },
    "money-and-obligations": { references: pick(["papp-2009-money-conflict", "prepare-enrich-domains"]) },
    "home-and-mental-load": { references: pick(["carlson-2020-housework", "prepare-enrich-domains"]) },
    "family-and-social-boundaries": { references: pick(["prepare-enrich-domains", "apa-cultural-formulation"]) },
    "children-and-parenting": { references: pick(["prepare-enrich-domains", "stanley-1992-commitment"]) },
    "work-place-lifestyle": { references: pick(["prepare-enrich-domains", "papp-2009-money-conflict"]) },
    "affection-and-intimacy": { references: pick(["who-2012-ipv", "reis-2004-responsiveness", "prepare-enrich-domains"]) },
    conversation: { references: pick(["aron-1997-closeness", "reis-2004-responsiveness"]) },
    knowledge: { references: pick(["swann-1997-partner-accuracy", "reis-2004-responsiveness"]) }
  };

  window.BAYNANA_SOURCES = {
    introduction: "هذه المراجع تشرح الأطر التي استرشد بها تصميم الأبعاد. جميع البنود صيغت للموقع ولم تُنسخ من الأدوات المنشورة، ولا يعني ذكر دراسة أن النسخة العربية الحالية خضعت للتحقق السيكومتري.",
    global: pick(["apa-assessment-guidelines", "testing-standards-2014", "itc-2017-test-adaptation"]),
    standards: pick(["wcag-22", "owasp-csp"]),
    byAssessment: byAssessment,
    byModule: byModule
  };
}());
