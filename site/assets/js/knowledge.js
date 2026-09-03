/*
 * "قد إيه تعرفني؟" scoring engine.
 *
 * Two directions are scored SEPARATELY and are never combined into one
 * relationship number. Confidence is recorded for reflection only: it is never
 * turned into a calibration score.
 *
 * Item-level answers live in memory / sessionStorage for the duration of the
 * session. They are never written to localStorage and never encoded into a
 * share code.
 */

export const MARK = {
  accurate: "accurate",
  close: "close",
  different: "different",
  ambiguous: "ambiguous",
  private: "private"
};

const MARK_VALUE = {
  [MARK.accurate]: 1,
  [MARK.close]: 0.5,
  [MARK.different]: 0
};

export const EXCLUDED_MARKS = new Set([MARK.ambiguous, MARK.private]);

export function isSkipAnswer(value) {
  return value === "unsure" || value === "private" || value === undefined || value === null;
}

/*
 * Suggests a mark from the raw answers. The reviewer can always override it;
 * "close" is only ever suggested for an explicitly ordered item.
 */
export function autoCompare(item, selfAnswer, prediction) {
  if (isSkipAnswer(selfAnswer) || isSkipAnswer(prediction)) return MARK.ambiguous;
  if (Number(selfAnswer) === Number(prediction)) return MARK.accurate;
  if (item.type === "ordered" && item.adjacentCounts && Math.abs(Number(selfAnswer) - Number(prediction)) === 1) {
    return MARK.close;
  }
  return MARK.different;
}

function resolveMark(item, entry) {
  if (entry && EXCLUDED_MARKS.has(entry.mark)) return entry.mark;
  if (entry && MARK_VALUE[entry.mark] !== undefined) return entry.mark;
  return autoCompare(item, entry?.selfAnswer, entry?.prediction);
}

/*
 * entries: [{ itemId, selfAnswer, prediction, confidence, mark }]
 * Returns counts, a guarded percentage, and per-category detail.
 */
export function scoreDirection(items, entries, options = {}) {
  const minimumPerCategory = options.minimumPerCategory ?? 3;
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const rows = [];

  entries.forEach((entry) => {
    const item = itemsById.get(entry.itemId);
    if (!item) return;
    const mark = resolveMark(item, entry);
    rows.push({
      item,
      itemId: item.id,
      categoryId: item.cat,
      selfAnswer: entry.selfAnswer,
      prediction: entry.prediction,
      confidence: entry.confidence || "medium",
      mark,
      counted: !EXCLUDED_MARKS.has(mark),
      value: EXCLUDED_MARKS.has(mark) ? null : MARK_VALUE[mark]
    });
  });

  const counted = rows.filter((row) => row.counted);
  const exact = rows.filter((row) => row.mark === MARK.accurate).length;
  const close = rows.filter((row) => row.mark === MARK.close).length;
  const different = rows.filter((row) => row.mark === MARK.different).length;
  const excluded = rows.length - counted.length;

  const total = counted.reduce((sum, row) => sum + row.value, 0);
  // Guarded: a session where every item was excluded has no denominator.
  const percentage = counted.length > 0 ? Math.round((total / counted.length) * 100) : null;

  const categories = new Map();
  rows.forEach((row) => {
    if (!categories.has(row.categoryId)) {
      categories.set(row.categoryId, { categoryId: row.categoryId, rows: [], counted: 0, total: 0 });
    }
    const bucket = categories.get(row.categoryId);
    bucket.rows.push(row);
    if (row.counted) {
      bucket.counted += 1;
      bucket.total += row.value;
    }
  });

  const byCategory = Array.from(categories.values()).map((bucket) => ({
    categoryId: bucket.categoryId,
    answered: bucket.rows.length,
    counted: bucket.counted,
    // Category detail is withheld when too few eligible items exist to say anything.
    percentage: bucket.counted >= minimumPerCategory ? Math.round((bucket.total / bucket.counted) * 100) : null,
    reportable: bucket.counted >= minimumPerCategory
  }));

  return {
    rows,
    exact,
    close,
    different,
    excluded,
    eligible: counted.length,
    percentage,
    byCategory,
    /* For reflection only. Never displayed as a calibration score. */
    confidentMisses: rows.filter((row) => row.confidence === "high" && row.mark === MARK.different),
    discoveries: rows.filter((row) => row.mark === MARK.different),
    notDiscussed: rows.filter((row) => EXCLUDED_MARKS.has(row.mark))
  };
}

/* Builds the opt-in aggregate summary. Item-level data is deliberately absent. */
export function summaryForStorage(direction, result) {
  return {
    savedAt: Date.now(),
    direction: String(direction).slice(0, 40),
    exact: result.exact,
    close: result.close,
    different: result.different,
    excluded: result.excluded
  };
}

/*
 * Picks a balanced item set for a session length across the chosen categories.
 * Intimate items are only ever included when the user selected that category.
 */
export function buildSessionItems(items, categoryIds, targetCount) {
  const chosen = new Set(categoryIds);
  const pools = new Map();
  items.forEach((item) => {
    if (!chosen.has(item.cat)) return;
    if (!pools.has(item.cat)) pools.set(item.cat, []);
    pools.get(item.cat).push(item);
  });

  const order = Array.from(pools.keys());
  const selected = [];
  let index = 0;
  while (selected.length < targetCount && order.length) {
    const categoryId = order[index % order.length];
    const pool = pools.get(categoryId);
    if (pool && pool.length) selected.push(pool.shift());
    index += 1;
    if (order.every((id) => !pools.get(id).length)) break;
  }
  return selected;
}
