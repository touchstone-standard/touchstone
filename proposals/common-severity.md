# TIP draft: common damage severity for 0.3

Status: draft, September 14, 2026. No upstream PR number, public Chair decision,
release tag or published source commit has been assigned. Existing product
implementation supplies this candidate's arithmetic. Numeric product adoption
is distinct from upstream standard adoption.

## Motivation

The 0.2 surface channel uses depth and size; an independent severity observation
cannot affect its deduction. Other channels have unrelated vocabularies, and
crease words mix physical condition with extent. A common four-choice scale
cannot honestly be achieved by renaming those ordinal lists.

Consider a synthetic card with a back scratch classified `lt_1cm`. The 0.2
deduction is 55 whether local appearance is faint or pronounced. Here a newly
judged minor example deducts 28; severe deducts 110, retaining type and extent.
These stipulated examples are not empirical observations or accuracy evidence.

## Specification

Every defect requires `de_minimis`, `minor`, `moderate` or `severe`. Surface
deduction is half-up of the existing depth-by-size basis multiplied by
0.25/0.5/1/2 respectively and front 1.3/back 1, rounded once. Corner/edge retain
their numbers under this common set. Crease uses 575/675/775/875; stain front
675/725/775/875 and back 75/275/475/775; print defect 25/75/275/675. These latter
tables are absolute, without an extra generic face multiplier. Other aggregation
and grade rules remain unchanged. [RUBRIC.md](../RUBRIC.md) contains the complete
normative specification and schemas define the interchange contract.

The words express intensity within the established type, not equal impact across
types. Surface severity is not a repeated charge for the same depth or extent.
One physical flaw receives one located-defect deduction. The mildest crease's
grade 4 and front stain's grade 3 are deduction consequences, not independent
maximum-grade operations.

## Rationale and Alternatives

Retaining the surface basis and crease/stain minimum deductions limits scoring
changes while making each choice consequential. An observation-only field would
not change scoring. Ordinal renaming falsely equates extent/physical criteria
with intensity. Using corner penalties for all types discards existing physical
distinctions. Hard ceilings would be a separate arithmetic change and are excluded.
No competitor's published ceiling establishes the correctness of these values.

Qualitative anchors and factors remain policy choices requiring further specimen
evidence and observer-agreement evaluation. Conformance does not settle empirical
questions. Extent/centering measurands, dents/tears and counting remain limitations.

## Backward Compatibility

Missing surface severity and old `heavy`, `light`, `full_card`, `through_layers`,
`very_slight`, `slight`, `obvious`, `blemish` severity tokens are invalid in 0.3.
Historical 0.1/0.2 observations retain their original schema, scorer and rubric.
Do not assign moderate to old surface findings because its factor is 1 or map
old crease levels by list position. Reassessment requires a new judgment/result.

New minor back `scratch/lt_1cm` gives 972 / 10; severe gives 890 / 8.5. Under
0.2 the class without severity gave 945 / 9. A crease formerly called `heavy`
deducted 825; new moderate and severe deduct 775 and 875. The old word does not
choose between them. Hosts must enforce version dispatch: the low-level function
does not resolve the optional `rubric` pin, and old surface scoring ignores the
new severity field. Preserve original evidence, bytes and grades.

## Reference Implementation

[scoring.mjs](../scoring.mjs), [rubric.json](../rubric.json) and `schemas/` implement
the candidate. `npm test` runs within the extracted package. The fixed vector
`surface back scratch lt_1cm minor` yields 972 / 10; `surface missing severity`
is a refusal. These distinguish 0.3 from 0.2's 945 / 9 and acceptance independently
of version-label changes. Rounding, stain asymmetry, legacy refusals and region
saturation are included too. Synthetic input-meaning cases are not a classifier.

The remaining Chair action is a written decision in the public proposal PR with
reasons, naming the reviewed artifacts and distinguishing evidence and addressing
the stated physical-evidence limits. Only then can the TIP be marked accepted
and an authorized release receive a real upstream identity. This draft does not
supply or impersonate the Chair's decision.
