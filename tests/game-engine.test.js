import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { CASES, CAST } from "../bundle/data.js";
import {
  DEFAULT_PROFILE,
  connectEvidence,
  createGame,
  discoverClue,
  evaluateAccusation,
  fallbackReply,
  investigationReadiness,
  isCompleteReply,
  normalizeReply,
  normalizeGame,
  recordQuestion,
  updateProfileAfterResult,
  useHint,
} from "../bundle/game-engine.js";

test("all four case files have complete, internally consistent playable content", () => {
  assert.equal(CASES.length, 4);
  const culprits = new Set();
  for (const caseFile of CASES) {
    assert.equal(caseFile.clues.length, 6, caseFile.id);
    assert.equal(caseFile.timeline.length, 6, caseFile.id);
    assert.equal(caseFile.connections.length, 4, caseFile.id);
    assert.equal(Object.keys(caseFile.suspects).length, 4, caseFile.id);
    assert.ok(caseFile.briefing.join(" ").length > 500, `${caseFile.id} needs a substantial briefing`);
    assert.ok(CAST[caseFile.solution.culprit], `${caseFile.id} culprit exists in cast`);
    assert.ok(caseFile.motives.includes(caseFile.solution.motive), `${caseFile.id} motive is selectable`);
    assert.ok(caseFile.methods.includes(caseFile.solution.method), `${caseFile.id} method is selectable`);
    const clueIds = new Set(caseFile.clues.map((clue) => clue.id));
    caseFile.solution.evidence.forEach((id) => assert.ok(clueIds.has(id), `${caseFile.id} solution evidence ${id} exists`));
    caseFile.connections.forEach((connection) => connection.ids.forEach((id) => assert.ok(clueIds.has(id), `${caseFile.id} connection evidence ${id} exists`)));
    Object.values(caseFile.suspects).forEach((suspect) => assert.equal(suspect.questions.length, 4));
    assert.ok(existsSync(join(process.cwd(), "bundle", caseFile.image.replace("./", ""))), `${caseFile.id} scene image exists`);
    culprits.add(caseFile.solution.culprit);
  }
  assert.equal(culprits.size, 4, "each recurring suspect leads exactly one case");
});

test("every case can be completed through the intended discovery, interview, connection, and accusation loop", () => {
  for (const caseFile of CASES) {
    let game = createGame(caseFile.id, 1_000);
    for (const clue of caseFile.clues) game = discoverClue(game, clue.id, 2_000).game;
    game = recordQuestion(game, "reed", 0);
    game = recordQuestion(game, "mara", 0);
    const firstConnection = caseFile.connections[0];
    const link = connectEvidence(game, firstConnection.ids[0], firstConnection.ids[1], 3_000);
    assert.equal(link.status, "new", caseFile.id);
    game = link.game;
    const ready = investigationReadiness(game);
    assert.equal(ready.canAccuse, true, caseFile.id);
    const accusation = {
      culprit: caseFile.solution.culprit,
      motive: caseFile.solution.motive,
      method: caseFile.solution.method,
      evidence: caseFile.solution.evidence.slice(0, 3),
    };
    const outcome = evaluateAccusation(game, accusation, 600, 4_000);
    assert.equal(outcome.result.solved, true, caseFile.id);
    assert.equal(outcome.game.completed, true, caseFile.id);
    assert.ok(outcome.result.score >= 100 && outcome.result.score <= 1000, caseFile.id);
  }
});

test("unsupported evidence pairs and incomplete accusations never close a case", () => {
  const caseFile = CASES[0];
  let game = createGame(caseFile.id);
  game = discoverClue(game, "glove").game;
  game = discoverClue(game, "cup").game;
  game = discoverClue(game, "ticket").game;
  const invalidLink = connectEvidence(game, "glove", "ticket");
  assert.equal(invalidLink.status, "no-match");
  const outcome = evaluateAccusation(game, {
    culprit: "reed",
    motive: caseFile.solution.motive,
    method: caseFile.solution.method,
    evidence: ["glove", "cup"],
  });
  assert.equal(outcome.result.solved, false);
  assert.equal(outcome.game.completed, false);
  assert.equal(outcome.game.wrongAccusations, 1);
});

test("hints are useful, tracked, and reduce the final score", () => {
  const caseFile = CASES[1];
  let clean = createGame(caseFile.id, 0);
  for (const clue of caseFile.clues) clean = discoverClue(clean, clue.id).game;
  clean = recordQuestion(clean, "reed", 0);
  clean = recordQuestion(clean, "mara", 0);
  clean = connectEvidence(clean, ...caseFile.connections[0].ids).game;
  const hinted = useHint(clean);
  assert.equal(hinted.game.hintsUsed, 1);
  assert.ok(hinted.hint.length > 20);
  const accusation = { culprit: caseFile.solution.culprit, motive: caseFile.solution.motive, method: caseFile.solution.method, evidence: caseFile.solution.evidence.slice(0, 3) };
  assert.ok(evaluateAccusation(clean, accusation).result.score > evaluateAccusation(hinted.game, accusation).result.score);
});

test("saved games are sanitized before hydration", () => {
  const normalized = normalizeGame({
    caseId: "last-departure",
    discovered: ["glove", "not-real", "glove"],
    interviews: { mara: ["0", "0"], ghost: ["3"] },
    conversation: { mara: [{ role: "detective", text: "x".repeat(5000) }, { role: "intruder", text: "nope" }] },
    links: ["glove::ledger", "fake::pair"],
    hintsUsed: -9,
  });
  assert.deepEqual(normalized.discovered, ["glove"]);
  assert.deepEqual(normalized.interviews, { mara: ["0"] });
  assert.deepEqual(normalized.links, ["glove::ledger"]);
  assert.equal(normalized.hintsUsed, 0);
  assert.equal(normalized.conversation.mara.length, 1);
  assert.equal(normalized.conversation.mara[0].text.length, 1200);
  assert.equal(normalized.result, null);
  assert.ok(JSON.stringify(normalized).length < 12_000);
});

test("offline custom questions return a case-safe recorded response", () => {
  const answer = fallbackReply(CASES[0], "mara", "What time was your train ticket punched?");
  assert.match(answer, /ticket|punch|departure/i);
  assert.equal(fallbackReply(CASES[0], "unknown", "hello"), "I have nothing to say.");
});

test("custom suspect replies must be complete dialogue, not truncated model fragments", () => {
  assert.equal(isCompleteReply("What he knows/Situation):* We had a professional"), false);
  assert.equal(isCompleteReply("We had a professional arrangement, but I never saw him after midnight."), true);
  assert.equal(normalizeReply("  We had a professional\narrangement.  "), "We had a professional\narrangement.");
});

test("solved cases update XP and preserve the best score", () => {
  const game = createGame("last-departure");
  const first = updateProfileAfterResult(DEFAULT_PROFILE, game, { solved: true, score: 740, rank: "Senior Inspector", completedAt: 10 });
  const second = updateProfileAfterResult(first, game, { solved: true, score: 620, rank: "Senior Inspector", completedAt: 20 });
  assert.equal(second.solved[game.caseId].bestScore, 740);
  assert.ok(second.xp > first.xp);
  assert.equal(second.attempts, 2);
});
