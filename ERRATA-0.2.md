# Touchstone 0.2 explanatory errata

Date: 2026-09-06.

This is a separately dated explanatory addendum, not a new rubric version.
It identifies three prose errors inherited by the released 0.2 specification
and explains the arithmetic already implemented and tested in that release.
The original release remains available unchanged:
[v0.2](https://github.com/touchstone-standard/touchstone/tree/v0.2), at commit
[`9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8`](https://github.com/touchstone-standard/touchstone/commit/9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8).
The [original specification](https://github.com/touchstone-standard/touchstone/blob/9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8/RUBRIC.md),
[reference scorer](https://github.com/touchstone-standard/touchstone/blob/9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8/scoring.mjs),
and [conformance vectors](https://github.com/touchstone-standard/touchstone/blob/9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8/test/vectors.json)
are linked by immutable commit, so this addendum can be read beside the text it
corrects. It does not replace that text or expand the conformance test set.

## 1. Centering: JavaScript rounding

The [Centering section](https://github.com/touchstone-standard/touchstone/blob/9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8/RUBRIC.md#centering)
incorrectly groups JavaScript's `Math.round` with half-to-even rounding.

Correct explanation: JavaScript's `Math.round` rounds exact ties toward positive infinity;
`Math.round(2.5)` is `3`, and `Math.round(3.5)` is `4`. It does not use a
ties-to-even rule. See the [ECMAScript definition of Math.round](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.round).

Touchstone's existing centering penalty rule remains
`floor(sum(slope * span) + 0.5)`, applied once after accumulating the segments.
For the rubric's nonnegative penalties, an exact half-point rounds upward.
This correction does not replace the scorer's explicit rounding helper or
alter input quantization. Binary floating-point representation can affect
whether a computed value is exactly a tie; it does not make `Math.round` a
ties-to-even function. The released front-centering example `lr_pct: 60.3`
produces a 105-point penalty, 895 points and grade 8.5.

## 2. Print defects and print attributes add together

The [Print defect paragraph](https://github.com/touchstone-standard/touchstone/blob/9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8/RUBRIC.md#placeable-types)
incorrectly says a placed print defect and a gloss rung compete to cap the face.

Correct explanation: placed print defects and print attributes have additive
penalties. Their penalties sum within that face's `print` region. The region starts
at 1000 points and is reduced by their combined penalties, with a floor of
zero. The resulting region score then participates in the existing minimum
across regions and faces. Taking only the largest individual print penalty
does not reproduce the released arithmetic.

For example, on the back, `gloss: "most_retained"` deducts 275 points and a
`print_defect` of severity `"blemish"` deducts another 275. Together the print
region scores `1000 - 275 - 275 = 450`: grade 4.5 when all other regions are
ideal. Each on its own gives 725 points / grade 7. Neither penalty receives
the generic front-defect multiplier, so the same pair on the front also gives
450 points / grade 4.5. This summing behavior is already covered by the frozen
vector named `v04 print_defect + gloss pool in the same region`.

## 3. The de-minimis-only statement is about corners and edges

The [Corner & edge defects section](https://github.com/touchstone-standard/touchstone/blob/9b5de35ad69acd7d49cddbd92988f2c17ff6f9b8/RUBRIC.md#corner--edge-defects)
says that only de-minimis flaws can keep a 10 and extends that statement to
visible defects generally. Those statements need the section's local scope.

Correct explanation: Within the corner and edge severity classes, only
`de_minimis` defects can retain grade 10, subject to each face's accumulated
region penalties. Even the least costly minor corner/edge defect, a back
minor edge, deducts 51 points and yields 949 points / grade 9. De-minimis is
therefore necessary within those classes, but does not guarantee grade 10:
enough de-minimis defects in one region can also cross the grade boundary.

This is not a rule for every defect category or every visible physical finding.
For example, a single back `surface/deep/dot` deducts 35 points, yielding
965 points / grade 10. A single `print_defect/slight` deducts 25 points on
either face, yielding 975 points / grade 10. These are existing arithmetic
examples, not new classification guidance. The 0.2 distinction between a
surface-layer gouge and a stock crease still applies.

## Reproduce the examples

Run this JavaScript from a checkout of the linked 0.2 release using Node's
ES-module mode (`node --input-type=module`). Omitted observations receive
the scorer's existing ideal defaults; these synthetic inputs are arithmetic
examples, not evidence that a physical card was completely inspected.

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { score } from "./scoring.mjs";
const rubric = JSON.parse(readFileSync("./rubric.json", "utf8"));
assert.equal(rubric.rubric_version, "0.2");
assert.deepEqual([Math.round(2.5), Math.round(3.5)], [3, 4]);
const check = (input, points, grade) => {
  const result = score(input, rubric);
  assert.deepEqual([result.points, result.grade], [points, grade]);
  return result;
};
const centering = check({ front: { centering: { lr_pct: 60.3 } } }, 895, 8.5);
assert.equal(centering.line_items[0].penalty, 105);
const blemish = { region: "print_defect", severity: "blemish", x: 0.5, y: 0.5 };
check({ back: { print: { gloss: "most_retained" } } }, 725, 7);
check({ back: { defects: [blemish] } }, 725, 7);
for (const face of ["front", "back"]) {
  const combined = check({ [face]: {
    print: { gloss: "most_retained" }, defects: [blemish],
  } }, 450, 4.5);
  assert.equal(combined.faces[face].regions.print, 450);
  assert.deepEqual(combined.line_items.map(item => item.penalty), [275, 275]);
  check({ [face]: { defects: [{ ...blemish, severity: "slight" }] } }, 975, 10);
}
check({ back: { defects: [{ region: "edge", edge: "top", severity: "minor" }] } }, 949, 9);
check({ back: { defects: [{
  region: "surface", depth: "deep", size: "dot", x: 0.5, y: 0.5,
}] } }, 965, 10);
check({ back: { defects: Array.from({ length: 4 }, (_, i) => ({
  region: "corner", corner: ["tl", "tr", "bl", "br"][i], severity: "de_minimis",
})) } }, 940, 9);
console.log("All errata examples match Touchstone 0.2");
```

## Implementer and consumer impact

No scoring behavior, rubric version, penalties, schemas, conformance vectors,
classification definitions, governance or licensing terms change. The frozen
0.2 artifacts and release tag remain unchanged. No 0.3 release or consumer
version migration is introduced by this addendum.

Implementations already reproducing the released arithmetic need no scoring
change. Implementers whose code follows the erroneous explanatory sentences
should compare their results with the linked scorer and frozen vectors, then
correct any implementation discrepancy. Such a repair can change their newly
computed results; that is not a change to Touchstone's published arithmetic.
Existing recorded results remain unchanged. Preserve their original inputs,
rubric and provenance; record any corrected computation separately and link
it to the original instead of silently overwriting history.

This addendum establishes no new physical accuracy, inspection completeness,
or empirical grading claim. It is dated documentation of existing behavior.
