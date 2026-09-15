# Touchstone 0.3

September 14, 2026 candidate. **Not yet an upstream published release.** This is the complete proposed normative specification for the adjacent scorer and rubric. Package version `0.3.0` is candidate package metadata; the rubric version is `0.3`. See [the proposal](proposals/common-severity.md), [changelog](CHANGELOG.md) and [candidate provenance](CANDIDATE.json).

Touchstone turns an encoded card-condition assessment into points and a grade. Its open arithmetic does not determine whether an assessment is physically true, complete, or obtained with an accurate instrument. MUST, MUST NOT and MAY identify requirements and permissions. The numeric rules below describe the supplied `default` rubric; custom configurations are addressed separately.

## Input and version selection

An assessment is an object with optional `front`, `back`, `subject` and `rubric` properties. A face may contain `centering`, `defects` and `print`. The schemas in `schemas/` define interchange shapes. Hosts MUST validate against the selected version's schemas; `score(input, rubric)` is not a complete JSON Schema validator. For example, it rejects unknown top-level keys but does not enforce every nested `additionalProperties` constraint.

The optional `rubric` input string is a host-resolved pin, such as `default@0.3`. The low-level function uses its explicit rubric argument and neither resolves nor enforces that input string. A host MUST select matching code, schema and rubric and retain their identity with the assessment/result. Unknown versions MUST NOT alias the current version. `subject` and defect annotations do not affect arithmetic.

An omitted face, centering axis, defect list, print block or print attribute contributes no deduction. These mathematical defaults do not assert that the omitted observation was inspected. Physical-inspection completeness belongs to the producer. Missing severity on a present defect is an error.

## Aggregation and grade conversion

1. Each face starts with 1000 points in each scored region: `centering`, `corners`, `edges`, `surface`, and `print` when the rubric has print attributes.
2. All deductions in a face's region sum. The region score is `max(0, 1000 - sum)`.
3. A face's `side_points` is the minimum of its region scores. Card `points` is the minimum of both faces' `side_points`, floored to an integer.
4. `raw = floor(points / 50) * 0.5`, then `grade = raw >= 9.5 ? 10 : max(raw, 1)`. There is no reported grade 9.5.
5. Choose the condition band by the highest applicable minimum grade: `NM >= 9`, `LP >= 7`, `MP >= 5`, `HP >= 3`, `DMG >= 1`.

The binding face is the face with fewer side points; ties MUST resolve to front. The binding region is the lowest-scoring region on that face; ties MUST resolve in this order: `centering`, `corners`, `edges`, `surface`, `print`.

The result MUST expose rubric identity, points, grade, condition band, binding face/region, both faces' region scores and deduction line items. Each item's face, scored region, penalty and optional print-attribute identity carry scoring meaning. Line-item order, human-readable `detail` and `grade_label` are non-normative presentation. Conformance may compare line items as a multiset, without depending on reference traversal order.

## Centering

`lr_pct` is the left border's share of left-plus-right border width; `tb_pct` is the top border's share of top-plus-bottom border width. Each is a finite number from 0 to 100. Fifty is centered. The precise measurement position/window is not specified by this version.

Quantize each absolute offset from 50 to the nearest 0.1 percentage point with half-up ties, then take the larger offset. The axes MUST NOT be added. Accumulate slope times span through the applicable curve, starting at zero:

| Front deviation interval | Slope (points per percentage point) |
| --- | ---: |
| 0 to 10 | 10 |
| 10 to 15 | 15 |
| 15 to 20 | 20 |
| 20 to 30 | 12 |
| 30 to 35 | 20 |
| Above 35 | 40 |

| Back deviation interval | Slope |
| --- | ---: |
| 0 to 40 | 2 |
| Above 40 | 10 |

Round the accumulated nonnegative penalty half-up once using `floor(value + 0.5)`. The generic front defect multiplier does not apply to centering. Quantization precedes curve evaluation; intermediate segments are not rounded. JavaScript `Math.round` rounds exact positive ties upward, not to even. Implementations must reproduce the supplied vectors, including binary-floating-point boundary cases.

Examples: front 55/45 yields penalty 50, 950 points and grade 10; front 60/40 yields 100, 900 and 9; front 65/35 yields 175, 825 and 8. Front deviation 10.3 accumulates 104.5, rounds to 105, and yields 895 / 8.5. Back 90/10 yields 80, 920 and 9. Equal centering penalties on both faces bind to front.

## Common severity and classification

Every defect MUST contain exactly one of these severity identifiers:

| Identifier | Display | Meaning within the established damage type |
| --- | --- | --- |
| `de_minimis` | De-minimis | Faintest established damage, requiring close inspection or angled light |
| `minor` | Minor | Definite local damage |
| `moderate` | Moderate | Readily apparent damage with a substantial effect on affected material or appearance |
| `severe` | Severe | Pronounced damage with major material disruption or appearance loss |

There is no `heavy` alias in 0.3. Legacy `light`, `full_card`, `through_layers`, `very_slight`, `slight`, `obvious` and `blemish` are not severity values either. `full_card` remains a valid *surface size* value.

Severity expresses increasing intensity within the established type, not equal impact across types, measured depth, or extent class. Changing length alone must not create a new severity judgment. Surface depth and size are already scored separately: do not increase severity solely because the same evidence selected a deeper class or larger size. This version supplies no calibrated quantitative severity thresholds or assertion that independent observers agree on the anchors.

Each distinct physical flaw is one defect object. Multiple distinct flaws may share a location and their penalties sum. A second view or confirmation does not by itself create another flaw. Do not enter both a legacy penalty and a common-severity penalty for the same finding. Physical identity and counting remain assessment responsibilities.

Foreign material, unresolved hypotheses and not-observed findings are not established damage. The producer must preserve unresolved evidence without inventing severity. A surface wrinkle, dent, printing feature or uncertain mark must not automatically become a crease.

## Corner and edge defects

`region=corner` requires `corner=tl/tr/bl/br` and severity. `region=edge` requires `edge=top/right/bottom/left` and severity. Optional coordinates are finite numbers between 0 and 1 from the top-left of the face. Coordinates and locator choice do not alter deductions.

| Severity | Corner back | Corner front | Edge back | Edge front |
| --- | ---: | ---: | ---: | ---: |
| de_minimis | 15 | 20 | 14 | 18 |
| minor | 55 | 72 | 51 | 66 |
| moderate | 175 | 228 | 150 | 195 |
| severe | 325 | 423 | 305 | 397 |

Back values are the basis; front is `floor(basis * 1.3 + 0.5)`. Corner defects pool into `corners`, edge defects into `edges`, per face, not separately per corner or edge. Only de-minimis corner/edge defects can retain grade 10, and sufficient accumulated de-minimis defects can still lose that grade. This is not a rule for every defect type.

Local wear/whitening, a nick, a ding or fraying can inform these channels when classification and locator are established. A product alias does not change arithmetic; subtype spelling alone does not select severity. A scratch near a corner is not automatically corner wear.

## Surface defects

`region=surface` requires `severity`, `depth`, `size`, `x` and `y`.

- `depth=surface`: surface mark without a gloss break, such as a scuff.
- `depth=scratch`: an established scratch, described in the earlier standard as a visible line catchable by a fingernail. This is a classification description, not an instruction to perform a potentially damaging inspection.
- `depth=deep`: surface-layer penetration, such as a gouge, without a stock fold or break. A stock crease is excluded even when its surface remains intact.

Size retains the approximate descriptions: `dot` is about 2 mm or less; `lt_1cm` is under 1 cm; `lt_5cm` is under 5 cm; `full_card` spans most of the card. Exact equality boundaries, precise extent measurand and conversion from a point annotation remain unresolved. A coordinate point alone does not establish the physical dot class. Preserve the supplied class and separately version any producer's measurement-to-class policy.

| Depth / size basis | dot | lt_1cm | lt_5cm | full_card |
| --- | ---: | ---: | ---: | ---: |
| surface | 5 | 25 | 80 | 180 |
| scratch | 15 | 55 | 160 | 330 |
| deep | 35 | 110 | 280 | 510 |

| Severity | de_minimis | minor | moderate | severe |
| --- | ---: | ---: | ---: | ---: |
| Surface factor | 0.25 | 0.5 | 1 | 2 |

`deduction = floor(basis[depth][size] * face_multiplier * severity_factor + 0.5)`.

The face multiplier is 1.3 on front and 1 on back. Round once after the complete product. Do not round after each multiplier. The deduction pools into `surface`.

For `scratch/lt_1cm`, deductions are 14/28/55/110 on back and 18/36/72/143 on front. A front minor `surface/lt_1cm` deducts 16: rounding intermediate 12.5 to 13 would incorrectly give 17. Severe back `deep/full_card` deducts 1020; the line item retains 1020 while its region floors at zero. The moderate factor preserves the earlier basis numerically; this does not mean old observations were moderate, and they must not be backfilled.

## Crease, stain and placed print defect

These channels require severity and normalized `x,y`. Crease means an established stock fold or deformation along a fold. A subtle stock fold may have an intact surface. A surface-layer gouge is not a crease. A dent or isolated tear without an established fold has no general mapping supplied here.

| Channel | de_minimis | minor | moderate | severe | Scored region |
| --- | ---: | ---: | ---: | ---: | --- |
| Crease, either face | 575 | 675 | 775 | 875 | surface |
| Stain, front | 675 | 725 | 775 | 875 | surface |
| Stain, back | 75 | 275 | 475 | 775 | surface |
| Print defect, either face | 25 | 75 | 275 | 675 | print |

These are absolute deductions. The generic front multiplier MUST NOT be applied again. Extent observations may be retained but there is no additional extent multiplier for these channels. Legacy crease `full_card` mixed extent into severity. A long crease is not automatically moderate or severe in 0.3; independently judged intensity selects the row.

**Deductions are not independent hard grade-ceiling rules.** The scorer has no separate `maximum_grade` operation. Under the default table, a de-minimis crease alone leaves 425 / grade 4; a de-minimis front stain alone leaves 325 / grade 3. These follow from deductions and the ladder. Further flaws in the same region add and may lower the grade further. Values are policy choices, not equivalence to another company's grading practice.

Severity changes each individual default-table deduction with other inputs fixed. Card points or grade may stay unchanged because another region binds, a region reaches zero, or two point totals occupy the same grade band. Even a severe dot-sized scuff can retain grade 10; a universal severity grade cap is not part of this version.

## Print attributes

Per-face global attributes in the optional `print` object are distinct from located `print_defect` objects. Missing attributes mean no mathematical deduction.

| Attribute | Value | Deduction |
| --- | --- | ---: |
| focus | sharp / slightly_out / noticeably_out / severely_out | 0 / 275 / 475 / 775 |
| gloss | full / most_retained / some_loss / much_lost / absent | 0 / 275 / 375 / 675 / 775 |
| border | clean / slightly_off_white / yellowed / browned | 0 / 75 / 675 / 825 |

Attribute penalties are identical on either face; no generic multiplier applies. All nonzero attribute and print-defect deductions **add** in that face's `print` region; they do not compete as individual caps. `gloss=most_retained` and a separate moderate print defect produce `1000 - 275 - 275 = 450`, grade 4.5. Assessment guidance must avoid inventing duplicate findings from one observation.

## Line endpoints and annotations

Surface, crease and edge defects may carry paired `x2,y2`, finite and between 0 and 1. One without the other is invalid. The scorer validates the pair and ignores it for arithmetic. A producer may derive a size class using endpoints under its own versioned measurement policy; the scored input is the class. Changing endpoints alone MUST NOT change the score. Corner, stain and print-defect endpoints are undeclared annotations and are ignored, not a second scored extent field.

Unknown defect annotations do not change arithmetic. The strict outer schema and permissive defect-annotation level are intentional. Non-finite coordinates and unsupported scored values are errors. Exact error wording and which invalid field is reported first are non-normative.

## Configuration support

The default rubric enables all five scored regions. A custom rubric may omit `print_attributes`, producing four regions; a present `print` block then fails. Crease and stain require their own tables but not print attributes. A print defect requires **both** `print_defect_penalties` and `print_attributes`; otherwise scoring must fail rather than subtract from a nonexistent region. Surface severity factors are required by the 0.3 configuration schema. Custom numeric choices are not the default rubric.

Centering may use scalar slopes or curves per face. A curve takes precedence when supplied; breakpoints must increase and the last segment must be open-ended (`up_to=null`). Accumulate and round once. A scalar slope is the one-segment curve. Hosts must validate configurations and these semantic constraints; the reference scorer is not a configuration linter.

## Reproducibility, compatibility and known limitations

Frozen vectors and semantic examples in `test/` specify this candidate's expected behavior. Conformance to a published version is governed by [CONTRIBUTING](CONTRIBUTING.md); passing unpublished candidate tests does not establish that a Chair decision or public release occurred.

Existing 0.1/0.2 artifacts and stored assessments retain their original version and interpretation. New 0.3 judgments may move scores either way. There is no automatic ordinal translation of old words. Reassessment requires a separately identified judgment/result; preserve historical inputs, hashes and accepted grades. Retain the actual scorer/rubric used, not only a display pin.

Unresolved limitations include physical anchor calibration and observer agreement; borderline gouge/crease distinctions; unsupported dents/isolated tears; exact surface extent and centering measurands; defect segmentation/counting; local/global overlap; and pure worst-region aggregation. This standard supplies no classifier, capture method, completeness proof, empirical grade-equivalence claim, or automatic migration of old evidence.
