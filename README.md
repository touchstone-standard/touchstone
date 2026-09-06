# @touchstonestandard/rubric

Touchstone 0.2 — unpublished proposal candidate (npm identity `0.2.0`).
Published 0.1 remains the released baseline; this checkout does not update hosted
consumers or announce a release. See the [draft TIP](proposals/draft-02-input-semantics.md)
and [implementer-impact note](CHANGELOG.md).
This package is the single source of truth: rubric numbers as data, a pure
dependency-free scorer, JSON Schemas, and the golden vectors that double as
the conformance suite. See `RUBRIC.md` for the human-readable rules.

## Quickstart

```js
import { score } from "./scoring.mjs";
import rubric from "./rubric.json" with { type: "json" }; // requires Node 20.10+ (import attributes)

const result = score(
  { back: { defects: [{ region: "corner", corner: "br", severity: "moderate" }] } },
  rubric,
);
console.log(result.points, result.grade); // 825 8
```

Run the frozen arithmetic vectors, semantic-contract checks and compatibility checks:

```
npm test
```

`score(input, rubric)` validates structurally (actionable errors like
`"front.defects[2]: requires x and y (normalized)"`) and runs unmodified in
Node, the browser, and Cloudflare Workers.
It cannot verify the physical classification of a flaw. Synthetic semantic
examples state their physical assumptions; their passing tests are not real-card
accuracy evidence. The candidate changes deep/crease meaning, not penalties.

## Consumers

- **A hosted web calculator** — imports `scoring.mjs` and `rubric.json`
  directly. A hosted consumer must pin and serve matching artifacts for the
  published version it claims; this local candidate leaves existing 0.1 pins alone.
- **A hosted MCP server** — exposes `score_card`, `get_rubric`, and
  `list_defect_types` as tools so people can grade cards through an AI chat.
  **Account-gated**: the hosted endpoint requires a free account API key
  (`Authorization: Bearer <key>`) for usage tracking and rate limits. The open
  package and reference scorer here remain runnable by anyone with zero
  account.
- **`test/vectors.json`** — the golden vectors, run via `node --test`; passing
  them demonstrates arithmetic conformance for the named published version.
  Candidate semantic-contract evidence is separate; 0.2 has not been adopted.

## File map

- `rubric.json` — every number: base points, centering curves, penalty
  tables, print-quality tables, grade bands. Publishing this file is
  publishing the standard.
- `scoring.mjs` — the reference scorer; interprets the rubric, no hardcoded
  penalties.
- `schemas/` — `assessment-input`, `rubric-config`, `score-result` JSON
  Schemas (the AI/MCP contract — descriptions are written for LLM
  consumption).
- `test/` — frozen `vectors.json`, synthetic `input-semantics.json`, and
  dependency-free test runners. All files needed by `npm test` ship together.
- `RUBRIC.md` — the normative prose.

Product schemas may evolve ahead of Touchstone. Version the mapping into a
published assessment contract, retain source/mapping/rubric provenance, and keep
experimental scoring interpretations distinct from faithful mappings. No new
mandatory public input fields or product-specific confirmation workflow are added.

## Telemetry

The hosted calculator logs anonymized scoring events (defect lists, grades,
optional card identity — never accounts or IPs) to improve the standard. The
MCP server, being account-gated, attributes its scoring events to the
caller's API key id instead (for usage tracking, not IP). This package itself
phones nothing home.

