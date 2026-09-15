# Changelog

## 0.3 — September 14, 2026

Accepted by the Chair in TIP 0003. Rubric
`0.3`; package metadata `0.3.0`. See the [TIP 0003](proposals/0003.md).

### Scoring and inputs

All six defect channels require `de_minimis`, `minor`, `moderate`, `severe`.
Surface scores severity with factors 0.25/0.5/1/2 against its existing depth-by-size
basis. The complete product, including face multiplier, rounds once. Missing
severity and old channel-specific severity words fail.

Corner/edge numbers are retained, with top rung `severe`. Crease uses
575/675/775/875; front stain 675/725/775/875; back stain 75/275/475/775;
print defect 25/75/275/675. No second generic face multiplier applies to these
absolute tables. Crease extent no longer supplies an ordinal severity.

Centering, depth/size basis, print attributes, region sums, floor, bottleneck,
tie order, grade ladder and condition bands remain unchanged. The specification
incorporates the 0.2 errata explanations: positive half-up rounding, additive
global/local print deductions, and the corner/edge-only scope of the de-minimis
grade-10 rule. No independent hard grade ceiling is introduced.

### Implementer impact and existing grades

An old back `scratch/lt_1cm` without severity yielded 945 / grade 9 under 0.2;
it is invalid under 0.3. A new minor judgment yields 972 / 10; severe yields
890 / 8.5. An old surface scorer may ignore an added severity field, so hosts
must dispatch by explicit version. Distinguishing vectors pin the new deduction
and refusal independently of version metadata.

Adopt matching code, rubric and schemas, capture explicit severity, and freeze
old execution before changing defaults. There is no lossless ordinal mapping of
old crease/stain/print severities or missing surface severity. Accepted grades
remain unchanged; reinterpretation is a new identified assessment/result.

### Evidence and publication

The standalone suite includes fixed vectors and synthetic input-meaning examples.
No empirical physical-accuracy, observer-agreement or competitor-equivalence claim
is made. Numeric policy adoption by a product is distinct from the upstream Chair's
written decision and publication. No public commit or registry identity has been
invented for this candidate.

## Historical releases

0.2, September 6, 2026, narrowed gouge versus stock-crease meaning without changing
arithmetic. 0.1 was the initial release. Their published artifacts/tags remain
unchanged; this package does not replace their frozen execution or stored results.
