# Touchstone 0.2

September 6, 2026. See the [input-semantics proposal](proposals/draft-02-input-semantics.md)
and [changelog](CHANGELOG.md) for the scope and reasons for this release.

Touchstone turns a card condition
assessment — measured centering plus an enumerated list of defects — into a
grade.
Given the same enumeration, any implementation of this rubric produces the same
number: the arithmetic is the standard, not a proprietary black box. The reference
implementation lives alongside this document as `scoring.mjs`, interpreting the
data in `rubric.json`; this file is the human-readable prose version of the
same rules. Philosophy: **forgive centering drift near mint, escalate as it
becomes the card's defining flaw, and punish damage.** The score reflects the
encoded assessment; it does not verify whether damage was correctly identified.

## How a score is computed

1. Each region — `centering`, `corners`, `edges`, `surface`, and (config-gated)
   `print` — starts at the base score, **1000** (the flawless ceiling),
   separately per face. In plain terms: every face begins as a perfect card,
   judged four ways under a rubric with no `print_attributes` table, five under
   one that defines it (see Print quality below).
2. Every defect and every non-zero centering deviation subtracts a penalty from
   its region. A region's sub-score is `1000 − Σ(penalties)`, **floored at 0** — a
   region can't go negative no matter how many defects stack. In plain terms:
   each flaw takes points off the category it belongs to, and a category can be
   emptied but never owes points.
3. A face's `side_points` is the **minimum of its region sub-scores** (four
   without a `print_attributes` table, five with one)
   — the worst region caps the whole side. In plain terms: a face is only as
   good as its worst category.
4. The card's `points` is the **worse of the two sides** (pure bottleneck — a
   flawless back cannot rescue a damaged front). In plain terms: the card is
   only as good as its worse face. Which face that is, and how a tie between
   them resolves, is specified in *Binding face and binding region* below.
5. `points` is floored to an integer before the ladder (custom rubrics may
   produce fractional penalties; the ladder only ever sees whole numbers). In
   plain terms: fractions are dropped before grading.
6. The ladder converts points to a grade: `raw = floor(points / 50) × 0.5`, then
   `grade = raw ≥ 9.5 ? 10 : max(raw, 1)`. The 9.5 slot is deliberately promoted
   to 10 — the market's 9→10 value cliff, expressed as arithmetic. Grade never
   reports below 1. In plain terms: every 50 points is half a grade; 950 or better is a
   10 because the 9.5 slot is promoted.

### Binding face and binding region

A score result MUST name the face and the region that produced the grade.

The **binding face** is the face with the lower `side_points`. **Ties MUST
resolve to the front.**

The **binding region** is the lowest-scoring region *on the binding face*.
**Ties MUST resolve to the earliest region** in the fixed order
`centering → corners → edges → surface → print`, where `print` participates
only when the rubric enables the print-attribute ladders. This order is
normative: two implementations that disagree on a tie produce different
`binding_region` values for the same card and are not interoperable.

## Centering

Centering is a measurement, not a defect list entry. Per face, you supply
`lr_pct` (the left border's share of left+right border width) and `tb_pct` (the
top border's share of top+bottom); 50.0 is perfectly centered on that axis.

- **Deviation** is the **larger** of the two axis offsets from 50:
  `deviation = max(|lr_pct − 50|, |tb_pct − 50|)`. Deviation is the max axis, not
  the sum of both axes — a card off on only one axis isn't punished twice.
- Inputs are accepted at any precision but **quantized to 0.1 point** before
  scoring, for determinism.
- The penalty is a **progressive, piecewise-linear curve** per face. Each curve
  is a list of segments `{ up_to, slope }`, sorted ascending; a segment spans from the
  previous segment's `up_to` (0 for the first) to its own, and the final
  segment is open-ended (`up_to: null`). The penalty **accumulates
  `slope × span` across every segment the deviation crosses**, then is
  **rounded half-up ONCE at the end** — **not** banker's rounding (JavaScript's
  default `Math.round` and Python's `round()` both round half-to-even in some
  cases; this rubric always rounds an exact `.5` *up*). Concretely:
  `penalty = floor(Σ slopeᵢ × spanᵢ + 0.5)`. A scalar slope `s` is exactly the
  one-segment curve `[{ up_to: null, slope: s }]`, so the two forms share one
  semantics.

  **Front curve** (deviation in percentage points):

  | Segment | Slope (pts/pt) | Penalty at segment end |
  |---|---|---|
  | 0 → 10 | 10 | 100 |
  | 10 → 15 | 15 | 175 |
  | 15 → 20 | 20 | 275 |
  | 20 → 30 | 12 | 395 |
  | 30 → 35 | 20 | 495 |
  | 35 → ∞ | 40 | — |

  **Back curve:**

  | Segment | Slope (pts/pt) | Penalty at segment end |
  |---|---|---|
  | 0 → 40 | 2 | 80 |
  | 40 → ∞ | 10 | — |

- **Why these knees.** The curve is shaped to the philosophy above: drift near
  mint is forgiven, and each knee is a point at which off-centering stops being
  a quibble and starts being the thing you notice about the card. Read out as
  border ratios, a card whose *only* flaw is centering grades:

  | Front border ratio | Deviation | Penalty | Points | Grade |
  |---|---|---|---|---|
  | 55/45 | 5 | 50 | 950 | **10** |
  | 60/40 | 10 | 100 | 900 | **9** |
  | 65/35 | 15 | 175 | 825 | **8** |
  | 70/30 | 20 | 275 | 725 | **7** |
  | 80/20 | 30 | 395 | 605 | **6** |
  | 85/15 | 35 | 495 | 505 | **5** |
  | 90/10 | 40 | 695 | 305 | **3** |

  Each knee sits where a round border ratio lands on a whole grade: 60/40 at 9,
  65/35 at 8, 70/30 at 7, 80/20 at 6, 85/15 at 5. No round ratio falls between
  85/15 and 90/10, which is why the table steps from 5 straight to 3.

  The back is judged far more gently, because the reverse border is not what a
  collector is looking at:

  | Back border ratio | Deviation | Penalty | Points | Grade |
  |---|---|---|---|---|
  | 75/25 | 25 | 50 | 950 | **10** |
  | 90/10 | 40 | 80 | 920 | **9** |

  Past the last rows on either table — front 90/10, back 90/10 — the curves
  escalate steeply (40 and 10 pts/pt): centering that bad is the card's
  defining flaw, and the grade should say so.
- Worked GEM cutoffs: front **45/55** → deviation 5.0 → penalty `50` → 950
  points → still 10; one tenth worse (44.9/55.1) → deviation 5.1 → `51` → 949
  → drops to 9. Back **75/25** → deviation 25.0 → `50` → 950 → still 10; the
  gentle back slope (2/pt) plus half-up rounding holds GEM through 75.2/24.8
  (deviation 25.2 → 50.4 → rounds to `50` → 950) and breaks it at 75.3/24.7
  (deviation 25.3 → 50.6 → `51` → 949 → 9).
- Knee-crossing example (also the single-round rule): front deviation 10.1
  → `10 × 10 + 0.1 × 15 = 101.5` → rounded once, half-up → `102` → 898 points
  → grade 8.5. Rounding an exact accumulated `.5` **up**: front deviation 10.3
  → `100 + 0.3 × 15 = 104.5` → `105` → 895 → 8.5 (half-to-even would have
  given 104).

## Corner & edge defects

Every corner (`tl`/`tr`/`bl`/`br`) and edge (`top`/`right`/`bottom`/`left`)
defect is classified into one of four severity classes:

- **de minimis** — faint whitening only visible up close or under angled
  light. The GEM budget is **face-dependent**, because front penalties carry
  the ×1.3 multiplier: a GEM card may keep **three** de-minimis in a back
  region (the fourth breaks GEM), but only **two** in a front region (the
  third breaks GEM). This matches the empirical finding that top-grade
  cards routinely carry a few flagged-but-forgiven dings, while holding
  the front to the stricter standard the multiplier implies.
- **minor** — visible at arm's length but small: visible whitening or a small
  nick, a soft corner touch.
- **moderate** — obvious at a glance: the corner point is flattened or rounded
  but the card layers are intact.
- **heavy** — structural: layers visibly separated, frayed, or the corner is
  fully blunted/bent.

The GEM boundary is a deliberate construction: **only de-minimis flaws can
keep a 10.** The mildest *minor* defect in the rubric — a minor edge on the
back, penalty 51 — lands at 949, one point past the cliff. A defect visible at
arm's length does not keep a 10.

Each distinct physical flaw is **one defect object**, and multiple defect
objects MAY target the same corner or edge — a corner with both whitening and
a nick is two defects. All corner penalties on a face **sum into that face's
single `corners` region sub-score** (and likewise all edge penalties into
`edges`): the bottleneck is per-REGION, not per-corner. The corner/edge label
is locational metadata and never changes the score. Pooling per region is
deliberate — a region is scored collectively; true per-corner sub-scores are a
future rubric refinement.

Reference penalties (back-face values; front is ×1.3), deducted from that
region:

| Severity | Corner | Edge |
|---|---|---|
| de minimis | 15 | 14 |
| minor | 55 | 51 |
| moderate | 175 | 150 |
| heavy | 325 | 305 |

**Front multiplier: ×1.3.** Every defect penalty on the front face — corner,
edge, or surface — is multiplied by 1.3 and **rounded half-up** after
multiplication (centering is exempt; it already has its own front/back slope).
Applied to the tables above: front corner penalties are 20 / 72 / 228 / 423;
front edge penalties are 18 / 66 / 195 / 397.

## Surface defects

Surface defects require a **depth**, a **size**, and normalized `x,y`
coordinates (0–1 from the top-left of the face) — location is required here
because, unlike a corner or edge, "surface" alone doesn't say where on the card.

- **Depth** — `surface`: does not break the gloss (a scuff, a print line).
  `scratch`: a visible line you can catch a fingernail on.
  `deep`: surface-layer penetration (a gouge), without a stock fold or break.
  A stock crease, including a light crease with an intact surface, is excluded
  from `deep`; use the separate crease vocabulary when a crease is established.
- **Size** — `dot`: about 2mm or less. `lt_1cm`: under 1cm. `lt_5cm`: under
  5cm. `full_card`: spans most of the card.

Reference penalty matrix (back-face values; front is ×1.3):

| Depth \ Size | dot | lt_1cm | lt_5cm | full_card |
|---|---|---|---|---|
| surface | 5 | 25 | 80 | 180 |
| scratch | 15 | 55 | 160 | 330 |
| deep | 35 | 110 | 280 | 510 |

The same ×1.3 front multiplier (rounded half-up) applies on the front face.

## Line endpoints

Surface, crease, and edge defects — the three linear regions — MAY carry an
optional second point, `x2`,`y2`, normalized 0–1 exactly like `x`,`y`, turning
the placed point into a line segment (e.g. a UI line-drag that measures a
scratch and derives its size class from the physical length). Line endpoints
are a **presentational/derivation aid only and are never scored**: the
reference scorer validates them when present (each finite and 0–1, and only
ever as a pair — a lone `x2` is rejected with `"x2 and y2 must be provided
together"`) and the arithmetic then ignores them entirely, so a defect with
endpoints scores identically to the same defect without them
(`test/vectors.json` pins this). Point-only regions (corner, stain,
print_defect) don't declare them — an `x2` there is ignored as an unknown
annotation field, like any other. Endpoints are a purely additive input-schema
affordance: they change no penalty, and the severity/size **classes remain the
scored input**.

## Print quality

Print quality — the criteria that decide vintage 10s and 9s (focus/registration,
gloss, print imperfections, border whiteness, creases, staining) — takes two shapes,
both **mid-band fit**:

1. **Attribute ladders** — `focus`, `gloss`, `border` are face-global judgments (not
   located anywhere in particular), assessed **independently per face** as an optional
   `print: { focus?, gloss?, border? }` object on that face. Config-gated: a rubric
   without `print_attributes` rejects any `print` block outright
   (`"print requires a rubric with print_attributes"`); an absent object, or an absent
   attribute within it, means **perfect** — no penalty. Ladders are short.
2. **Placeable defect types** — `crease`, `stain`, and `print_defect` sit alongside
   `corner`/`edge`/`surface` as `region` values on a defect. Unlike corner/edge
   (where `x`,`y` are optional annotation), all three **require** `x`,`y` — like
   `surface`, location matters for a placed flaw. Each carries a **severity** drawn
   from *that region's own* vocabulary; crease, stain, and print_defect each have a
   **disjoint** severity vocabulary from one another and from the shared corner/edge
   vocabulary — a `crease` defect never accepts a `stain` or `print_defect` severity
   word (or vice versa), even where a word is spelled the same (`heavy` is a valid
   word in all four vocabularies — shared corner/edge, crease, stain, print_defect —
   independently defined at a different penalty in each).

### Mid-band fitting

Every print-quality number below is fit by choosing the penalty that lands the card
at the **middle** of the target grade's 50-point band, not its edge —
`penalty = 1000 − (100g + 25)` for target grade `g`. A card whose only flaw is that
one attribute or defect lands exactly grade `g`, with margin against the band edge
on both sides.

### Attribute ladders (per face, region `print`)

| Attribute | Options → grade cap | Penalty |
|---|---|---|
| `focus` | sharp→10 · slightly_out→7 · noticeably_out→5 · severely_out→2 | 0 / 275 / 475 / 775 |
| `gloss` | full→10 · most_retained→7 · some_loss→6 · much_lost→3 · absent→2 | 0 / 275 / 375 / 675 / 775 |
| `border` | clean→10 · slightly_off_white→9 · yellowed→3 · browned→1.5 | 0 / 75 / 675 / 825 |

`slightly_off_white` caps at **9**, not 10: a touch of off-whiteness is a real flaw but
not a disqualifying one, so `border` is the only ladder whose first non-baseline rung
doesn't already cost a full grade band. Attribute penalties are **multiplier-exempt**:
`front_defect_multiplier` (×1.3 on corner/edge/surface) does **not** apply here — each
rung is already an absolute grade cap, not a generic front/back ratio.

### Placeable types

**Crease** (pools into the `surface` region bucket; `binding_region: "surface"` no
longer implies scuff/scratch/deep-type wear specifically — it may be a crease):

A crease is a stock fold or deformation along a fold, not a surface-layer
gouge. `light` is a single light stock fold whose surface remains intact;
`full_card` runs the full length of the card; `heavy` means multiple or more
pronounced creases; `through_layers` is a crease that breaks through the card's
layers (a paper split). A dent or an isolated tear is not automatically a crease.

| Severity | light | full_card | heavy | through_layers |
|---|---|---|---|---|
| Penalty | 575 | 675 | 825 | 875 |
| Grade cap | 4 | 3 | 1.5 | 1 |

**Stain** (pools into `surface`; penalty is **per-face** — a back stain is forgiven far
more than a front one, an asymmetry the generic ×1.3 front multiplier cannot express, so
`stain_penalties` carries explicit `{front, back}` columns per severity instead):

| Severity | very_slight | slight | obvious | heavy |
|---|---|---|---|---|
| Back penalty (cap) | 75 (9) | 275 (7) | 475 (5) | 775 (2) |
| Front penalty (cap) | 675 (3) | 675 (3) | 775 (2) | 875 (1) |

**Print defect** (a placed line/dot/snow-type printing flaw; pools into the `print`
region — the same bucket the attribute ladders bottom, so a placed print defect and,
say, a `gloss` rung compete for which one caps the face):

| Severity | slight | minor | blemish | heavy |
|---|---|---|---|---|
| Penalty | 25 | 75 | 275 | 675 |
| Grade cap | 10 | 9 | 7 | 3 |

`slight`'s penalty (25 → 975 points → raw 9.5 → **promoted to 10**) is deliberately
**GEM-compatible**: one slight printing imperfection does not, on its own, cost a card
its top grade.

### Gating

- `print` (the attribute-ladder input) requires a rubric with `print_attributes`;
  absent, `score()` fails loudly.
- `crease` requires `crease_penalties`; `stain` requires `stain_penalties` — **neither
  requires `print_attributes`** — a rubric can support creases and stains without
  shipping the attribute ladders at all.
- `print_defect` is **double-gated**: it requires both `print_defect_penalties` (to
  look up the penalty) and `print_attributes` (because it pools into the `print`
  region, which only exists on a rubric that defines that table — without the second
  gate, a custom rubric with `print_defect_penalties` but no `print_attributes` would
  silently produce a broken region score).
- A rubric with none of these tables stays **strictly four-region**: the `print` region
  appears in `faces.<face>.regions` only when `print_attributes` is present.

### Notes

- **`line_items` order is presentation order, not normative** — only each line item's
  `region` and `penalty` are meaningful for scoring; the order items are pushed in (and
  therefore the order a UI would render them) is an implementation artifact of
  iteration order, not part of the spec.
- A placed print defect's `line_items` detail reads `"print {severity}"` (e.g.
  `"print slight"`), matching the `"{depth} {size}"` / `"{corner} {severity}"` pattern
  used by the other defect types.
- **Validation-order asymmetry (observable, non-normative):** a `surface` defect checks
  `depth`/`size` before `x`/`y`, so a defect missing both size and coordinates reports
  the size error first; the three placeable types check `x`/`y` **before**
  `severity`, so a `crease` defect missing both coordinates and a valid severity
  reports the coordinate error first instead. Which error surfaces first when multiple
  fields are invalid at once is not part of the spec — only that the input is rejected,
  and the accepted score is unaffected either way.

## Worked example

A **moderate corner defect on the back**: penalty 175 (from the corner table
above). `1000 − 175 = 825`. That region is now the side's minimum, so
`side_points = 825`. With nothing else on the card, `points = 825`, which
falls in the 800–849 step: `grade = 8`, `band = LP`.

The **same defect on the front** instead: the penalty is multiplied by 1.3
first — `round(175 × 1.3) = round(227.5) = 228` — then subtracted:
`1000 − 228 = 772`. That falls in the 750–799 step: `grade = 7.5`, still
`band = LP`. Same physical defect, worse grade, purely because it's on the
face judged more harshly.

## Grade ladder

`points` maps to `grade` in 50-point steps (`raw = floor(points/50) × 0.5`,
with the 9.5 slot promoted to 10), and `grade` maps to a condition band by
taking the highest `min_grade` the grade still reaches:

| Points | Grade | Condition band |
|---|---|---|
| 950–1000 | 10 | NM |
| 900–949 | 9 | NM |
| 850–899 | 8.5 | LP |
| 800–849 | 8 | LP |
| 750–799 | 7.5 | LP |
| 700–749 | 7 | LP |
| 650–699 | 6.5 | MP |
| 600–649 | 6 | MP |
| 550–599 | 5.5 | MP |
| 500–549 | 5 | MP |
| 450–499 | 4.5 | HP |
| 400–449 | 4 | HP |
| 350–399 | 3.5 | HP |
| 300–349 | 3 | HP |
| 250–299 | 2.5 | DMG |
| 200–249 | 2 | DMG |
| 150–199 | 1.5 | DMG |
| 0–149 | 1 | DMG |

Bands, by minimum grade: **NM** ≥9 · **LP** ≥7 · **MP** ≥5 · **HP** ≥3 ·
**DMG** ≥1. Band selection is order-insensitive in the rubric data — the
scorer picks whichever band has the highest `min_grade` the grade still
clears.

## Versioning

This standard is **Touchstone 0.2**. Versions are two-part, `major.minor`;
there is no patch digit. One number everywhere — this prose, the rubric data's
`rubric_version`, and the `$id` path the schemas are served from all carry it.
That is the version to cite when you claim conformance.

Every change to any number in this document or in `rubric.json` — a
curve segment, a penalty, a band boundary — is **a new version**, never a
silent edit in place. This prose is normative, so a number cannot move in the
data without moving here too. Every score result names the `rubric_id` and
`rubric_version` that produced it, so a grade is always reproducible against
the exact rules in force when it was computed. Per-set rubrics (e.g. a
vintage-basketball override) are not special-cased code — they are new
instances of `rubric-config.schema.json`, resolved by the framework's
inheritance (`default → game → era/class → set`).
Conformance with Touchstone 0.2 means passing `test/vectors.json`, as provided
by CONTRIBUTING's versioned conformance commitment. Those arithmetic vectors
are unchanged from 0.1. This claim attests to an implementation's arithmetic
behavior; it does not attest to the physical truth of an assessment, observer
or model accuracy, or complete inspection of a card. The semantic examples below
explain the meanings of inputs; they add no physical-classification test to that
conformance claim. The existing licensing and trademark commitments are unchanged.
**This prose is normative.** The reference implementation and the golden vectors are
*conformance evidence* — the executable demonstration that an implementation
agrees with this document. Where they and this prose disagree, one of them
contains a bug: file it, decide which is wrong, and fix that one. Neither the
implementation's internal ordering, its floating-point accumulation, nor the
English text of its error messages is part of the standard.

## Stated-condition contract examples

These synthetic cases prescribe encodings given the stated facts. They are not
real-card observations, training labels, or evidence of classification accuracy.
All cases concern one back-face flaw with all other inputs ideal. The gouge's
existing `dot` extent class is assumed; placing a point does not establish size.

| Case | Stated condition | Permitted encoding | Excluded encodings | Points / grade |
| --- | --- | --- | --- | --- |
| surface-gouge | Surface-layer gouge; no stock fold or break; dot extent established | surface/deep/dot | crease/light | 965 / 10 |
| intact-light-crease | Single light stock fold; surface intact, layers not split | crease/light | surface/deep/dot | 425 / 4 |
| through-layer-crease | Crease with paper split through layers along the fold | crease/through_layers | surface/deep/dot | 125 / 1 |
| unsupported-dent | Local indentation; no fold or surface-layer gouge | unsupported | crease/light, surface/deep/dot | No supported score |

Executable counterparts are in `test/input-semantics.json`. Excluded encodings
are wrong for those stated conditions but remain structurally valid inputs:
`score()` cannot detect that a person or model supplied the wrong label. The
tests check these examples, their correspondence to this table, and the removal
of the old crease/paper-break meaning in both schema and prose. They supplement
the arithmetic vectors; they do not make the scorer a physical classifier.

## Implementation guidance (non-normative)

Products may lead standard development by testing new workflows and versioned
schemas on real cards. Their schemas need not match this assessment schema.
Keep faithful mappings into a named published Touchstone version distinct from
product-only evidence and experiments that change scoring meaning or arithmetic.
Experiments can proceed before standard adoption. Identify arithmetic that diverges
from a published version and test any versioned conformance claim against its vectors.
An arithmetic conformance claim does not establish that an experimental physical
mapping follows the published definitions; describe that distinction explicitly.
Propose standard adoption with evidence when the interpretation is ready.

Translate aliases into the existing region-specific vocabulary only when meaning
is preserved. For example, an edge-wear label still needs a corner or edge and
that region's severity; its name alone supplies neither. Preserve useful source
subtypes. Emit one object per distinct flaw, not one per overlapping view of it.
Shared coordinates do not prove two observations are the same flaw; the scorer
sums supplied objects and performs no identity or geometric deduplication.

Keep unresolved observations and confirmed foreign material separate from damage
inputs. Excluding foreign material does not establish that the underlying surface
is undamaged. Do not turn an unresolved observation or unsupported dent into a
clean result by silently omitting it. A partial assessment is not a complete card inspection;
omitted centering/print inputs and absent defects still receive ideal arithmetic
defaults. No particular confirmation UI, capture method, or new input field is
required by this guidance.

Retain the source assessment and its product-schema version, the mapping version,
the mapped assessment, and the exact rubric artifact/result version in the host's
record. `score(input, rubric)` uses the passed rubric; it does not resolve or
enforce the optional input `rubric` pin. Historical 0.1 inputs stay reproducible
under their original artifacts and interpretation. Reinterpreting a physical
finding creates a new assessment linked to the earlier one; never overwrite or
relabel the old score. A standard release does not automatically migrate a
consumer's existing 0.1 pin; each consumer adopts it explicitly. This guidance
adds no required schema fields.

## Known limitations and evidence still needed

- Dents have no supported encoding or penalty. A tear without an established
  crease also has no general mapping supplied by this correction. Preserve
  unsupported observations rather than inventing a crease or edge-wear score.
- The surface extent wording remains approximate: equality at boundaries, the
  precise extent measure and the meaning of "most" are unresolved. No exact
  2/10/50 mm partition or conversion from a point annotation is adopted here.
- The centering ratios' measurement position/window remains unspecified. Curves
  and quantization are unchanged; arithmetic agreement does not establish
  equivalence between instruments or methods.
- Physical anchor evidence, including borderline scratch versus gouge cases and
  the reliable recognition of a light crease, remains necessary. Synthetic
  fixtures establish logical consistency, not real-card validity or coverage.
- Aggregation remains a first-order pure minimum, with no gap-credit or
  count-rule term. Any change requires data and a future version.

Version 0.2 adopts a bounded correction to the stated-input contract. It does not
establish empirical grading validity or broader physical coverage. Representative
real-card evidence remains necessary to evaluate the unresolved distinctions
above. This release neither resolves all taxonomy questions nor waives any
adopter's existing corpus or release gate.
