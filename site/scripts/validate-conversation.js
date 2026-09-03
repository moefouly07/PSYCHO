/*
 * Structural validator for the "أسئلة بيننا" conversation library.
 *
 * Conversation content must never carry scoring fields, and the twenty
 * required categories must each keep a full four-group set.
 */
import { loadBrowserData, report } from "./lib/load-data.mjs";

const errors = [];
const warnings = [];
const win = loadBrowserData(errors);

const meta = win.BAYNANA_CONVERSATION_CATEGORIES;
const library = win.BAYNANA_CONVERSATION_QUESTIONS;
const deckData = win.BAYNANA_CONVERSATION_DECKS;

if (!meta) errors.push("window.BAYNANA_CONVERSATION_CATEGORIES was not created");
if (!library) errors.push("window.BAYNANA_CONVERSATION_QUESTIONS was not created");
if (!deckData) errors.push("window.BAYNANA_CONVERSATION_DECKS was not created");

const REQUIRED_CATEGORIES = [
  "identity", "values", "meaning", "love", "needs", "communication", "repair",
  "trust", "commitment", "money", "work", "daily", "family", "friends",
  "faith", "intimacy", "children", "health", "leisure", "change"
];

const REQUIRED_DECKS = [
  "light-start", "premarital-basics", "deep-talk", "hard-decisions",
  "money-duties", "family-limits", "our-future", "weekly", "crisis", "affection"
];

const MINIMUM_PER_CATEGORY = 12;
const MINIMUM_TOTAL = 240;
const MINIMUM_PER_DECK = 12;
const REQUIRED_GROUPS = ["discovery", "deep", "decision", "scenario"];
const PER_GROUP = 3;

const scoringFields = ["s", "score", "dim", "polarity", "options", "interp", "bands", "weight"];

if (meta && library && deckData) {
  const categories = meta.categories || [];
  const questions = library.questions || [];
  const decks = deckData.decks || [];

  const categoryIds = categories.map((category) => category.id);
  if (categories.length !== 20) errors.push(`Expected exactly 20 categories, found ${categories.length}`);
  REQUIRED_CATEGORIES.forEach((id) => {
    if (!categoryIds.includes(id)) errors.push(`Missing required conversation category: ${id}`);
  });
  if (new Set(categoryIds).size !== categoryIds.length) errors.push("Conversation category IDs are not unique");

  const validDepth = new Set((meta.depthLevels || []).map((level) => level.id));
  const validSensitivity = new Set((meta.sensitivityLevels || []).map((level) => level.id));
  const validMode = new Set((meta.modes || []).map((mode) => mode.id));
  const validStage = new Set((meta.stages || []).map((stage) => stage.id));

  if (questions.length < MINIMUM_TOTAL) {
    errors.push(`Expected at least ${MINIMUM_TOTAL} questions, found ${questions.length}`);
  }

  const ids = new Set();
  const prompts = new Map();

  questions.forEach((question) => {
    if (ids.has(question.id)) errors.push(`Duplicate question ID: ${question.id}`);
    ids.add(question.id);
    if (!/^[a-z0-9_-]{3,40}$/i.test(question.id)) errors.push(`${question.id}: invalid stable ID format`);
    if (!categoryIds.includes(question.cat)) errors.push(`${question.id}: unknown category ${question.cat}`);
    if (question.kind !== "conversation") errors.push(`${question.id}: kind must be "conversation"`);
    if (!Number.isInteger(question.schemaVersion)) errors.push(`${question.id}: missing schemaVersion`);
    if (!Number.isInteger(question.contentVersion)) errors.push(`${question.id}: missing contentVersion`);
    if (!question.prompt || question.prompt.length < 12) errors.push(`${question.id}: prompt is too short`);
    if (!validDepth.has(question.depth)) errors.push(`${question.id}: invalid depth ${question.depth}`);
    if (!validSensitivity.has(question.sensitivity)) errors.push(`${question.id}: invalid sensitivity ${question.sensitivity}`);
    if (!validMode.has(question.mode)) errors.push(`${question.id}: invalid mode ${question.mode}`);
    if (!validStage.has(question.stage)) errors.push(`${question.id}: invalid stage ${question.stage}`);
    if (!Number.isInteger(question.minutes) || question.minutes < 1 || question.minutes > 30) {
      errors.push(`${question.id}: invalid estimated discussion time`);
    }
    if (!REQUIRED_GROUPS.includes(question.group)) errors.push(`${question.id}: invalid group ${question.group}`);
    if (!Array.isArray(question.decks)) errors.push(`${question.id}: decks must be an array`);

    /* A yes/no question needs a meaningful follow-up so it cannot dead-end. */
    if (/^(هل|أ)\s/.test(question.prompt.trim()) && (!question.followUp || question.followUp.length < 8)) {
      errors.push(`${question.id}: closed question requires a meaningful follow-up`);
    }

    scoringFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(question, field)) {
        errors.push(`${question.id}: conversation questions must not carry the scoring field "${field}"`);
      }
    });

    const key = question.prompt.replace(/\s+/g, " ").trim();
    if (prompts.has(key)) errors.push(`Duplicate question text: "${key}" (${prompts.get(key)} and ${question.id})`);
    else prompts.set(key, question.id);
  });

  categories.forEach((category) => {
    const list = questions.filter((question) => question.cat === category.id);
    if (list.length < MINIMUM_PER_CATEGORY) {
      errors.push(`${category.id}: expected at least ${MINIMUM_PER_CATEGORY} questions, found ${list.length}`);
    }
    REQUIRED_GROUPS.forEach((groupId) => {
      const count = list.filter((question) => question.group === groupId).length;
      if (count < PER_GROUP) {
        errors.push(`${category.id}/${groupId}: expected at least ${PER_GROUP} questions, found ${count}`);
      }
    });
  });

  const deckIds = decks.map((deck) => deck.id);
  REQUIRED_DECKS.forEach((id) => {
    if (!deckIds.includes(id)) errors.push(`Missing required deck: ${id}`);
  });
  decks.forEach((deck) => {
    if (!deck.title || !deck.description) errors.push(`${deck.id}: missing title or description`);
    if (!Array.isArray(deck.questionIds) || deck.questionIds.length < MINIMUM_PER_DECK) {
      errors.push(`${deck.id}: expected at least ${MINIMUM_PER_DECK} question references`);
    }
    (deck.questionIds || []).forEach((questionId) => {
      if (!ids.has(questionId)) errors.push(`${deck.id}: references unknown question ${questionId}`);
    });
    if (new Set(deck.questionIds || []).size !== (deck.questionIds || []).length) {
      errors.push(`${deck.id}: duplicate question references`);
    }
    /* Decks reference IDs; they must never embed prompt text. */
    if (JSON.stringify(deck).includes("prompt")) errors.push(`${deck.id}: decks must not duplicate question text`);
  });

  const intimateDeck = decks.find((deck) => deck.sensitivity === "intimate");
  if (intimateDeck && (!intimateDeck.optional || !intimateDeck.adultOnly)) {
    errors.push(`${intimateDeck.id}: intimate decks must be optional and adult-only`);
  }

  report("Conversation validation", errors, warnings, [
    `${categories.length} categories · ${questions.length} questions · ${decks.length} decks`,
    `Every category carries ${PER_GROUP}+ of each: discovery · deep · decision · scenario`
  ]);
} else {
  report("Conversation validation", errors, warnings);
}
