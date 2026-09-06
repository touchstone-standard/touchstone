# Changelog

## 0.2 — September 6, 2026

### What changed and why

Touchstone now distinguishes a surface-layer gouge from a stock crease. The
earlier definition of `surface/deep` also described a crease or paper break,
overlapping the separate crease category. `deep` now means surface-layer
penetration without a stock fold or break. A light crease can have an intact
surface; a dent or isolated tear is not automatically a crease.

The release adds examples of permitted and excluded encodings, clarifies aliases
and one object per distinct flaw, and explains how products can develop their own
schemas and experiments ahead of standard adoption. Faithful mappings into a
published version remain distinct from experimental scoring interpretations.

### Effect on scores and existing assessments

No penalties, centering curves, multipliers, grade bands or aggregation rules
changed. The scorer and original arithmetic vectors are unchanged. Identical
encoded assessments produce identical numeric results; the version metadata
changes to 0.2 (npm package 0.2.0).

Classifying a physical finding differently can still change a new score. For
example, a back-face light crease scores 425 points / grade 4; the old overlapping
`surface/deep/dot` encoding scores 965 / 10. These are different encodings, not a
change to the penalty tables. Preserve original assessments and rubric artifacts;
record a new linked assessment when reinterpreting a finding. Consumers adopt
the new version explicitly; existing 0.1 pins do not migrate automatically.

### What this release does not establish

Passing the version's arithmetic vectors defines conformance under CONTRIBUTING.
It does not verify physical classification, observer/model accuracy or a complete
card inspection. The new examples are synthetic stated conditions, not real-card
accuracy evidence. Dents, some tear classifications, exact extent boundaries,
centering measurement position/window and borderline physical anchors remain
unresolved. No new empirical accuracy or full-coverage claim accompanies 0.2.

Sources: [0.2 specification](https://github.com/touchstone-standard/touchstone/blob/main/RUBRIC.md),
[input-semantics proposal and decision](https://github.com/touchstone-standard/touchstone/pull/1),
[conformance and contribution rules](https://github.com/touchstone-standard/touchstone/blob/main/CONTRIBUTING.md).

## 0.1 — July 28, 2026

Initial public-repository baseline: the scoring rubric, reference scorer, JSON
schemas and arithmetic conformance vectors. The date is the baseline commit
date; it is not a claim about a separate package-registry publication timestamp.

The original artifacts remain available for reproducing 0.1 assessments.
Source: [Touchstone 0.1 baseline](https://github.com/touchstone-standard/touchstone/tree/55ad2fc8ea0a4a43c38079c428c32f4e15d9eebe).
