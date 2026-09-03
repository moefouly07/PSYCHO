/*
 * Neutral alignment engine.
 *
 * This engine deliberately shares NOTHING with assets/js/scoring.js:
 *  - no polarity
 *  - no supportive or risk value
 *  - no dimension percentage
 *  - no overall compatibility number of any kind
 *
 * It classifies each eligible item as same / close / different, and reports
 * items that are not yet discussed or that a partner kept private.
 */

import { toBase64Url, fromBase64Url, checksum, cleanNickname } from "./pairing.js";
import { assertNoSafetyContent } from "./safety.js";

const PREFIX = "BNA1.";
const VERSION = 1;
const MAX_CODE_LENGTH = 4096;

export const STATUS = {
  same: "same",
  close: "close",
  different: "different",
  unsure: "unsure",
  skipped: "skipped"
};

/*
 * Ordered items: distance 0 = same, distance 1 = close, 2+ = different.
 * Nominal items: equal = same, otherwise different. Closeness is never
 * invented between categories that have no order.
 */
export function classifyItem(item, ownAnswer, peerAnswer) {
  if (ownAnswer === undefined || peerAnswer === undefined) {
    return { status: STATUS.unsure, reason: "missing", distance: null };
  }
  if (ownAnswer === "private" || peerAnswer === "private") {
    return { status: STATUS.skipped, reason: "private", distance: null };
  }
  if (ownAnswer === "unsure" || peerAnswer === "unsure") {
    return { status: STATUS.unsure, reason: "not-discussed", distance: null };
  }
  if (item.type === "nominal") {
    return {
      status: ownAnswer === peerAnswer ? STATUS.same : STATUS.different,
      reason: "nominal",
      distance: null
    };
  }
  const distance = Math.abs(Number(ownAnswer) - Number(peerAnswer));
  if (distance === 0) return { status: STATUS.same, reason: "ordered", distance };
  if (distance === 1) return { status: STATUS.close, reason: "ordered", distance };
  return { status: STATUS.different, reason: "ordered", distance };
}

function importanceOf(record, itemId) {
  return record?.importance?.[itemId] || "flexible";
}

function isPriority(row) {
  if (row.status !== STATUS.different) return false;
  return row.ownImportance !== "flexible" || row.peerImportance !== "flexible";
}

/*
 * Detailed same-device comparison. Item-level answers for both people are held
 * in sessionStorage for the duration of the session only.
 */
export function compareAlignment(map, ownRecord, peerRecord) {
  const rows = map.items.map((item) => {
    const ownAnswer = ownRecord?.answers?.[item.id];
    const peerAnswer = peerRecord?.answers?.[item.id];
    const classification = classifyItem(item, ownAnswer, peerAnswer);
    return {
      item,
      categoryId: item.cat,
      status: classification.status,
      reason: classification.reason,
      distance: classification.distance,
      ownAnswer,
      peerAnswer,
      ownLabel: labelFor(item, ownAnswer),
      peerLabel: labelFor(item, peerAnswer),
      ownImportance: importanceOf(ownRecord, item.id),
      peerImportance: importanceOf(peerRecord, item.id)
    };
  });

  rows.forEach((row) => { row.priority = isPriority(row); });

  const counts = {
    same: rows.filter((row) => row.status === STATUS.same).length,
    close: rows.filter((row) => row.status === STATUS.close).length,
    different: rows.filter((row) => row.status === STATUS.different).length,
    unsure: rows.filter((row) => row.status === STATUS.unsure).length,
    skipped: rows.filter((row) => row.status === STATUS.skipped).length
  };

  const categories = map.categories.map((category) => {
    const categoryRows = rows.filter((row) => row.categoryId === category.id);
    return {
      category,
      rows: categoryRows,
      counts: {
        same: categoryRows.filter((row) => row.status === STATUS.same).length,
        close: categoryRows.filter((row) => row.status === STATUS.close).length,
        different: categoryRows.filter((row) => row.status === STATUS.different).length,
        unsure: categoryRows.filter((row) => row.status === STATUS.unsure).length,
        skipped: categoryRows.filter((row) => row.status === STATUS.skipped).length
      },
      priorities: categoryRows.filter((row) => row.priority).length
    };
  });

  return {
    map,
    rows,
    counts,
    categories,
    shared: rows.filter((row) => row.status === STATUS.same),
    nearby: rows.filter((row) => row.status === STATUS.close),
    differences: rows.filter((row) => row.status === STATUS.different),
    notDiscussed: rows.filter((row) => row.status === STATUS.unsure),
    privateItems: rows.filter((row) => row.status === STATUS.skipped),
    priorities: rows.filter((row) => row.priority)
  };
}

export function labelFor(item, value) {
  if (value === undefined) return "بدون إجابة";
  if (value === "unsure") return "لم نتحدث في هذا بعد";
  if (value === "private") return "أفضل عدم الإجابة";
  const option = item.options.find((entry) => entry.v === Number(value));
  return option ? option.t : "بدون إجابة";
}

/* ------------------------------------------------------------------ aggregates */

/*
 * Category-level aggregate used for the TWO-DEVICE comparison.
 *
 * Only ordered items contribute a mean position, because averaging nominal
 * categories would be meaningless. Everything shared here is a count or a
 * category mean; no item-level answer and no free text ever leaves the device.
 */
export function buildCategoryAggregates(map, record) {
  return map.categories.map((category) => {
    const items = map.items.filter((item) => item.cat === category.id);
    const orderedItems = items.filter((item) => item.type === "ordered");
    const positions = [];
    let unsure = 0;
    let skipped = 0;
    let essential = 0;

    items.forEach((item) => {
      const value = record?.answers?.[item.id];
      if (value === "unsure" || value === undefined) unsure += 1;
      else if (value === "private") skipped += 1;
      else if (item.type === "ordered") positions.push(Number(value));
      if (importanceOf(record, item.id) === "essential") essential += 1;
    });

    const mean = positions.length
      ? Math.round((positions.reduce((total, value) => total + value, 0) / positions.length) * 25)
      : null;

    return {
      id: category.id,
      p: mean,               // 0..100 or null when no ordered item was answered
      n: positions.length,   // ordered items that contributed
      o: orderedItems.length,
      u: unsure,
      s: skipped,
      e: essential
    };
  });
}

/* Category distance thresholds for the less detailed remote comparison. */
export function classifyCategoryAggregate(own, peer) {
  if (own.p === null || peer.p === null) {
    return { status: STATUS.unsure, distance: null };
  }
  const distance = Math.abs(own.p - peer.p);
  if (distance <= 8) return { status: STATUS.same, distance };
  if (distance <= 25) return { status: STATUS.close, distance };
  return { status: STATUS.different, distance };
}

export function compareCategoryAggregates(map, ownAggregates, peerAggregates) {
  const peerById = new Map(peerAggregates.map((entry) => [entry.id, entry]));
  const rows = map.categories.map((category) => {
    const own = ownAggregates.find((entry) => entry.id === category.id);
    const peer = peerById.get(category.id);
    if (!own || !peer) {
      return { category, status: STATUS.unsure, distance: null, own: null, peer: null, priority: false };
    }
    const classification = classifyCategoryAggregate(own, peer);
    return {
      category,
      status: classification.status,
      distance: classification.distance,
      own,
      peer,
      priority: classification.status === STATUS.different && (own.e > 0 || peer.e > 0),
      notDiscussed: own.u + peer.u
    };
  });
  return { map, rows, priorities: rows.filter((row) => row.priority) };
}

/* ------------------------------------------------------------- share code (BNA1) */

function normalizeAggregates(value) {
  if (!Array.isArray(value)) return null;
  const clean = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    if (typeof entry.id !== "string" || !/^[a-z0-9_-]{2,40}$/i.test(entry.id)) return null;
    if (entry.p !== null && !(Number.isInteger(entry.p) && entry.p >= 0 && entry.p <= 100)) return null;
    for (const field of ["n", "o", "u", "s", "e"]) {
      if (!Number.isInteger(entry[field]) || entry[field] < 0 || entry[field] > 64) return null;
    }
    clean.push({ id: entry.id, p: entry.p, n: entry.n, o: entry.o, u: entry.u, s: entry.s, e: entry.e });
  }
  return clean;
}

function buildBase(record) {
  return [
    VERSION,
    String(record.mapId || ""),
    cleanNickname(record.nickname),
    Number.isInteger(record.contentVersion) ? record.contentVersion : 1,
    normalizeAggregates(record.aggregates) || [],
    Number.isFinite(record.completedAt) ? Math.round(record.completedAt) : Date.now()
  ];
}

export function encodeAlignmentCode(record) {
  /*
   * Guard the PAYLOAD, not the encoded string: once Base64URL-encoded, a
   * substring check can no longer see what is inside. Applying it here makes
   * it impossible for a caller to skip.
   */
  assertNoSafetyContent(record, "alignment share code");
  const base = buildBase(record);
  if (!base[1] || !base[2]) throw new Error("Map ID and nickname are required");
  if (!base[4].length) throw new Error("Category aggregates are required");
  const signature = checksum(JSON.stringify(base));
  return `${PREFIX}${toBase64Url(JSON.stringify([...base, signature]))}`;
}

function failure(code, message) {
  return { ok: false, code, message };
}

export function decodeAlignmentCode(input, options = {}) {
  const text = String(input ?? "");
  if (text.length > MAX_CODE_LENGTH) {
    return failure("size", "الرمز أطول مما تسمح به هذه الصفحة. تأكد من نسخ رمز واحد فقط.");
  }

  const match = text.match(/BNA1\.([A-Za-z0-9_-]{12,})/);
  if (!match) {
    return failure("format", "لم أجد رمز خريطة صالحًا. يجب أن يبدأ الرمز بـ BNA1. وأن يُنسخ كاملًا.");
  }

  let data;
  try {
    data = JSON.parse(fromBase64Url(match[1]));
  } catch {
    return failure("corrupted", "تعذّر قراءة الرمز؛ قد يكون ناقصًا أو تغيّر أثناء النسخ.");
  }

  if (!Array.isArray(data) || data.length !== 7) {
    return failure("structure", "بنية رمز الخريطة غير صالحة.");
  }

  const [version, mapId, nickname, contentVersion, aggregates, completedAt, suppliedChecksum] = data;
  if (version !== VERSION) {
    return failure("version", "هذا الرمز صادر من نسخة غير مدعومة من الخرائط.");
  }

  const base = [version, mapId, nickname, contentVersion, aggregates, completedAt];
  if (checksum(JSON.stringify(base)) !== suppliedChecksum) {
    return failure("checksum", "فشل التحقق من سلامة الرمز. انسخه من المصدر مرة أخرى دون تعديل.");
  }

  if (typeof mapId !== "string" || !/^[a-z0-9-]{3,64}$/.test(mapId)) {
    return failure("map", "معرّف الخريطة داخل الرمز غير صالح.");
  }

  if (options.availableIds) {
    const ids = options.availableIds instanceof Set ? options.availableIds : new Set(options.availableIds);
    if (!ids.has(mapId)) return failure("unknown-map", "الرمز يخص خريطة غير متاحة في هذه النسخة.");
  }

  if (options.expectedMapId && mapId !== options.expectedMapId) {
    return failure("wrong-map", "هذا الرمز يخص خريطة أخرى. افتحا الخريطة نفسها لدى الطرفين ثم أعيدا المحاولة.");
  }

  const cleanName = cleanNickname(nickname);
  if (!cleanName || cleanName !== nickname) {
    return failure("nickname", "الاسم المختصر داخل الرمز غير صالح.");
  }

  if (!Number.isInteger(contentVersion) || contentVersion < 1 || contentVersion > 999) {
    return failure("content-version", "رقم نسخة المحتوى داخل الرمز غير صالح.");
  }

  if (options.expectedContentVersion && contentVersion !== options.expectedContentVersion) {
    return failure("content-mismatch", "أُنشئ هذا الرمز من نسخة مختلفة من أسئلة الخريطة. أعيدا الإجابة على النسخة نفسها لدى الطرفين.");
  }

  const cleanAggregates = normalizeAggregates(aggregates);
  if (!cleanAggregates || !cleanAggregates.length || cleanAggregates.length > 32) {
    return failure("aggregates", "الملخصات داخل الرمز غير صالحة.");
  }
  if (JSON.stringify(cleanAggregates) !== JSON.stringify(aggregates)) {
    return failure("aggregates", "الملخصات داخل الرمز غير صالحة.");
  }

  const latestAllowed = Date.now() + 24 * 60 * 60 * 1000;
  if (!Number.isInteger(completedAt) || completedAt < 0 || completedAt > latestAllowed) {
    return failure("timestamp", "وقت الإكمال داخل الرمز غير صالح.");
  }

  return {
    ok: true,
    code: `${PREFIX}${match[1]}`,
    payload: {
      version,
      mapId,
      nickname: cleanName,
      contentVersion,
      aggregates: cleanAggregates,
      completedAt,
      checksum: suppliedChecksum
    }
  };
}

export function isSameAlignmentResult(first, second) {
  if (!first || !second) return false;
  return first.mapId === second.mapId
    && first.completedAt === second.completedAt
    && JSON.stringify(first.aggregates) === JSON.stringify(second.aggregates);
}

export function alignmentShareLink(mapId, code) {
  const root = window.location.origin === "null"
    ? window.location.href.split("#")[0]
    : `${window.location.origin}${window.location.pathname}`;
  return `${root}#/premarital/align/${encodeURIComponent(mapId)}/partner/${code}`;
}

export const alignmentConstants = { PREFIX, VERSION, MAX_CODE_LENGTH };
