# TIP: 0.2 input semantics

Status: release authorized for Touchstone 0.2 on September 6, 2026 (npm 0.2.0).
The Chair's written decision with reasons must be posted in the proposal PR
before publication. Temporary filename pending that PR's number.

## Motivation

Published 0.1 defines `deep` as a crease or paper break while separately scoring
creases. Consider the stated case of a single light stock fold with an intact
surface on the back: `surface/deep/dot` produces 965 points/grade 10, whereas
`crease/light` produces 425/4. The arithmetic is deterministic; overlapping
definitions permit contradictory encodings of the stated physical condition.

This is a synthetic counterexample, not a presented real card. The bounded
release resolves the conflicting stated-input meanings; it makes no claim that
representative real-card evidence or borderline physical anchors have been
established. Those remain empirical work for subsequent refinement.

## Specification

Version 0.2 changes `RUBRIC.md` and schema descriptions together: `deep` means
surface-layer penetration (a gouge), without a stock fold or break. A crease is
a stock fold or deformation along a fold. A light crease retains an intact
surface; through-layer severity requires a crease with a split through layers.
An isolated tear or dent is not automatically a crease. No numeric tables change.

The rubric's stated-condition table and `test/input-semantics.json` supply
permitted/excluded encodings for gouge, intact light crease, through-layer crease
and unsupported dent. Exclusion concerns meaning given those facts, not JSON
validity. The scorer does not inspect physical damage or reject a misclassified
but structurally valid input. Original arithmetic vectors remain frozen.

Non-normative guidance addresses aliases, unresolved observations, foreign
material, one-distinct-flaw inputs, and versioned product mappings. No new public
field, deduplication algorithm or prescribed confirmation UI is introduced.
Extent thresholds, centering measurement definitions and dent policy are deferred.
The standard/schema identity is 0.2, with a separate npm version of 0.2.0.

## Rationale and Alternatives

Clarifying classification preserves the scoring policy while removing a known
overlap. Routing every structural flaw to crease would misclassify dents and
tears; treating every intact surface as a gouge would misclassify light creases.
Changing penalties to create a differentiating number would conceal the semantic
problem. Adding mandatory provenance fields would break inputs without enabling
the scorer to determine physical truth. None of these alternatives is adopted.

Products can develop their own versioned schemas and experiments on real cards
before the standard adopts an interpretation. Keep exact mappings to published
versions distinct from experimental scoring meaning; evidence can support a
later TIP. Product deployment and synthetic checks alone do not justify adoption.

## Backward Compatibility

All previously valid encoded inputs retain numeric outputs; original invalid
vectors still refuse. Only rubric identity metadata changes in score results.
Physical reclassification can change a new score, as the 965/10 versus 425/4
example demonstrates. Preserve original 0.1 assessments and artifacts; create
linked new assessments rather than silently recoding history. Keep source schema,
mapping and actual rubric identities in the host record, without requiring new
Touchstone fields. `score()` uses its explicit rubric argument, not the input pin.
Consumers adopt the new version explicitly; releasing the standard does not
automatically migrate existing product assessments or version pins.

## Reference Implementation

`scoring.mjs` is unchanged. `rubric.json` changes only version and schema-path
metadata. `test/compatibility.test.mjs` pins baseline scorer/vector content and
all other rubric configuration; `test/scoring.test.mjs` runs the original vectors.
`test/input-semantics.test.mjs` checks the corrected definitions in prose/schema,
the normative example table and executable encodings, their numeric consequences,
and the scorer's inability to reject structurally valid excluded interpretations.
Run `npm test`; the same support files ship in the package.

The distinguishing evidence is semantic-contract evidence: 0.1's definition
permits a crease as `deep`, while this proposal excludes it. It is not a changed
numeric result for identical encoded input. The bounded release decision accepts
the stated-condition examples and executable definition checks as distinguishing
evidence for this semantic correction, while preserving the numeric vectors.
Conformance under CONTRIBUTING remains passing the version's `test/vectors.json`;
it attests to arithmetic behavior, not correct physical mapping. No new condition
is added to the licensing or trademark commitment. Real-card anchors, dents,
extent and centering measurement questions remain explicitly unresolved; approval
of this correction does not establish physical classification validity.
