// Editorial checks only; these do not add to the frozen conformance vectors.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const errata = () => readFileSync(new URL("ERRATA-0.2.md", root), "utf8");

test("0.2 errata is dated, discoverable, and identifies the unchanged release", () => {
  const text = errata();
  assert.match(text, /2026-09-06/);
  assert.match(text, /9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8/);
  assert.match(text, /explanatory addendum, not a new rubric version/);
  assert.match(text, /ties toward positive infinity/);
  assert.match(text, /penalties sum within that face's `print` region/);
  assert.match(text, /Within the corner and edge severity classes/);
  assert.match(text, /Existing recorded results remain unchanged/);
  assert.match(readFileSync(new URL("README.md", root), "utf8"), /\]\(ERRATA-0\.2\.md\)/);
});

test("errata's published reproduction runs against the released scorer", () => {
  const blocks = [...errata().matchAll(/```js\r?\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 1, "one complete runnable reproduction");
  const run = spawnSync(process.execPath, ["--input-type=module", "-"], {
    cwd: root, input: blocks[0][1], encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /All errata examples match Touchstone 0\.2/);
});
