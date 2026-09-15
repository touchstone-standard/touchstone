import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../',import.meta.url);
const text = p => readFileSync(new URL(p,root),'utf8').replaceAll('\r\n','\n');
const json = p => JSON.parse(text(p));

test('package identity and candidate provenance do not claim an upstream release', () => {
  assert.equal(json('package.json').version,'0.3.0');
  assert.equal(json('rubric.json').rubric_version,'0.3');
  const candidate=json('CANDIDATE.json');
  assert.equal(candidate.status,'unpublished-candidate');
  assert.equal(candidate.upstream_release,null);
  for(const [file,want]of Object.entries(candidate.sha256_lf))
    assert.equal(createHash('sha256').update(text(file)).digest('hex'),want,file);
});

test('published file allowlist excludes repository-only test directories', () => {
  const files=json('package.json').files;
  assert.ok(files.every(p => !p.endsWith('/') && !p.includes('*')));
  assert.deepEqual(files.filter(p => p.startsWith('test/')).sort(),[
    'test/input-semantics.json','test/input-semantics.test.mjs','test/package.test.mjs',
    'test/schema-contract.test.mjs','test/scoring.test.mjs','test/vectors.json']);
});

test('TIP has the five required sections in order and does not claim acceptance', () => {
  const tip=text('proposals/common-severity.md');
  assert.deepEqual([...tip.matchAll(/^## (.+)$/gm)].map(m=>m[1]),[
    'Motivation','Specification','Rationale and Alternatives','Backward Compatibility','Reference Implementation']);
  assert.match(tip,/Status: draft/);
  assert.match(tip,/remaining Chair action/);
});

test('all relative Markdown links resolve inside the standalone package', () => {
  const paths=['README.md','RUBRIC.md','CHANGELOG.md',...readdirSync(new URL('proposals/',root)).filter(n=>n.endsWith('.md')).map(n=>'proposals/'+n)];
  for(const path of paths) for(const m of text(path).matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|#)/.test(m[1])) continue;
    const target=new URL(m[1].split('#')[0],new URL(path,root));
    assert.ok(target.href.startsWith(root.href),`${path}: link escapes package`);
    assert.ok(existsSync(target),`${path}: ${m[1]}`);
  }
});
