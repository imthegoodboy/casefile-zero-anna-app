import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const playwrightRoot = process.env.PLAYWRIGHT_MODULE;
if (!playwrightRoot) throw new Error("Set PLAYWRIGHT_MODULE to a local Playwright package directory.");
const playwright = await import(pathToFileURL(join(playwrightRoot, "index.js")).href);
const { chromium } = playwright.default || playwright;
const base = process.env.CASEFILE_HARNESS || "http://localhost:5188/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(8000);

await page.goto(base, { waitUntil: "networkidle" });
const frame = page.frameLocator("#app");
await frame.locator("#workspace").waitFor();
await page.waitForTimeout(700);

console.log("detective selection");
await frame.getByRole("link", { name: "Detective", exact: true }).click();
await frame.locator('[data-action="select-detective"][data-id="malik"]').click();
assert.equal(await frame.locator('.detective-option[aria-pressed="true"]').count(), 1);
assert.match(await frame.locator("#detective-selection-summary").innerText(), /Malik Stone/);
assert.match(await frame.locator('.detective-option[aria-pressed="true"]').innerText(), /Selected detective/i);
await frame.locator('[data-action="select-accent"][data-id="sage"]').click();
assert.equal(await frame.locator('.swatch[aria-pressed="true"]').getAttribute("data-id"), "sage");
assert.match(await frame.locator(".accent-preview").innerText(), /Night sage|softens found markers/i);
assert.equal(await frame.locator("html").evaluate((html) => getComputedStyle(html).getPropertyValue("--accent").trim()), "#718070");

console.log("immediate custom question and complete response");
await frame.locator('a[href="#/desk"][data-nav="desk"]').click({ force: true });
await frame.getByRole("link", { name: "Open first dossier" }).click();
await frame.locator('[data-action="start-case"]').click();
await frame.locator('a[href="#/suspects"]').first().click();
await frame.locator('a[href="#/interview/reed"]').click();
const custom = "Where were you when the last train left?";
const input = frame.locator('form[data-suspect="reed"] input[name="question"]');
await input.fill(custom);
const immediateQuestion = await frame.locator('form[data-suspect="reed"]').evaluate((form) => {
  form.requestSubmit();
  return document.querySelector(".message.pending")?.textContent || "";
});
assert.match(immediateQuestion, new RegExp(custom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
await page.waitForTimeout(300);
const transcript = await frame.locator("#transcript").innerText();
assert.match(transcript, /Where were you when the last train left\?/);
assert.doesNotMatch(transcript, /What he knows\/Situation\).*professional$/i);
assert.ok((await frame.locator("#transcript .message.suspect").count()) >= 1);

console.log("mobile layout");
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);
const dimensions = await frame.locator("body").evaluate((body) => ({ scrollWidth: body.scrollWidth, clientWidth: body.clientWidth }));
assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1, `mobile page overflows horizontally: ${JSON.stringify(dimensions)}`);

await browser.close();
console.log("Casefile review smoke passed: persistent detective/accent state, immediate custom question, complete fallback response, and mobile overflow check.");
