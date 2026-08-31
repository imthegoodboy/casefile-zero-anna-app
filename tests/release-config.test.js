import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const readJson = (file) => JSON.parse(readFileSync(join(root, file), "utf8"));

test("release metadata and permission declaration stay aligned", () => {
  const app = readJson("app.json");
  const pkg = readJson("package.json");
  const lock = readJson("package-lock.json");
  const manifest = readJson("manifest.json");
  assert.equal(app.version, pkg.version);
  assert.equal(app.version, lock.packages[""].version);
  assert.equal(app.version, "1.0.2");
  assert.deepEqual(manifest.ui.host_api.agent.session, { auto: true, fixed: { client_ids: [] } });
  assert.deepEqual(manifest.ui.host_api.agent.tools, []);
  assert.deepEqual(manifest.required_executas, []);
  assert.equal(app.screenshots.length, 6);
  app.screenshots.forEach((file) => assert.ok(existsSync(join(root, file)), `missing listing screenshot: ${file}`));
});
