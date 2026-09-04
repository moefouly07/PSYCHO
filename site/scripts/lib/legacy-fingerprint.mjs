/*
 * Pinned structural fingerprint of every assessment, captured 2026-09-03
 * during the forensic audit documented in docs/LEGACY_ASSESSMENT_RECOVERY.md.
 *
 * Consumed only by scripts/validate-legacy-preservation.js. See that file
 * for why this exists and what it protects against.
 */
export const LEGACY_FINGERPRINT = {
  "emotional-clarity": {
    title: "اختبار وضوح المشاعر",
    dims: [
      ["noticing", "positive"],
      ["body_signals", "positive"],
      ["labeling", "positive"],
      ["differentiation", "positive"],
      ["causal_understanding", "positive"],
      ["expression", "positive"]
    ],
    questionsByDim: [
      ["noticing", ["ec01", "ec02", "ec03"]],
      ["body_signals", ["ec04", "ec05", "ec06"]],
      ["labeling", ["ec07", "ec08", "ec09"]],
      ["differentiation", ["ec10", "ec11", "ec12"]],
      ["causal_understanding", ["ec13", "ec14", "ec15"]],
      ["expression", ["ec16", "ec17", "ec18"]]
    ]
  },
  "attachment-style": {
    title: "اختبار نمط التعلق العاطفي",
    dims: [
      ["security", "positive"],
      ["abandonment_anxiety", "negative"],
      ["reassurance_seeking", "negative"],
      ["closeness_comfort", "positive"],
      ["trust_dependence", "positive"],
      ["avoidant_distancing", "negative"]
    ],
    questionsByDim: [
      ["security", ["at01", "at02", "at03"]],
      ["abandonment_anxiety", ["at04", "at05", "at06"]],
      ["reassurance_seeking", ["at07", "at08", "at09"]],
      ["closeness_comfort", ["at10", "at11", "at12"]],
      ["trust_dependence", ["at13", "at14", "at15"]],
      ["avoidant_distancing", ["at16", "at17", "at18"]]
    ]
  },
  "conflict-style": {
    title: "اختبار أسلوب إدارة الخلاف",
    dims: [
      ["collaboration", "positive"],
      ["assertive", "positive"],
      ["listening", "positive"],
      ["compromise", "positive"],
      ["withdrawal", "negative"],
      ["escalation", "negative"]
    ],
    questionsByDim: [
      ["collaboration", ["cf01", "cf02", "cf03"]],
      ["assertive", ["cf04", "cf05", "cf06"]],
      ["listening", ["cf07", "cf08", "cf09"]],
      ["compromise", ["cf10", "cf11", "cf12"]],
      ["withdrawal", ["cf13", "cf14", "cf15"]],
      ["escalation", ["cf16", "cf17", "cf18"]]
    ]
  },
  "emotional-communication": {
    title: "اختبار التواصل العاطفي",
    dims: [
      ["reading_message", "positive"],
      ["clear_expression", "positive"],
      ["active_listening", "positive"],
      ["validation", "positive"],
      ["needs_boundaries", "positive"],
      ["repair", "positive"]
    ],
    questionsByDim: [
      ["reading_message", ["cm01", "cm02", "cm03"]],
      ["clear_expression", ["cm04", "cm05", "cm06"]],
      ["active_listening", ["cm07", "cm08", "cm09"]],
      ["validation", ["cm10", "cm11", "cm12"]],
      ["needs_boundaries", ["cm13", "cm14", "cm15"]],
      ["repair", ["cm16", "cm17", "cm18"]]
    ]
  },
  "partner-compatibility": {
    title: "اختبار توافق الشريكين",
    dims: [
      ["values", "positive"],
      ["communication", "positive"],
      ["closeness", "positive"],
      ["lifestyle", "positive"],
      ["money_future", "positive"],
      ["repair", "positive"]
    ],
    questionsByDim: [
      ["values", ["pc01", "pc02", "pc03"]],
      ["communication", ["pc04", "pc05", "pc06"]],
      ["closeness", ["pc07", "pc08", "pc09"]],
      ["lifestyle", ["pc10", "pc11", "pc12"]],
      ["money_future", ["pc13", "pc14", "pc15"]],
      ["repair", ["pc16", "pc17", "pc18"]]
    ]
  },
  "emotional-needs": {
    title: "اختبار الاحتياجات العاطفية",
    dims: [
      ["security", "positive"],
      ["attention", "positive"],
      ["appreciation", "positive"],
      ["autonomy", "positive"],
      ["practical_support", "positive"],
      ["affection", "positive"]
    ],
    questionsByDim: [
      ["security", ["en01", "en02", "en03"]],
      ["attention", ["en04", "en05", "en06"]],
      ["appreciation", ["en07", "en08", "en09"]],
      ["autonomy", ["en10", "en11", "en12"]],
      ["practical_support", ["en13", "en14", "en15"]],
      ["affection", ["en16", "en17", "en18"]]
    ]
  },
  "romantic-jealousy": {
    title: "اختبار الغيرة العاطفية",
    dims: [
      ["trigger_awareness", "positive"],
      ["threat_interpretation", "negative"],
      ["baseline_trust", "positive"],
      ["regulation", "positive"],
      ["checking_behavior", "negative"],
      ["direct_communication", "positive"]
    ],
    questionsByDim: [
      ["trigger_awareness", ["jl01", "jl02", "jl03"]],
      ["threat_interpretation", ["jl04", "jl05", "jl06"]],
      ["baseline_trust", ["jl07", "jl08", "jl09"]],
      ["regulation", ["jl10", "jl11", "jl12"]],
      ["checking_behavior", ["jl13", "jl14", "jl15"]],
      ["direct_communication", ["jl16", "jl17", "jl18"]]
    ]
  },
  empathy: {
    title: "اختبار التعاطف",
    dims: [
      ["perspective_taking", "positive"],
      ["emotional_resonance", "positive"],
      ["compassionate_concern", "positive"],
      ["attentive_listening", "positive"],
      ["emotional_boundaries", "positive"],
      ["distress_regulation", "positive"]
    ],
    questionsByDim: [
      ["perspective_taking", ["em01", "em02", "em03"]],
      ["emotional_resonance", ["em04", "em05", "em06"]],
      ["compassionate_concern", ["em07", "em08", "em09"]],
      ["attentive_listening", ["em10", "em11", "em12"]],
      ["emotional_boundaries", ["em13", "em14", "em15"]],
      ["distress_regulation", ["em16", "em17", "em18"]]
    ]
  },
  "self-compassion": {
    title: "اختبار التعاطف مع الذات",
    dims: [
      ["self_kindness", "positive"],
      ["self_judgment", "negative"],
      ["common_humanity", "positive"],
      ["isolation", "negative"],
      ["mindful_awareness", "positive"],
      ["over_identification", "negative"]
    ],
    questionsByDim: [
      ["self_kindness", ["sc01", "sc02", "sc03"]],
      ["self_judgment", ["sc04", "sc05", "sc06"]],
      ["common_humanity", ["sc07", "sc08", "sc09"]],
      ["isolation", ["sc10", "sc11", "sc12"]],
      ["mindful_awareness", ["sc13", "sc14", "sc15"]],
      ["over_identification", ["sc16", "sc17", "sc18"]]
    ]
  },
  resilience: {
    title: "اختبار المرونة النفسية",
    dims: [
      ["recovery", "positive"],
      ["adaptability", "positive"],
      ["persistence", "positive"],
      ["emotion_regulation", "positive"],
      ["realistic_optimism", "positive"],
      ["support_seeking", "positive"]
    ],
    questionsByDim: [
      ["recovery", ["rs01", "rs02", "rs03"]],
      ["adaptability", ["rs04", "rs05", "rs06"]],
      ["persistence", ["rs07", "rs08", "rs09"]],
      ["emotion_regulation", ["rs10", "rs11", "rs12"]],
      ["realistic_optimism", ["rs13", "rs14", "rs15"]],
      ["support_seeking", ["rs16", "rs17", "rs18"]]
    ]
  },
  "relationship-readiness": {
    title: "اختبار الاستعداد لعلاقة صحية",
    dims: [
      ["emotional_availability", "positive"],
      ["self_awareness", "positive"],
      ["boundaries", "positive"],
      ["emotional_independence", "positive"],
      ["communication_repair", "positive"],
      ["realistic_expectations", "positive"]
    ],
    questionsByDim: [
      ["emotional_availability", ["rr01", "rr02", "rr03"]],
      ["self_awareness", ["rr04", "rr05", "rr06"]],
      ["boundaries", ["rr07", "rr08", "rr09"]],
      ["emotional_independence", ["rr10", "rr11", "rr12"]],
      ["communication_repair", ["rr13", "rr14", "rr15"]],
      ["realistic_expectations", ["rr16", "rr17", "rr18"]]
    ]
  },
  "anger-management": {
    title: "اختبار إدارة الغضب",
    dims: [
      ["trigger_awareness", "positive"],
      ["physical_signs", "positive"],
      ["impulse_control", "positive"],
      ["assertive_expression", "positive"],
      ["de_escalation", "positive"],
      ["repair_accountability", "positive"]
    ],
    questionsByDim: [
      ["trigger_awareness", ["ag01", "ag02", "ag03"]],
      ["physical_signs", ["ag04", "ag05", "ag06"]],
      ["impulse_control", ["ag07", "ag08", "ag09"]],
      ["assertive_expression", ["ag10", "ag11", "ag12"]],
      ["de_escalation", ["ag13", "ag14", "ag15"]],
      ["repair_accountability", ["ag16", "ag17", "ag18"]]
    ]
  },
  "narcissistic-traits": {
    title: "اختبار مؤشرات السمات النرجسية في العلاقة",
    dims: [
      ["admiration_seeking", "negative"],
      ["entitlement", "negative"],
      ["empathy_gaps", "negative"],
      ["criticism_defensiveness", "negative"],
      ["exploitation_control", "negative"],
      ["reciprocity_accountability", "negative"]
    ],
    questionsByDim: [
      ["admiration_seeking", ["nt01", "nt02", "nt03"]],
      ["entitlement", ["nt04", "nt05", "nt06"]],
      ["empathy_gaps", ["nt07", "nt08", "nt09"]],
      ["criticism_defensiveness", ["nt10", "nt11", "nt12"]],
      ["exploitation_control", ["nt13", "nt14", "nt15"]],
      ["reciprocity_accountability", ["nt16", "nt17", "nt18"]]
    ]
  },
  "cruelty-sadism-indicators": {
    title: "اختبار مؤشرات القسوة والسلوك السادي",
    dims: [
      ["dominance_humiliation", "negative"],
      ["distress_indifference", "negative"],
      ["aggressive_humor", "negative"],
      ["coercive_punishment", "negative"],
      ["remorse_accountability", "negative"],
      ["consent_boundaries", "negative"]
    ],
    questionsByDim: [
      ["dominance_humiliation", ["cs01", "cs02", "cs03"]],
      ["distress_indifference", ["cs04", "cs05", "cs06"]],
      ["aggressive_humor", ["cs07", "cs08", "cs09"]],
      ["coercive_punishment", ["cs10", "cs11", "cs12"]],
      ["remorse_accountability", ["cs13", "cs14", "cs15"]],
      ["consent_boundaries", ["cs16", "cs17", "cs18"]]
    ]
  },
  "anxious-attachment": {
    title: "اختبار التعلق القلق",
    dims: [
      ["abandonment_fear", "negative"],
      ["distance_hypervigilance", "negative"],
      ["reassurance_seeking", "negative"],
      ["protest_behavior", "negative"],
      ["self_soothing", "negative"],
      ["identity_boundaries", "negative"]
    ],
    questionsByDim: [
      ["abandonment_fear", ["aa01", "aa02", "aa03"]],
      ["distance_hypervigilance", ["aa04", "aa05", "aa06"]],
      ["reassurance_seeking", ["aa07", "aa08", "aa09"]],
      ["protest_behavior", ["aa10", "aa11", "aa12"]],
      ["self_soothing", ["aa13", "aa14", "aa15"]],
      ["identity_boundaries", ["aa16", "aa17", "aa18"]]
    ]
  },
  "avoidant-attachment": {
    title: "اختبار التعلق التجنبي",
    dims: [
      ["dependence_discomfort", "negative"],
      ["emotional_suppression", "negative"],
      ["withdrawal_deactivation", "negative"],
      ["excessive_self_reliance", "negative"],
      ["intimacy_discomfort", "negative"],
      ["return_repair", "negative"]
    ],
    questionsByDim: [
      ["dependence_discomfort", ["av01", "av02", "av03"]],
      ["emotional_suppression", ["av04", "av05", "av06"]],
      ["withdrawal_deactivation", ["av07", "av08", "av09"]],
      ["excessive_self_reliance", ["av10", "av11", "av12"]],
      ["intimacy_discomfort", ["av13", "av14", "av15"]],
      ["return_repair", ["av16", "av17", "av18"]]
    ]
  },
  "mahdi-claim-critical-thinking": {
    title: "اختبار التفكير النقدي في ادعاءات المهدوية",
    dims: [
      ["evidence_quality", "negative"],
      ["source_independence", "negative"],
      ["consistency_falsifiability", "negative"],
      ["manipulation_exploitation", "negative"],
      ["daily_functioning", "negative"],
      ["neutral_review", "negative"]
    ],
    questionsByDim: [
      ["evidence_quality", ["mh01", "mh02", "mh03"]],
      ["source_independence", ["mh04", "mh05", "mh06"]],
      ["consistency_falsifiability", ["mh07", "mh08", "mh09"]],
      ["manipulation_exploitation", ["mh10", "mh11", "mh12"]],
      ["daily_functioning", ["mh13", "mh14", "mh15"]],
      ["neutral_review", ["mh16", "mh17", "mh18"]]
    ]
  },
  "partner-responsiveness": {
    title: "اختبار الاستجابة والدعم",
    dims: [
      ["noticing_bids", "positive"],
      ["validation", "positive"],
      ["matched_support", "positive"],
      ["availability_under_load", "positive"],
      ["follow_through", "positive"],
      ["dismissive_response", "negative"]
    ],
    questionsByDim: [
      ["noticing_bids", ["pr01", "pr02", "pr03"]],
      ["validation", ["pr04", "pr05", "pr06"]],
      ["matched_support", ["pr07", "pr08", "pr09"]],
      ["availability_under_load", ["pr10", "pr11", "pr12"]],
      ["follow_through", ["pr13", "pr14", "pr15"]],
      ["dismissive_response", ["pr16", "pr17", "pr18"]]
    ]
  },
  "shared-decision-making": {
    title: "اختبار اتخاذ القرار المشترك",
    dims: [
      ["information_sharing", "positive"],
      ["influence_acceptance", "positive"],
      ["option_generation", "positive"],
      ["reversibility_awareness", "positive"],
      ["follow_through_review", "positive"],
      ["unilateral_moves", "negative"]
    ],
    questionsByDim: [
      ["information_sharing", ["sd01", "sd02", "sd03"]],
      ["influence_acceptance", ["sd04", "sd05", "sd06"]],
      ["option_generation", ["sd07", "sd08", "sd09"]],
      ["reversibility_awareness", ["sd10", "sd11", "sd12"]],
      ["follow_through_review", ["sd13", "sd14", "sd15"]],
      ["unilateral_moves", ["sd16", "sd17", "sd18"]]
    ]
  },
  "trust-autonomy-boundaries": {
    title: "اختبار الثقة والاستقلال والحدود",
    dims: [
      ["stating_boundaries", "positive"],
      ["respecting_limits", "positive"],
      ["autonomy_tolerance", "positive"],
      ["privacy_expectations", "positive"],
      ["trust_repair", "positive"],
      ["boundary_pressure", "negative"]
    ],
    questionsByDim: [
      ["stating_boundaries", ["tb01", "tb02", "tb03"]],
      ["respecting_limits", ["tb04", "tb05", "tb06"]],
      ["autonomy_tolerance", ["tb07", "tb08", "tb09"]],
      ["privacy_expectations", ["tb10", "tb11", "tb12"]],
      ["trust_repair", ["tb13", "tb14", "tb15"]],
      ["boundary_pressure", ["tb16", "tb17", "tb18"]]
    ]
  }
};
