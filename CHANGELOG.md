# Changelog

## 0.2 candidate — unreleased

Proposed September 6, 2026; not adopted or published. See the draft TIP.

### Implementer impact

`surface/deep` now describes a surface-layer gouge without a stock fold or break;
stock creases use the crease ladder, including light creases with intact surfaces.
Update interpretation/mapping guidance and schema descriptions together. No field,
enum, required property, penalty, curve, multiplier, band or aggregation changes.
The reference scorer and original arithmetic vectors are unchanged. Rubric/schema
identity becomes 0.2; npm identity becomes 0.2.0. Existing 0.1 consumers stay pinned.

Identical encoded assessments produce identical numeric results. Reclassifying
the same physical finding may change its grade: the stated light-crease example
is 425/4, whereas the old overlapping deep/dot route gives 965/10. Do not call
the interpretation change score-neutral. Preserve old artifacts/assessments and
record a new linked assessment when applying a new interpretation.

Adds synthetic semantic-contract evidence, faithful-mapping/experimental-product
guidance, and explicit dent, extent, centering and physical-anchor limitations.
These examples do not establish real-card validity or adoption readiness.

## 0.1 — published baseline

Retained at commit `55ad2fc8ea0a4a43c38079c428c32f4e15d9eebe` (npm 0.1.0).
This candidate does not rewrite the published artifacts or historical scores.
