import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { score, ScoreError } from '../scoring.mjs';
const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url),'utf8'));
const rubric = read('../rubric.json');
for (const c of read('./input-semantics.json').cases) test(`stipulated meaning: ${c.id}`, () => {
  assert.ok(c.condition && c.excluded_reason);
  if (c.error_includes) assert.throws(() => score(c.input,rubric),e => e instanceof ScoreError && e.message.includes(c.error_includes));
  else {
    const result=score(c.input,rubric);
    for (const [key,value] of Object.entries(c.expect)) assert.equal(result[key],value);
  }
});
