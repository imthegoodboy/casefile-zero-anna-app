import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const playwrightRoot = process.env.PLAYWRIGHT_MODULE;
if (!playwrightRoot) throw new Error("Set PLAYWRIGHT_MODULE to a local Playwright package directory.");
const playwright = await import(pathToFileURL(join(playwrightRoot, "index.js")).href);
const { chromium } = playwright.default || playwright;
const base = process.env.CASEFILE_BASE || "http://localhost:5188/index.html";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(6000);
console.log("open desk");

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
assert.match(await page.locator("h1").first().innerText(), /Every room/);
console.log("open briefing");
await page.getByRole("link", { name: "Open first dossier" }).click();
await page.waitForTimeout(300);
assert.match(await page.locator("h1").first().innerText(), /Last Departure/);
console.log("start scene");
await page.locator('[data-action="start-case"]').click();
await page.waitForTimeout(500);
assert.match(await page.locator("body").innerText(), /Field notebook|0 of 6 found/);
console.log("inspect clues");

const caseData = await page.evaluate(async () => (await import("./data.js")).CASES.find((item) => item.id === "last-departure"));
for (const clue of caseData.clues) {
  await page.locator(`[data-action="inspect-clue"][data-id="${clue.id}"]`).click();
  await page.locator('[data-action="close-dialog"]').last().click();
}
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);
assert.equal(await page.locator('[data-action="inspect-clue"]').count(), 6, "all six clues survive a reload");
console.log("interview");

await page.goto(`${base}#/interview/reed`, { waitUntil: "networkidle" });
await page.locator('[data-action="ask-standard"][data-suspect="reed"][data-index="0"]').click();
assert.match(await page.locator("body").innerText(), /drafting room|access card/i);
await page.locator('form[data-suspect="reed"] input[name="question"]').fill("Where were you when the last train left?");
await page.locator('form[data-suspect="reed"] button[type="submit"]').click();
await page.waitForTimeout(200);
assert.match(await page.locator("body").innerText(), /Statement recorded|platform clock|departure/i);
await page.goto(`${base}#/interview/mara`, { waitUntil: "networkidle" });
await page.locator('[data-action="ask-standard"][data-suspect="mara"][data-index="0"]').click();
await page.waitForTimeout(200);
assert.match(await page.locator("body").innerText(), /catalogu|gallery|arrival/i);
console.log("board");

await page.goto(`${base}#/board`, { waitUntil: "networkidle" });
const [firstEvidence, secondEvidence] = caseData.connections[0].ids;
await page.locator(`[data-action="select-evidence"][data-id="${firstEvidence}"]`).click();
await page.locator(`[data-action="select-evidence"][data-id="${secondEvidence}"]`).click();
await page.waitForTimeout(250);
assert.match(await page.locator("body").innerText(), /deduction|archive contact/i);
console.log("accusation");

await page.goto(`${base}#/accuse`, { waitUntil: "networkidle" });
await page.locator(`input[name="culprit"][value="${caseData.solution.culprit}"]`).check({ force: true });
await page.locator(`input[name="motive"][value="${caseData.solution.motive}"]`).check({ force: true });
await page.locator(`input[name="method"][value="${caseData.solution.method}"]`).check({ force: true });
for (const evidence of caseData.solution.evidence.slice(0, 3)) await page.locator(`input[name="evidence"][value="${evidence}"]`).check({ force: true });
await page.locator('#accusation-form button[type="submit"]').click();
await page.waitForTimeout(700);
assert.match(await page.locator("body").innerText(), /The room gives way/);
console.log("mobile");

const mobile = await context.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await mobile.goto(base, { waitUntil: "networkidle" });
await mobile.waitForTimeout(500);
const widths = await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
assert.ok(widths.scroll <= widths.viewport + 1, `mobile page overflows horizontally: ${JSON.stringify(widths)}`);
await mobile.close();
await browser.close();
console.log("Casefile browser smoke passed: desk → briefing → scene → reload recovery → interview → evidence board → accusation → result, plus mobile overflow check.");
