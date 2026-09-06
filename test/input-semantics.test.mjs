import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { score, ScoreError } from "../scoring.mjs";

const text = (p) => readFile(new URL(p, import.meta.url), "utf8");
const rubric = JSON.parse(await text("../rubric.json"));
const schema = JSON.parse(await text("../schemas/assessment-input.schema.json"));
const prose = await text("../RUBRIC.md");
const examples = JSON.parse(await text("./input-semantics.json"));

// These checks pin the semantic correction in both normative representations.
// They do not interpret arbitrary prose, inspect a card, or extend score() inputs.
for (const [name, definition] of [
  ["schema", schema.$defs.defect.properties.depth.description],
  ["rubric", prose.slice(prose.indexOf("## Surface defects"), prose.indexOf("## Line endpoints"))],
]) {
  test(`${name}: deep excludes the old crease/paper-break interpretation`, () => {
    assert.doesNotMatch(definition, /deep[`:*\s]+a crease or\s+break in the paper/i);
    assert.match(definition, /surface-layer penetration/i);
    assert.match(definition, /without a stock fold or break/i);
  });
}
test("light crease retains intact-surface meaning; a paper split still requires a crease", () => {
  const definition = schema.$defs.crease_severity.description;
  assert.match(definition, /light: a single light stock fold.*surface remains intact/i);
  assert.match(definition, /through_layers: the crease breaks through the card's layers/i);
});

// The encodings below are answers for STATED conditions, not outputs of a
// classifier. Excluded means semantically wrong for that condition, not invalid
// JSON. Exercising those alternatives demonstrates score() cannot police truth.
for (const example of examples.cases) {
  test(`stated-condition contract: ${example.id}`, () => {
    assert.ok(example.condition && example.reason);
    const row = prose.split(/\r?\n/).find((line) => line.startsWith(`| ${example.id} |`));
    assert.ok(row, "normative example row must accompany its executable encoding");
    const encoding = (d) => [d.region, d.depth ?? d.severity, d.size].filter(Boolean).join("/");
    const cells = row.split("|").map((s) => s.trim());
    assert.equal(cells[3], example.permitted ? encoding(example.permitted) : "unsupported");
    assert.equal(cells[4], example.excluded.map(encoding).join(", "));
    if (example.permitted) {
      const result = score({ back: { defects: [example.permitted] } }, rubric);
      assert.equal(result.points, example.expect.points);
      assert.equal(result.grade, example.expect.grade);
      assert.equal(cells[5], `${result.points} / ${result.grade}`, "displayed points/grade must match the scorer");
    } else {
      assert.throws(() => score({ back: { defects: [example.unsupported] } }, rubric), ScoreError);
      assert.equal(cells[5], "No supported score");
    }
    for (const excluded of example.excluded) {
      assert.doesNotThrow(() => score({ back: { defects: [excluded] } }, rubric));
      assert.notDeepEqual(excluded, example.permitted);
    }
  });
}
