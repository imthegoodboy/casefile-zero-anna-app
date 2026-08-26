import { pathToFileURL } from "node:url";
import { join } from "node:path";

const playwrightModule = process.env.PLAYWRIGHT_MODULE || "playwright";
const playwright = await import(playwrightModule === "playwright" ? playwrightModule : pathToFileURL(join(playwrightModule, "index.js")).href);
const { chromium } = playwright.default || playwright;

const base = process.env.CASEFILE_BASE || "http://localhost:5188/index.html";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 });
const page = await context.newPage();
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await page.screenshot({ path: "bundle/listing/desk.png" });

await page.evaluate(async () => {
  const engine = await import("./game-engine.js");
  const data = await import("./data.js");
  let game = engine.createGame("last-departure", Date.now() - 420000);
  for (const clue of data.CASES.find((item) => item.id === "last-departure").clues) game = engine.discoverClue(game, clue.id).game;
  game = engine.recordQuestion(game, "reed", 0, "The platform clock was wrong.");
  game = engine.recordQuestion(game, "mara", 0, "I was cataloguing arrivals.");
  game = engine.connectEvidence(game, "glove", "ledger").game;
  localStorage.setItem("casefile-zero:active:v1", JSON.stringify(game));
  location.hash = "#/board";
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "bundle/listing/board.png" });

await page.evaluate(async () => {
  const engine = await import("./game-engine.js");
  const data = await import("./data.js");
  const caseFile = data.CASES.find((item) => item.id === "last-departure");
  let game = engine.createGame(caseFile.id, Date.now() - 420000);
  for (const clue of caseFile.clues) game = engine.discoverClue(game, clue.id).game;
  game = engine.recordQuestion(game, "reed", 0, caseFile.suspects.reed.questions[0].answer);
  game = engine.recordQuestion(game, "mara", 0, caseFile.suspects.mara.questions[0].answer);
  game = engine.connectEvidence(game, ...caseFile.connections[0].ids).game;
  const outcome = engine.evaluateAccusation(game, { culprit: caseFile.solution.culprit, motive: caseFile.solution.motive, method: caseFile.solution.method, evidence: caseFile.solution.evidence.slice(0, 3) }, 240);
  localStorage.setItem("casefile-zero:active:v1", JSON.stringify(outcome.game));
  localStorage.setItem("casefile-zero:profile:v1", JSON.stringify(engine.updateProfileAfterResult(engine.DEFAULT_PROFILE, outcome.game, outcome.result)));
  location.hash = "#/result";
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "bundle/listing/result.png" });
await browser.close();
