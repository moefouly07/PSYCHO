const PREFIX = "BN1.";
const VERSION = 1;

export function cleanNickname(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

export function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromBase64Url(value) {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function checksum(text) {
  let hash = 0x811c9dc5;
  const bytes = new TextEncoder().encode(text);
  bytes.forEach((byte) => {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  });
  return hash.toString(36).padStart(7, "0");
}

function normalizeDerived(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const clean = {};
  Object.keys(value).sort().forEach((name) => {
    if (!/^[a-z][a-z0-9-]{0,23}$/i.test(name)) return;
    const item = value[name];
    if (Number.isInteger(item) && item >= 0 && item <= 100) clean[name] = item;
    if (typeof item === "string" && item.length <= 32 && /^[a-z0-9-]+$/i.test(item)) clean[name] = item;
  });
  return clean;
}

function buildBase(record) {
  return [
    VERSION,
    String(record.assessmentId || ""),
    cleanNickname(record.nickname),
    Array.isArray(record.dimensions) ? record.dimensions.map(Number) : [],
    normalizeDerived(record.derived),
    Number.isFinite(record.completedAt) ? Math.round(record.completedAt) : Date.now()
  ];
}

export function encodePairingCode(record) {
  const base = buildBase(record);
  if (!base[1] || !base[2]) throw new Error("Assessment ID and nickname are required");
  if (base[3].length !== 6 || !base[3].every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) {
    throw new Error("Six valid dimension percentages are required");
  }
  const signature = checksum(JSON.stringify(base));
  return `${PREFIX}${toBase64Url(JSON.stringify([...base, signature]))}`;
}

function decodeFailure(code, message) {
  return { ok: false, code, message };
}

export function decodePairingCode(input, options = {}) {
  const match = String(input ?? "").match(/BN1\.([A-Za-z0-9_-]{12,})/);
  if (!match) {
    return decodeFailure("format", "لم أجد رمز نتيجة صالحًا. يجب أن يبدأ الرمز بـ BN1. وأن يُنسخ كاملًا.");
  }

  let data;
  try {
    data = JSON.parse(fromBase64Url(match[1]));
  } catch {
    return decodeFailure("corrupted", "تعذّر قراءة الرمز؛ قد يكون ناقصًا أو تغيّر أثناء النسخ.");
  }

  if (!Array.isArray(data) || data.length !== 7) {
    return decodeFailure("structure", "بنية رمز النتيجة غير صالحة.");
  }

  const [version, assessmentId, nickname, dimensions, derived, completedAt, suppliedChecksum] = data;
  if (version !== VERSION) {
    return decodeFailure("version", "هذا الرمز صادر من نسخة غير مدعومة من الموقع.");
  }

  const base = [version, assessmentId, nickname, dimensions, derived, completedAt];
  if (checksum(JSON.stringify(base)) !== suppliedChecksum) {
    return decodeFailure("checksum", "فشل التحقق من سلامة الرمز. انسخه من المصدر مرة أخرى دون تعديل.");
  }

  if (typeof assessmentId !== "string" || !/^[a-z0-9-]{3,64}$/.test(assessmentId)) {
    return decodeFailure("assessment", "معرّف الاختبار داخل الرمز غير صالح.");
  }

  if (options.availableIds) {
    const ids = options.availableIds instanceof Set ? options.availableIds : new Set(options.availableIds);
    if (!ids.has(assessmentId)) {
      return decodeFailure("unknown-assessment", "الرمز يخص اختبارًا غير متاح في هذه النسخة.");
    }
  }

  if (options.expectedAssessmentId && assessmentId !== options.expectedAssessmentId) {
    return decodeFailure("wrong-assessment", "هذا الرمز يخص اختبارًا آخر. افتح الاختبار نفسه لدى الطرفين ثم أعد المحاولة.");
  }

  const cleanName = cleanNickname(nickname);
  if (!cleanName || cleanName !== nickname) {
    return decodeFailure("nickname", "الاسم المختصر داخل الرمز غير صالح.");
  }

  if (!Array.isArray(dimensions) || dimensions.length !== 6 ||
      !dimensions.every((value) => Number.isInteger(value) && value >= 0 && value <= 100)) {
    return decodeFailure("range", "الرمز يحتوي على نسب أبعاد غير صالحة.");
  }

  const cleanDerived = normalizeDerived(derived);
  if (JSON.stringify(cleanDerived) !== JSON.stringify(derived)) {
    return decodeFailure("derived", "المؤشرات المشتقة داخل الرمز غير صالحة.");
  }

  const latestAllowed = Date.now() + 24 * 60 * 60 * 1000;
  if (!Number.isInteger(completedAt) || completedAt < 0 || completedAt > latestAllowed) {
    return decodeFailure("timestamp", "وقت الإكمال داخل الرمز غير صالح.");
  }

  return {
    ok: true,
    code: `${PREFIX}${match[1]}`,
    payload: {
      version,
      assessmentId,
      nickname: cleanName,
      dimensions: dimensions.slice(),
      derived: cleanDerived,
      completedAt,
      checksum: suppliedChecksum
    }
  };
}

export function isSameResult(first, second) {
  if (!first || !second) return false;
  return first.assessmentId === second.assessmentId &&
    first.completedAt === second.completedAt &&
    first.dimensions.join(",") === second.dimensions.join(",");
}

export function resultRecordForCode(test, result, score) {
  const derived = { ...score.derived };
  const safetyLevel = result.safety?.level === "high" ? 2 : result.safety?.level === "caution" ? 1 : 0;
  if (safetyLevel) derived.safety = safetyLevel;
  return {
    assessmentId: test.id,
    nickname: result.nickname,
    dimensions: score.dimensions.map((dimension) => dimension.percentage),
    derived,
    completedAt: result.completedAt
  };
}

export function shareLinkFor(assessmentId, code) {
  const root = window.location.origin === "null"
    ? window.location.href.split("#")[0]
    : `${window.location.origin}${window.location.pathname}`;
  const encodedId = encodeURIComponent(assessmentId);
  return code
    ? `${root}#/assessment/${encodedId}/partner/${code}`
    : `${root}#/assessment/${encodedId}`;
}

export const pairingConstants = { PREFIX, VERSION };
