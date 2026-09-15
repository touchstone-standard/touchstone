import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { score, ScoreError } from '../scoring.mjs';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const rubric = read('../rubric.json');
const vectors = read('./vectors.json');
const order = xs => xs.map(x => JSON.stringify({ face:x.face, region:x.region,
  ...(x.attribute ? { attribute:x.attribute } : {}), penalty:x.penalty })).sort();

for (const v of vectors.valid) test(`0.3 vector: ${v.name}`, () => {
  const result = score(v.input, rubric);
  for (const [key, expected] of Object.entries(v.expect)) assert.deepEqual(result[key], expected, key);
  assert.deepEqual(result.faces, v.expected_output.faces);
  assert.deepEqual(order(result.line_items), order(v.expected_output.line_items));
});

for (const v of vectors.invalid) test(`0.3 refusal: ${v.name}`, () => {
  assert.throws(() => score(v.input, rubric), e => e instanceof ScoreError && e.message.includes(v.error_includes));
});

test('all 96 surface combinations strictly increase deduction at fixed basis', () => {
  for (const face of ['front','back']) for (const depth of ['surface','scratch','deep']) {
    for (const size of ['dot','lt_1cm','lt_5cm','full_card']) {
      const deductions = ['de_minimis','minor','moderate','severe'].map(severity =>
        score({[face]:{defects:[{region:'surface',depth,size,severity,x:.5,y:.5}]}},rubric).line_items[0].penalty);
      assert.ok(deductions.every((p,i) => p > 0 && (!i || p > deductions[i-1])));
    }
  }
});

test('custom print configuration preserves double gate and four-region support', () => {
  const custom = structuredClone(rubric);
  delete custom.print_attributes;
  assert.throws(() => score({back:{defects:[{region:'print_defect',severity:'minor',x:.5,y:.5}]}},custom), /print requires|print_defect requires/);
  assert.throws(() => score({back:{print:{}}},custom), /print requires/);
  delete custom.print_defect_penalties;
  assert.deepEqual(Object.keys(score({},custom).faces.front.regions), ['centering','corners','edges','surface']);
  assert.equal(score({back:{defects:[{region:'crease',severity:'minor',x:.5,y:.5}]}},custom).points,325);
});

test('scalar centering branch remains available with one final rounding', () => {
  const custom = structuredClone(rubric);
  delete custom.centering.front_curve;
  delete custom.centering.back_curve;
  custom.centering.front_slope = 10;
  custom.centering.back_slope = 2;
  assert.equal(score({front:{centering:{lr_pct:55}}},custom).points,950);
  assert.equal(score({back:{centering:{lr_pct:90}}},custom).points,920);
});
