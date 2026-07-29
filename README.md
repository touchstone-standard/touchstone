# @touchstonestandard/rubric

Touchstone 0.1 — the executable open standard for card condition scoring.
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

Run the golden vectors:

```
npm test
```

`score(input, rubric)` validates structurally (actionable errors like
`"front.defects[2]: requires x and y (normalized)"`) and runs unmodified in
Node, the browser, and Cloudflare Workers.

## Consumers

- **A hosted web calculator** — imports `scoring.mjs` and `rubric.json`
  directly, so the page's math is provably the published spec.
- **A hosted MCP server** — exposes `score_card`, `get_rubric`, and
  `list_defect_types` as tools so people can grade cards through an AI chat.
  **Account-gated**: the hosted endpoint requires a free account API key
  (`Authorization: Bearer <key>`) for usage tracking and rate limits. The open
  package and reference scorer here remain runnable by anyone with zero
  account.
- **`test/vectors.json`** — the golden vectors, run via `node --test`; passing
  them is the conformance bar for any implementation of this rubric.

## File map

- `rubric.json` — every number: base points, centering curves, penalty
  tables, print-quality tables, grade bands. Publishing this file is
  publishing the standard.
- `scoring.mjs` — the reference scorer; interprets the rubric, no hardcoded
  penalties.
- `schemas/` — `assessment-input`, `rubric-config`, `score-result` JSON
  Schemas (the AI/MCP contract — descriptions are written for LLM
  consumption).
- `test/` — `vectors.json` (the golden vectors) + the `node --test` runner.
- `RUBRIC.md` — the normative prose.

## Telemetry

The hosted calculator logs anonymized scoring events (defect lists, grades,
optional card identity — never accounts or IPs) to improve the standard. The
MCP server, being account-gated, attributes its scoring events to the
caller's API key id instead (for usage tracking, not IP). This package itself
phones nothing home.

