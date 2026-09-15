import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const input = read('../schemas/assessment-input.schema.json');
const rubric = read('../rubric.json');
const config = read('../schemas/rubric-config.schema.json');
const levels = ['de_minimis', 'minor', 'moderate', 'severe'];

test('every channel requires the same explicit severity', () => {
  for (const branch of input.$defs.defect.allOf) {
    assert.ok(branch.then.required.includes('severity'));
    const ref = branch.then.properties.severity.$ref.split('/').at(-1);
    assert.deepEqual(input.$defs[ref].enum, levels);
  }
  for (const name of ['corner_penalties', 'edge_penalties', 'crease_penalties', 'stain_penalties', 'print_defect_penalties', 'surface_severity_factors']) {
    assert.deepEqual(Object.keys(rubric[name]), levels, name);
    assert.deepEqual(config.properties[name].required, levels, name);
  }
});

test('schema prose describes 0.3 rather than the disjoint legacy vocabularies', () => {
  const prose = JSON.stringify(input);
  assert.doesNotMatch(prose, /DISJOINT|disjoint|moderate\/heavy|default@0\.2/);
  assert.match(input.$defs.defect.properties.severity.description, /severe/);
  assert.match(input.$defs.defect.$comment, /surface requires severity/);
});
