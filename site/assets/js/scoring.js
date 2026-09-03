function clampPercentage(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function interpretationKey(percentage) {
  if (percentage <= 39) return "low";
  if (percentage <= 59) return "developing";
  return "strong";
}

export function comparisonLabel(gap) {
  if (gap <= 10) return "تقارب واضح";
  if (gap <= 24) return "اختلاف متوسط";
  return "اختلاف يستحق الحوار";
}

function findBand(test, value) {
  if (value == null || !Array.isArray(test.bands)) return null;
  return test.bands.find((band) => value >= band.min && value <= band.max) || null;
}

function deriveAttachment(test, dimensions) {
  const byId = Object.fromEntries(dimensions.map((dimension) => [dimension.id, dimension]));

  if (test.id === "attachment-style" && test.extraConfig) {
    const config = test.extraConfig;
    const anxiety = Math.round(mean(config.anxietyDims.map((id) => byId[id]?.percentage ?? 0)));
    const avoidance = Math.round(mean(config.avoidanceDims.map((id) => {
      const value = byId[id]?.percentage ?? 0;
      return config.invertInAvoidance.includes(id) ? 100 - value : value;
    })));
    const directSecurity = config.securityDims.map((id) => byId[id]?.percentage ?? 0);
    const security = Math.round(mean([...directSecurity, 100 - anxiety, 100 - avoidance]));
    const highAnxiety = anxiety >= config.threshold;
    const highAvoidance = avoidance >= config.threshold;
    const tendency = highAnxiety && highAvoidance
      ? "fearful"
      : highAnxiety
        ? "anxious"
        : highAvoidance
          ? "avoidant"
          : "secure";
    return { anxiety, avoidance, security, tendency };
  }

  if (test.id === "anxious-attachment") {
    const anxiety = Math.round(100 - mean(dimensions.map((dimension) => dimension.supportive)));
    return { anxiety, security: 100 - anxiety, tendency: "anxious-reflection" };
  }

  if (test.id === "avoidant-attachment") {
    const avoidance = Math.round(100 - mean(dimensions.map((dimension) => dimension.supportive)));
    return { avoidance, security: 100 - avoidance, tendency: "avoidant-reflection" };
  }

  return {};
}

export function scoreFromPercentages(test, percentages) {
  if (!Array.isArray(percentages) || percentages.length !== test.dimensions.length) {
    throw new Error("Invalid dimension percentages");
  }

  const dimensions = test.dimensions.map((definition, index) => {
    const percentage = clampPercentage(percentages[index]);
    const supportive = definition.polarity === "negative" ? 100 - percentage : percentage;
    return {
      id: definition.id,
      name: definition.name,
      short: definition.short || definition.name,
      percentage,
      supportive,
      polarity: definition.polarity,
      interpretation: definition.interp?.[interpretationKey(percentage)] || definition.desc,
      definition,
      index
    };
  });

  const supportiveOverall = Math.round(mean(dimensions.map((dimension) => dimension.supportive)));
  const riskOverall = 100 - supportiveOverall;
  let overall = supportiveOverall;

  if (test.scoreMode === "profile") overall = null;
  if (test.scoreMode === "risk") overall = riskOverall;
  if (test.id === "anxious-attachment" || test.id === "avoidant-attachment") overall = riskOverall;

  const derived = deriveAttachment(test, dimensions);
  const band = findBand(test, overall);
  const orderedHigh = dimensions.slice().sort((a, b) => b.supportive - a.supportive || a.index - b.index);
  const orderedLow = dimensions.slice().sort((a, b) => a.supportive - b.supportive || a.index - b.index);

  return {
    dimensions,
    overall,
    supportiveOverall,
    riskOverall,
    band,
    derived,
    strengths: orderedHigh.slice(0, 2),
    growth: orderedLow.slice(0, 2)
  };
}

export function scoreAssessment(test, answers) {
  const percentages = test.dimensions.map((dimension) => {
    const questions = test.questions.filter((question) => question.dim === dimension.id);
    const raw = questions.reduce((total, question) => total + Number(answers[question.id]), 0);
    return Math.round((raw / (questions.length * 2)) * 100);
  });
  return scoreFromPercentages(test, percentages);
}

export function compareScores(test, firstScore, secondScore) {
  const rows = firstScore.dimensions.map((dimension, index) => {
    const peer = secondScore.dimensions[index];
    const gap = Math.abs(dimension.percentage - peer.percentage);
    return {
      id: dimension.id,
      name: dimension.name,
      index,
      first: dimension.percentage,
      second: peer.percentage,
      firstSupportive: dimension.supportive,
      secondSupportive: peer.supportive,
      averageSupportive: Math.round((dimension.supportive + peer.supportive) / 2),
      gap,
      label: comparisonLabel(gap),
      definition: dimension.definition
    };
  });

  const similarity = Math.round(100 - mean(rows.map((row) => row.gap)));
  const similarities = rows.slice().sort((a, b) => a.gap - b.gap || b.averageSupportive - a.averageSupportive || a.index - b.index).slice(0, 3);
  const differences = rows.slice().sort((a, b) => b.gap - a.gap || a.index - b.index).slice(0, 3);
  const sharedStrengths = rows
    .filter((row) => row.gap <= 10 && row.averageSupportive >= 60)
    .sort((a, b) => b.averageSupportive - a.averageSupportive || a.index - b.index)
    .slice(0, 3);
  const discussionAreas = rows
    .filter((row) => row.gap >= 11 || row.averageSupportive < 60)
    .sort((a, b) => b.gap - a.gap || a.averageSupportive - b.averageSupportive || a.index - b.index)
    .slice(0, 3);

  return { test, rows, similarity, similarities, differences, sharedStrengths, discussionAreas };
}

export function formatPercentage(value) {
  return `${Math.round(value)}٪`;
}
