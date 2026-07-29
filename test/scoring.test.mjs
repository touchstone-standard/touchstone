import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { score, ScoreError } from "../scoring.mjs";

// The standard's own vectors, plus every alternate config that happens to be
// present. Alternates are DISCOVERED, never listed by hand: this file also
// ships in the public bundle, where `test/fixtures/` deliberately does not
// exist. A hardcoded list would mean two copies of this harness, and two
// copies drift. A missing directory simply yields no alternates — the
// standard's suite alone, which is the correct published behaviour and needs
// no second file to express it.
//
// What the alternates buy, and why they are NOT old versions: they are the
// only coverage of rubric shapes the standard's own rubric never takes — the
// scalar centering branch, and the four-region no-print result (`regionsFor`,
// plus the print double-gate whose own comment says not to drop it). Per-set
// rubrics are new instances of the same schema, so that is the property they
// rest on. A fixture whose paired `.vectors.json` is missing throws here, at
// load, on purpose.
const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), "utf8"));
const shape = (r) =>
  `${r.centering.front_curve ? "curve" : "scalar"} centering, ${r.print_attributes ? "print" : "no print"}`;

const suites = [{
  label: "Touchstone 0.1",
  rubric: await load("../rubric.json"),
  vectors: await load("./vectors.json"),
}];

let entries = [];
try {
  entries = await readdir(new URL("./fixtures/", import.meta.url));
} catch {
  /* no fixtures/ — the published bundle. Not an error. */
}
for (const name of entries.filter((n) => n.endsWith(".json") && !n.endsWith(".vectors.json")).sort()) {
  const rubric = await load(`./fixtures/${name}`);
  const vectors = await load(`./fixtures/${name.replace(/\.json$/, ".vectors.json")}`);
  suites.push({ label: `${rubric.rubric_id} (${shape(rubric)})`, rubric, vectors });
}

for (const { label, rubric, vectors } of suites) {
  for (const v of vectors.valid) {
    test(`${label} vector: ${v.name}`, () => {
      const r = score(v.input, rubric);
      for (const [k, want] of Object.entries(v.expect)) {
        // grade_label is NON-NORMATIVE presentation, so conformance must not turn on
        // it — in ANY suite. What the frozen alternate sets prove is that a different
        // rubric config still SCORES correctly under the current engine; that is a
        // claim about the arithmetic, not about a display string. Skipping the
        // comparison here (rather than editing the frozen expects) is what lets those
        // files stay byte-identical. The label's own shape is unit-tested in
        // rubric.test.mjs, where it belongs — our implementation, not the standard.
        if (k === "grade_label") continue;
        assert.equal(r[k], want, k);
      }
    });
  }
  for (const v of vectors.invalid) {
    test(`${label} invalid: ${v.name}`, () => {
      assert.equal(typeof v.error_includes, "string");
      assert.throws(() => score(v.input, rubric), (e) => e instanceof ScoreError && e.message.includes(v.error_includes));
    });
  }
}
