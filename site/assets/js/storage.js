const config = window.BAYNANA_CONFIG || {};
const namespace = config.storageNamespace || "baynana:v1";

const key = {
  theme: `${namespace}:theme`,
  nickname: `${namespace}:nickname`,
  privateMode: `${namespace}:private-mode`,
  progress: (assessmentId) => `${namespace}:progress:${assessmentId}`,
  result: (assessmentId) => `${namespace}:result:${assessmentId}`,
  pair: (assessmentId) => `${namespace}:pair:${assessmentId}`,
  pending: (assessmentId) => `${namespace}:pending:${assessmentId}`,

  /* Alignment maps: answers stay on the originating device. */
  alignProgress: (mapId) => `${namespace}:align:progress:${mapId}`,
  alignResult: (mapId) => `${namespace}:align:result:${mapId}`,
  alignPair: (mapId) => `${namespace}:align:pair:${mapId}`,

  /* Conversation library: question IDs only, never written answers. */
  conversationFavorites: `${namespace}:conversation:favorites`,
  conversationDiscussed: `${namespace}:conversation:discussed`,
  conversationLater: `${namespace}:conversation:later`,

  /* Knowledge challenge: aggregate summary only, and only after opt-in. */
  knowledgeSummaries: `${namespace}:knowledge:summaries`,

  /* Premarital discussion agenda: topic IDs the couple explicitly selected. */
  agenda: `${namespace}:premarital:agenda`
};

/*
 * Session-only keys. These hold item-level alignment answers during a
 * same-device comparison and the entire knowledge challenge. They live in
 * sessionStorage, are purged on quick exit and on completion, and are never
 * encoded into a share code.
 */
const sessionKey = {
  prefix: `${namespace}:session:`,
  alignSlot: (mapId, slot) => `${namespace}:session:align:${mapId}:${slot}`,
  knowledge: `${namespace}:session:knowledge`,
  safetyCheck: `${namespace}:session:safety-check`
};

function readRaw(storageKey) {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeRaw(storageKey, value) {
  try {
    window.localStorage.setItem(storageKey, value);
    return true;
  } catch {
    return false;
  }
}

function remove(storageKey) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Storage can be unavailable in restrictive browser modes.
  }
}

function readJSON(storageKey) {
  const value = readRaw(storageKey);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    remove(storageKey);
    return null;
  }
}

function writeJSON(storageKey, value) {
  return writeRaw(storageKey, JSON.stringify(value));
}

/*
 * Private mode.
 *
 * When enabled, no feature writes progress, results, pairings, favorites, or
 * summaries to localStorage. The preference flag itself is stored so the choice
 * survives a refresh; the user is told this explicitly on the privacy page.
 * Session-only state still works, because that is what private mode is for.
 */
function privateModeEnabled() {
  return readRaw(key.privateMode) === "on";
}

function writePersistentJSON(storageKey, value) {
  if (privateModeEnabled()) return false;
  return writeJSON(storageKey, value);
}

function readSession(storageKey) {
  try {
    const value = window.sessionStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeSession(storageKey, value) {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeSession(storageKey) {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // sessionStorage can be unavailable in restrictive browser modes.
  }
}

function clearSessionNamespace() {
  try {
    const targets = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const storageKey = window.sessionStorage.key(index);
      if (storageKey && storageKey.startsWith(sessionKey.prefix)) targets.push(storageKey);
    }
    targets.forEach((storageKey) => window.sessionStorage.removeItem(storageKey));
    return true;
  } catch {
    return false;
  }
}

/* Schema guard for the stored ID lists used by the conversation library. */
function sanitizeIdList(candidate, limit = 500) {
  if (!Array.isArray(candidate)) return [];
  const seen = new Set();
  candidate.forEach((value) => {
    if (typeof value !== "string") return;
    if (!/^[a-z0-9_-]{2,40}$/i.test(value)) return;
    seen.add(value);
  });
  return Array.from(seen).slice(0, limit);
}

function cleanNickname(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function isIntegerBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function sanitizeProgress(test, candidate) {
  if (!candidate || candidate.v !== 1 || candidate.testId !== test.id) return null;
  const answers = {};
  const order = {};
  const questionsById = new Map(test.questions.map((question) => [question.id, question]));

  if (candidate.answers && typeof candidate.answers === "object") {
    Object.entries(candidate.answers).forEach(([questionId, score]) => {
      if (questionsById.has(questionId) && isIntegerBetween(score, 0, 2)) {
        answers[questionId] = score;
      }
    });
  }

  if (candidate.order && typeof candidate.order === "object") {
    Object.entries(candidate.order).forEach(([questionId, indexes]) => {
      const question = questionsById.get(questionId);
      if (!question || !Array.isArray(indexes)) return;
      const expected = question.options.map((_, index) => index).sort((a, b) => a - b);
      const actual = indexes.slice().sort((a, b) => a - b);
      if (actual.length === expected.length && actual.every((value, index) => value === expected[index])) {
        order[questionId] = indexes.slice();
      }
    });
  }

  const index = isIntegerBetween(candidate.index, 0, test.questions.length - 1)
    ? candidate.index
    : 0;

  return {
    v: 1,
    testId: test.id,
    nickname: cleanNickname(candidate.nickname),
    answers,
    order,
    index,
    startedAt: Number.isFinite(candidate.startedAt) ? candidate.startedAt : Date.now(),
    updatedAt: Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : Date.now()
  };
}

function sanitizeResult(test, candidate) {
  if (!candidate || candidate.v !== 1 || candidate.testId !== test.id) return null;
  if (!Array.isArray(candidate.dimensions) || candidate.dimensions.length !== 6) return null;
  if (!candidate.dimensions.every((value) => isIntegerBetween(value, 0, 100))) return null;

  const validQuestionIds = new Set(test.questions.map((question) => question.id));
  const answers = {};
  if (candidate.answers && typeof candidate.answers === "object") {
    Object.entries(candidate.answers).forEach(([questionId, score]) => {
      if (validQuestionIds.has(questionId) && isIntegerBetween(score, 0, 2)) {
        answers[questionId] = score;
      }
    });
  }

  return {
    v: 1,
    testId: test.id,
    nickname: cleanNickname(candidate.nickname),
    dimensions: candidate.dimensions.slice(),
    answers,
    derived: candidate.derived && typeof candidate.derived === "object" ? candidate.derived : {},
    safety: candidate.safety && typeof candidate.safety === "object" ? candidate.safety : { level: "none", reasons: [], flags: [] },
    completedAt: Number.isFinite(candidate.completedAt) ? candidate.completedAt : Date.now()
  };
}

/*
 * Alignment records hold neutral positions, not scores.
 *
 * A record written under a different content version is NOT reinterpreted: it
 * is returned marked `stale` so the view can offer a restart instead of
 * silently mapping old answers onto changed options.
 */
function sanitizeAlignmentRecord(map, candidate) {
  if (!candidate || candidate.v !== 1 || candidate.mapId !== map.id) return null;
  if (Number.isFinite(candidate.contentVersion) && candidate.contentVersion !== map.contentVersion) {
    return { v: 1, mapId: map.id, stale: true, contentVersion: candidate.contentVersion, answers: {}, importance: {} };
  }

  const itemsById = new Map(map.items.map((entry) => [entry.id, entry]));
  const answers = {};
  const importance = {};
  const validImportance = new Set(["flexible", "important", "essential"]);

  if (candidate.answers && typeof candidate.answers === "object") {
    Object.entries(candidate.answers).forEach(([itemId, value]) => {
      const definition = itemsById.get(itemId);
      if (!definition) return;
      if (value === "unsure" && definition.allowUnsure) { answers[itemId] = "unsure"; return; }
      if (value === "private" && definition.allowPrivate) { answers[itemId] = "private"; return; }
      if (isIntegerBetween(value, 0, definition.options.length - 1)) answers[itemId] = value;
    });
  }

  if (candidate.importance && typeof candidate.importance === "object") {
    Object.entries(candidate.importance).forEach(([itemId, value]) => {
      if (itemsById.has(itemId) && validImportance.has(value)) importance[itemId] = value;
    });
  }

  return {
    v: 1,
    mapId: map.id,
    stale: false,
    contentVersion: map.contentVersion,
    nickname: cleanNickname(candidate.nickname),
    answers,
    importance,
    index: isIntegerBetween(candidate.index, 0, map.items.length - 1) ? candidate.index : 0,
    startedAt: Number.isFinite(candidate.startedAt) ? candidate.startedAt : Date.now(),
    updatedAt: Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : Date.now(),
    completedAt: Number.isFinite(candidate.completedAt) ? candidate.completedAt : null
  };
}

export const storage = {
  key,
  namespace,
  cleanNickname,

  getTheme() {
    const value = readRaw(key.theme);
    return value === "light" || value === "dark" ? value : null;
  },

  setTheme(value) {
    if (value === "light" || value === "dark") writeRaw(key.theme, value);
  },

  getNickname() {
    return cleanNickname(readRaw(key.nickname));
  },

  setNickname(value) {
    if (privateModeEnabled()) return;
    writeRaw(key.nickname, cleanNickname(value));
  },

  getProgress(test) {
    const raw = readJSON(key.progress(test.id));
    const value = sanitizeProgress(test, raw);
    if (raw && !value) remove(key.progress(test.id));
    return value;
  },

  setProgress(test, value) {
    const clean = sanitizeProgress(test, { ...value, v: 1, testId: test.id, updatedAt: Date.now() });
    return clean ? writePersistentJSON(key.progress(test.id), clean) : false;
  },

  deleteProgress(assessmentId) {
    remove(key.progress(assessmentId));
  },

  getResult(test) {
    const raw = readJSON(key.result(test.id));
    const value = sanitizeResult(test, raw);
    if (raw && !value) remove(key.result(test.id));
    return value;
  },

  setResult(test, value) {
    const clean = sanitizeResult(test, { ...value, v: 1, testId: test.id });
    return clean ? writePersistentJSON(key.result(test.id), clean) : false;
  },

  deleteResult(assessmentId) {
    remove(key.result(assessmentId));
  },

  getPair(assessmentId) {
    const value = readJSON(key.pair(assessmentId));
    if (!value || value.v !== 1 || value.assessmentId !== assessmentId || !value.payload) return null;
    return value;
  },

  setPair(assessmentId, code, payload) {
    return writePersistentJSON(key.pair(assessmentId), {
      v: 1,
      assessmentId,
      code,
      payload,
      pairedAt: Date.now()
    });
  },

  deletePair(assessmentId) {
    remove(key.pair(assessmentId));
  },

  getPendingCode(assessmentId) {
    return readRaw(key.pending(assessmentId));
  },

  setPendingCode(assessmentId, code) {
    if (privateModeEnabled()) return;
    writeRaw(key.pending(assessmentId), String(code || "").slice(0, 4096));
  },

  deletePendingCode(assessmentId) {
    remove(key.pending(assessmentId));
  },

  restartAssessment(assessmentId) {
    remove(key.progress(assessmentId));
    remove(key.result(assessmentId));
    remove(key.pair(assessmentId));
    remove(key.pending(assessmentId));
  },

  /* ---------------------------------------------------------------- private mode */

  isPrivateMode() {
    return privateModeEnabled();
  },

  setPrivateMode(enabled) {
    if (enabled) writeRaw(key.privateMode, "on");
    else remove(key.privateMode);
  },

  /* ---------------------------------------------------------------- session state */

  sessionKey,
  readSession,
  writeSession,
  removeSession,
  clearSession: clearSessionNamespace,

  /* ---------------------------------------------------------------- alignment maps */

  getAlignmentProgress(map) {
    const raw = readJSON(key.alignProgress(map.id));
    const value = sanitizeAlignmentRecord(map, raw);
    if (raw && !value) remove(key.alignProgress(map.id));
    return value;
  },

  setAlignmentProgress(map, value) {
    const clean = sanitizeAlignmentRecord(map, { ...value, v: 1, mapId: map.id, updatedAt: Date.now() });
    return clean ? writePersistentJSON(key.alignProgress(map.id), clean) : false;
  },

  getAlignmentResult(map) {
    const raw = readJSON(key.alignResult(map.id));
    const value = sanitizeAlignmentRecord(map, raw);
    if (raw && !value) remove(key.alignResult(map.id));
    return value;
  },

  setAlignmentResult(map, value) {
    const clean = sanitizeAlignmentRecord(map, { ...value, v: 1, mapId: map.id, completedAt: Date.now() });
    return clean ? writePersistentJSON(key.alignResult(map.id), clean) : false;
  },

  getAlignmentPair(mapId) {
    const value = readJSON(key.alignPair(mapId));
    if (!value || value.v !== 1 || value.mapId !== mapId || !value.payload) return null;
    return value;
  },

  setAlignmentPair(mapId, code, payload) {
    return writePersistentJSON(key.alignPair(mapId), { v: 1, mapId, code, payload, pairedAt: Date.now() });
  },

  deleteAlignmentPair(mapId) {
    remove(key.alignPair(mapId));
  },

  restartAlignment(mapId) {
    remove(key.alignProgress(mapId));
    remove(key.alignResult(mapId));
    remove(key.alignPair(mapId));
  },

  /* ------------------------------------------------------------ conversation lists */

  getConversationList(name) {
    const storageKey = {
      favorites: key.conversationFavorites,
      discussed: key.conversationDiscussed,
      later: key.conversationLater
    }[name];
    if (!storageKey) return [];
    const raw = readJSON(storageKey);
    const clean = sanitizeIdList(raw);
    if (raw && !Array.isArray(raw)) remove(storageKey);
    return clean;
  },

  setConversationList(name, ids) {
    const storageKey = {
      favorites: key.conversationFavorites,
      discussed: key.conversationDiscussed,
      later: key.conversationLater
    }[name];
    if (!storageKey) return false;
    return writePersistentJSON(storageKey, sanitizeIdList(ids));
  },

  deleteConversationData() {
    remove(key.conversationFavorites);
    remove(key.conversationDiscussed);
    remove(key.conversationLater);
  },

  /* ------------------------------------------------- knowledge aggregate summaries */

  getKnowledgeSummaries() {
    const raw = readJSON(key.knowledgeSummaries);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry) => entry && typeof entry === "object"
        && Number.isFinite(entry.savedAt)
        && isIntegerBetween(entry.exact, 0, 999)
        && isIntegerBetween(entry.close, 0, 999)
        && isIntegerBetween(entry.different, 0, 999)
        && isIntegerBetween(entry.excluded, 0, 999))
      .slice(0, 20)
      .map((entry) => ({
        savedAt: entry.savedAt,
        direction: typeof entry.direction === "string" ? entry.direction.slice(0, 40) : "",
        exact: entry.exact,
        close: entry.close,
        different: entry.different,
        excluded: entry.excluded
      }));
  },

  addKnowledgeSummary(summary) {
    const existing = this.getKnowledgeSummaries();
    return writePersistentJSON(key.knowledgeSummaries, [summary, ...existing].slice(0, 20));
  },

  deleteKnowledgeSummaries() {
    remove(key.knowledgeSummaries);
  },

  /* ------------------------------------------------------------ discussion agenda */

  getAgenda() {
    const raw = readJSON(key.agenda);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry) => entry && typeof entry.id === "string" && /^[a-z0-9:_-]{2,80}$/i.test(entry.id))
      .slice(0, 100)
      .map((entry) => ({
        id: entry.id,
        label: typeof entry.label === "string" ? entry.label.slice(0, 160) : entry.id,
        source: typeof entry.source === "string" ? entry.source.slice(0, 40) : "",
        addedAt: Number.isFinite(entry.addedAt) ? entry.addedAt : Date.now()
      }));
  },

  setAgenda(entries) {
    return writePersistentJSON(key.agenda, entries.slice(0, 100));
  },

  deleteAgenda() {
    remove(key.agenda);
  },

  deleteAll() {
    clearSessionNamespace();
    try {
      const targets = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const storageKey = window.localStorage.key(index);
        if (storageKey && storageKey.startsWith(`${namespace}:`)) targets.push(storageKey);
      }
      targets.forEach((storageKey) => window.localStorage.removeItem(storageKey));
      return true;
    } catch {
      return false;
    }
  }
};
