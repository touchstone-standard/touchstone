import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const text = (p) => readFile(new URL(p, import.meta.url), "utf8");
const hash = (s) => createHash("sha256").update(s).digest("hex");
// Frozen at published 0.1 commit 55ad2fc8ea0a4a43c38079c428c32f4e15d9eebe.
// Line-ending normalization permits Windows and Unix checkouts of the same blob.
for (const [path, digest] of [
  ["../scoring.mjs", "dcc926c57d28f7d0f65a27e09aa4e2945717a57bae9dadc29655980a5af533bd"],
  ["./vectors.json", "852cafd3807658a7237c48ce019e31c4b36701e361c236f597fe8200ff883051"],
]) {
  test(`0.1 reproduction: unchanged ${path}`, async () => {
    assert.equal(hash((await text(path)).replaceAll("\r\n", "\n")), digest);
  });
}
test("0.1 reproduction: rubric configuration changes identity only", async () => {
  const config = JSON.parse(await text("../rubric.json"));
  delete config.$schema;
  delete config.rubric_version;
  assert.equal(hash(JSON.stringify(config)), "1eb958b41b62eb73506c26d963a887880c5d45079ba323da5ac84e3a1b5316b1");
});
