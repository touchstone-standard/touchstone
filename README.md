# @touchstonestandard/rubric — 0.3

This standalone package contains the Touchstone 0.3 rubric, dependency-free ESM scorer,
schemas, full specification and conformance fixtures. [TIP 0003](proposals/0003.md)
is accepted by the Chair. [CANDIDATE.json](CANDIDATE.json) retains preparation provenance
and links to the written adoption decision. Registry availability is recorded separately.

## Run locally

From this directory, using Node.js 22 or later:

```sh
npm test
npm pack
```

No dependencies or account are needed for tests. Extract the tarball and run
`npm test` inside `package/` to verify the standalone contents. Package version
`0.3.0` identifies this package; check the registry for availability.

```js
import { readFileSync } from 'node:fs';
import { score } from './scoring.mjs';
const rubric = JSON.parse(readFileSync(new URL('./rubric.json', import.meta.url)));
const result = score({ back: { defects: [{
  region: 'surface', depth: 'scratch', size: 'lt_1cm',
  severity: 'minor', x: 0.5, y: 0.5,
}] } }, rubric);
console.log(result.rubric_version, result.points, result.grade); // 0.3 972 10
```

Every damage type requires `de_minimis`, `minor`, `moderate` or `severe`.
Severity changes the deduction; type/depth and size remain separate inputs.
The low-level scorer uses its explicit rubric argument. A host must resolve and
enforce any input version pin and validate interchange inputs against the schema.
Existing assessments must continue to use their original versioned runtime.

## Contents and limits

- [RUBRIC.md](RUBRIC.md): complete tables, rounding, aggregation, input meaning
  and unresolved limitations.
- [rubric.json](rubric.json), [scoring.mjs](scoring.mjs), `schemas/`: executable
  arithmetic and interchange contracts; no service is needed.
- [test/vectors.json](test/vectors.json): fixed valid/invalid conformance cases.
  Test runners require only files included in this package.
- [test/input-semantics.json](test/input-semantics.json): synthetic stipulated
  conditions, not observed cards or a physical classifier.
- [CHANGELOG.md](CHANGELOG.md) and [proposal](proposals/0003.md):
  implementer impact, compatibility and the Chair decision.
- [CONTRIBUTING.md](CONTRIBUTING.md), [LICENSE](LICENSE), [NOTICE](NOTICE):
  governance, conformance claims, licensing and attribution.

Tests demonstrate encoded arithmetic, not whether a card was correctly inspected
or whether these deductions match another grader. There is no independent hard
grade-cap operation; apparent caps follow from deductions and the unchanged
grade ladder. This package performs no telemetry.
