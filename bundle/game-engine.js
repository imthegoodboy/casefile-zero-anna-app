import { CAST, getCase } from "./data.js";

export const DEFAULT_PROFILE = {
  name: "Detective Zero",
  detectiveId: "anika",
  accentId: "vermilion",
  sound: true,
  xp: 0,
  solved: {},
  attempts: 0,
};

export function createGame(caseId, now = Date.now()) {
  const caseFile = getCase(caseId);
  return {
    caseId: caseFile.id,
    startedAt: now,
    updatedAt: now,
    discovered: [],
    interviews: {},
    conversation: {},
    links: [],
    deductions: [],
    hintsUsed: 0,
    wrongAccusations: 0,
    completed: false,
    result: null,
  };
}

export function normalizeGame(value) {
  const source = value && typeof value === "object" ? value : {};
  const caseFile = getCase(source.caseId);
  const clueIds = new Set(caseFile.clues.map((clue) => clue.id));
  const suspectIds = new Set(Object.keys(caseFile.suspects));
  const validLinks = caseFile.connections.map((connection) => connectionKey(connection.ids));
  const safeConversation = Object.fromEntries(
    Object.entries(source.conversation || {})
      .filter(([id]) => suspectIds.has(id))
      .map(([id, values]) => [
        id,
        Array.isArray(values)
          ? values
            .filter((item) => item && (item.role === "detective" || item.role === "suspect"))
            .map((item) => ({ role: item.role, text: normalizeReply(item.text).slice(0, 1200) }))
            .filter((item) => item.text)
            .slice(-20)
          : [],
      ]),
  );
  const result = source.result && typeof source.result === "object"
    ? {
      solved: Boolean(source.result.solved),
      score: Math.max(0, Math.min(1000, Number(source.result.score) || 0)),
      rank: String(source.result.rank || "Case remains open").slice(0, 48),
      culpritCorrect: Boolean(source.result.culpritCorrect),
      motiveCorrect: Boolean(source.result.motiveCorrect),
      methodCorrect: Boolean(source.result.methodCorrect),
      correctEvidence: unique(source.result.correctEvidence).filter((id) => clueIds.has(id)).slice(0, 3),
      submittedEvidence: unique(source.result.submittedEvidence).filter((id) => clueIds.has(id)).slice(0, 3),
      completedAt: Number(source.result.completedAt) || Date.now(),
    }
    : null;
  return {
    ...createGame(caseFile.id, Number(source.startedAt) || Date.now()),
    caseId: caseFile.id,
    startedAt: Number(source.startedAt) || Date.now(),
    updatedAt: Number(source.updatedAt) || Date.now(),
    discovered: unique(source.discovered).filter((id) => clueIds.has(id)),
    interviews: Object.fromEntries(Object.entries(source.interviews || {}).filter(([id]) => suspectIds.has(id)).map(([id, values]) => [id, unique(values).slice(0, 4)])),
    conversation: safeConversation,
    links: unique(source.links).filter((key) => validLinks.includes(key)),
    deductions: unique(source.deductions).map((item) => String(item).slice(0, 180)).slice(0, 4),
    hintsUsed: nonNegative(source.hintsUsed),
    wrongAccusations: nonNegative(source.wrongAccusations),
    completed: Boolean(source.completed && result?.solved),
    result,
  };
}

export function discoverClue(game, clueId, now = Date.now()) {
  const caseFile = getCase(game.caseId);
  if (!caseFile.clues.some((clue) => clue.id === clueId)) return { game, added: false };
  if (game.discovered.includes(clueId)) return { game, added: false };
  return {
    added: true,
    game: { ...game, discovered: [...game.discovered, clueId], updatedAt: now },
  };
}

export function recordQuestion(game, suspectId, questionIndex, answer, now = Date.now()) {
  const caseFile = getCase(game.caseId);
  const suspect = caseFile.suspects[suspectId];
  if (!suspect || !suspect.questions[questionIndex]) return game;
  const asked = unique([...(game.interviews[suspectId] || []), String(questionIndex)]);
  const transcript = [...(game.conversation[suspectId] || []), { role: "detective", text: suspect.questions[questionIndex].label }, { role: "suspect", text: answer || suspect.questions[questionIndex].answer }].slice(-20);
  return { ...game, interviews: { ...game.interviews, [suspectId]: asked }, conversation: { ...game.conversation, [suspectId]: transcript }, updatedAt: now };
}

export function recordCustomExchange(game, suspectId, question, answer, now = Date.now()) {
  if (!CAST[suspectId] || !question || !answer) return game;
  const transcript = [...(game.conversation[suspectId] || []), { role: "detective", text: question }, { role: "suspect", text: answer }].slice(-20);
  return { ...game, conversation: { ...game.conversation, [suspectId]: transcript }, updatedAt: now };
}

export function normalizeReply(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isCompleteReply(value) {
  const text = normalizeReply(value);
  if (text.length < 18 || text.length > 1200) return false;
  if (/^(?:what he knows|situation|answer|analysis|assistant|suspect dossier)\b/i.test(text)) return false;
  return /[.!?…]["')\]}]*$/.test(text);
}

export function connectEvidence(game, firstId, secondId, now = Date.now()) {
  if (!game.discovered.includes(firstId) || !game.discovered.includes(secondId) || firstId === secondId) {
    return { game, status: "invalid", deduction: null };
  }
  const caseFile = getCase(game.caseId);
  const key = connectionKey([firstId, secondId]);
  const connection = caseFile.connections.find((item) => connectionKey(item.ids) === key);
  if (!connection) return { game, status: "no-match", deduction: null };
  if (game.links.includes(key)) return { game, status: "known", deduction: connection };
  return {
    status: "new",
    deduction: connection,
    game: { ...game, links: [...game.links, key], deductions: [...game.deductions, connection.title], updatedAt: now },
  };
}

export function investigationReadiness(game) {
  const interviewed = Object.values(game.interviews || {}).filter((items) => items.length > 0).length;
  const discovered = game.discovered.length;
  const deductions = game.deductions.length;
  return {
    discovered,
    interviewed,
    deductions,
    canAccuse: discovered >= 4 && interviewed >= 2 && deductions >= 1,
    progress: Math.min(100, Math.round((discovered / 6) * 45 + (interviewed / 4) * 25 + (deductions / 4) * 30)),
  };
}

export function useHint(game, now = Date.now()) {
  const caseFile = getCase(game.caseId);
  const undiscovered = caseFile.clues.find((clue) => !game.discovered.includes(clue.id));
  const unlinked = caseFile.connections.find((connection) => !game.links.includes(connectionKey(connection.ids)) && connection.ids.every((id) => game.discovered.includes(id)));
  let hint;
  if (unlinked) hint = `Try linking “${labelFor(caseFile, unlinked.ids[0])}” with “${labelFor(caseFile, unlinked.ids[1])}.”`;
  else if (undiscovered) hint = `Return to the scene and inspect the ${undiscovered.foundAt.toLowerCase()}.`;
  else hint = "Compare each suspect's alibi against the reconstructed timeline, then select evidence from independent sources.";
  return { hint, game: { ...game, hintsUsed: game.hintsUsed + 1, updatedAt: now } };
}

export function evaluateAccusation(game, accusation, elapsedSeconds = 0, now = Date.now()) {
  const caseFile = getCase(game.caseId);
  const solution = caseFile.solution;
  const submittedEvidence = unique(accusation.evidence).slice(0, 3);
  const correctEvidence = submittedEvidence.filter((id) => solution.evidence.includes(id));
  const culpritCorrect = accusation.culprit === solution.culprit;
  const motiveCorrect = accusation.motive === solution.motive;
  const methodCorrect = accusation.method === solution.method;
  const solved = culpritCorrect && motiveCorrect && methodCorrect && correctEvidence.length >= 2;
  const raw = 250 + (culpritCorrect ? 250 : 0) + (motiveCorrect ? 120 : 0) + (methodCorrect ? 120 : 0) + correctEvidence.length * 80 + game.deductions.length * 45 - game.hintsUsed * 35 - game.wrongAccusations * 60 - Math.floor(Math.max(0, elapsedSeconds) / 60) * 2;
  const score = Math.max(100, Math.min(1000, raw));
  const result = {
    solved,
    score,
    rank: rankFor(score, solved),
    culpritCorrect,
    motiveCorrect,
    methodCorrect,
    correctEvidence,
    submittedEvidence,
    completedAt: now,
  };
  return {
    result,
    game: { ...game, completed: solved, wrongAccusations: solved ? game.wrongAccusations : game.wrongAccusations + 1, result, updatedAt: now },
  };
}

export function updateProfileAfterResult(profile, game, result) {
  const safe = { ...DEFAULT_PROFILE, ...(profile || {}) };
  if (!result.solved) return { ...safe, attempts: safe.attempts + 1 };
  const previous = safe.solved?.[game.caseId];
  const best = Math.max(previous?.bestScore || 0, result.score);
  return {
    ...safe,
    attempts: safe.attempts + 1,
    xp: safe.xp + Math.max(80, Math.round(result.score / 4)),
    solved: { ...safe.solved, [game.caseId]: { bestScore: best, rank: result.rank, solvedAt: result.completedAt } },
  };
}

export function fallbackReply(caseFile, suspectId, question) {
  const suspect = caseFile.suspects[suspectId];
  if (!suspect) return "I have nothing to say.";
  const terms = String(question || "").toLowerCase();
  const scored = suspect.questions.map((item, index) => ({ index, score: item.label.toLowerCase().split(/\W+/).filter((word) => word.length > 3 && terms.includes(word)).length }));
  scored.sort((a, b) => b.score - a.score);
  return suspect.questions[scored[0]?.score ? scored[0].index : 0].answer;
}

export function connectionKey(ids) {
  return [...ids].map(String).sort().join("::");
}

export function rankFor(score, solved = true) {
  if (!solved) return "Case remains open";
  if (score >= 900) return "The Zero Mark";
  if (score >= 760) return "Master Detective";
  if (score >= 620) return "Senior Inspector";
  return "Field Investigator";
}

function labelFor(caseFile, id) {
  return caseFile.clues.find((clue) => clue.id === id)?.label || id;
}

function unique(value) {
  return [...new Set(Array.isArray(value) ? value : [])];
}

function nonNegative(value) {
  return Math.max(0, Number(value) || 0);
}
