// Touchstone reference scorer — dependency-free ESM. Penalty tables and
// centering slopes/curves come from the rubric JSON; the aggregation shape
// (regions, bottleneck, ladder, 9.5 promotion) is defined here and normative.
// Rounding is normative: half-up, applied ONCE at the end (see RUBRIC.md).
const FACES = ["front", "back"];
const REGIONS = ["centering", "corners", "edges", "surface"];
// print is config-gated: appended LAST so tie priority in the binding_region
// reduce matches the normative order centering→corners→edges→surface→print
// (RUBRIC.md, "Binding face and binding region"). That order is normative —
// implementations that disagree on a tie are not interoperable.
const regionsFor = (rubric) => rubric.print_attributes ? [...REGIONS, "print"] : REGIONS;

export class ScoreError extends Error { name = "ScoreError"; }

function fail(path, msg) { throw new ScoreError(`${path}: ${msg}`); }

// half-up, NOT banker's rounding (Python round() / IEEE default differ)
function roundHalfUp(x) { return Math.floor(x + 0.5); }

// display convenience only — line_items.detail is NON-NORMATIVE (consumers map enums to their own copy)
function humanize(s) { return s.replace(/_/g, " "); }

function validateOptionalXY(d, path) {
  for (const k of ["x", "y"]) {
    if (d[k] === undefined) continue;
    if (!Number.isFinite(d[k]) || d[k] < 0 || d[k] > 1) fail(path, `${k} must be 0–1`);
  }
}

// Optional line endpoints (x2/y2): a linear defect on the
// three LINEAR regions (surface/crease/edge) may carry a second point turning
// its placement into a line segment — a presentational/derivation aid (e.g. a
// UI derives the surface size class from the drawn length) that is NEVER
// scored: validated here when present (finite, 0–1, and only ever as a PAIR),
// then ignored by every penalty below. Point-only regions (corner/stain/
// print_defect) never call this — an x2 there is just an unknown annotation
// field, ignored like any other (see the schema $defs.defect $comment).
function validateOptionalLineEndpoints(d, path) {
  if (d.x2 === undefined && d.y2 === undefined) return;
  if (d.x2 === undefined || d.y2 === undefined) fail(path, "x2 and y2 must be provided together");
  for (const k of ["x2", "y2"]) {
    if (!Number.isFinite(d[k]) || d[k] < 0 || d[k] > 1) fail(path, `${k} must be 0–1`);
  }
}

// Piecewise-linear centering curve: accumulate slope × span
// across the segments the deviation crosses. Segments are sorted ascending by
// up_to; each spans from the previous up_to (0 for the first) to its own; the
// final segment is open-ended (up_to null, schema-enforced). The caller rounds
// ONCE at the end — single-round semantics, same as the scalar-slope form.
function curvePenalty(deviation, curve, path) {
  let total = 0, prev = 0;
  for (const seg of curve) {
    const upTo = seg.up_to ?? Infinity;
    if (deviation <= upTo) return total + (deviation - prev) * seg.slope;
    total += (upTo - prev) * seg.slope;
    prev = upTo;
  }
  fail(path, `rubric centering curve does not cover deviation ${deviation} (final segment must have up_to null)`);
}

function centeringPenalty(face, c, rubric, path) {
  if (c == null) return { deviation: 0, penalty: 0 };
  for (const k of ["lr_pct", "tb_pct"]) {
    const v = c[k];
    if (v == null) continue;
    if (!Number.isFinite(v) || v < 0 || v > 100) fail(`${path}.${k}`, "must be a number 0–100");
  }
  const q = rubric.centering.quantize_pct;
  const dev = (v) => v == null ? 0 : Math.round(Math.abs(v - 50) / q) * q;
  const deviation = Math.max(dev(c.lr_pct), dev(c.tb_pct));  // MAX of the two axes, never their sum
  // A rubric supplies EITHER per-face curves or per-face scalar slopes. Curves
  // take precedence where present; the scalar form is a single multiply.
  const curve = face === "front" ? rubric.centering.front_curve : rubric.centering.back_curve;
  const raw = curve
    ? curvePenalty(deviation, curve, path)
    : deviation * (face === "front" ? rubric.centering.front_slope : rubric.centering.back_slope);
  return { deviation, penalty: roundHalfUp(raw) };
}

const CORNERS = ["tl", "tr", "bl", "br"];
const EDGES = ["top", "right", "bottom", "left"];

function classPenalty(table, severity, path, noun = "severity") {
  const p = table[severity];
  if (p == null) fail(path, `${noun} must be one of ${Object.keys(table).join("/")}`);
  return p;
}

function requireXY(d, path) {
  for (const k of ["x", "y"]) {
    if (typeof d[k] !== "number") fail(path, "requires x and y (normalized)");
    if (!Number.isFinite(d[k]) || d[k] < 0 || d[k] > 1) fail(path, `${k} must be 0–1`);
  }
}

function defectPenalty(face, d, i, rubric, base) {
  const path = `${base}[${i}]`;
  if (d == null || typeof d !== "object" || Array.isArray(d)) fail(path, "must be an object");
  const mult = face === "front" ? rubric.front_defect_multiplier : 1;
  if (d.region === "corner") {
    if (!CORNERS.includes(d.corner)) fail(path, `corner defect requires corner tl/tr/bl/br`);
    validateOptionalXY(d, path);
    const p = classPenalty(rubric.corner_penalties, d.severity, path);
    return { region: "corners", detail: humanize(`${d.corner} ${d.severity}`), penalty: roundHalfUp(p * mult) };
  }
  if (d.region === "edge") {
    if (!EDGES.includes(d.edge)) fail(path, `edge defect requires edge top/right/bottom/left`);
    validateOptionalXY(d, path);
    validateOptionalLineEndpoints(d, path);
    const p = classPenalty(rubric.edge_penalties, d.severity, path);
    return { region: "edges", detail: humanize(`${d.edge} ${d.severity}`), penalty: roundHalfUp(p * mult) };
  }
  if (d.region === "surface") return surfacePenalty(face, d, rubric, path, mult);
  // crease/stain/print_defect penalties are absolute mid-band grade fits — the
  // generic front multiplier does NOT apply (stain carries explicit per-face columns).
  if (d.region === "crease") {
    if (!rubric.crease_penalties) fail(path, "crease requires a rubric with crease_penalties");
    requireXY(d, path);
    validateOptionalLineEndpoints(d, path);
    const p = classPenalty(rubric.crease_penalties, d.severity, path);
    return { region: "surface", detail: humanize(`crease ${d.severity}`), penalty: p };
  }
  if (d.region === "stain") {
    if (!rubric.stain_penalties) fail(path, "stain requires a rubric with stain_penalties");
    requireXY(d, path);
    const row = classPenalty(rubric.stain_penalties, d.severity, path);
    if (typeof row[face] !== "number") fail(path, "stain_penalties rows must be { front, back } numbers");
    return { region: "surface", detail: humanize(`stain ${d.severity}`), penalty: row[face] };
  }
  if (d.region === "print_defect") {
    if (!rubric.print_defect_penalties) fail(path, "print_defect requires a rubric with print_defect_penalties");
    if (!rubric.print_attributes) fail(path, "print_defect requires a rubric with print_attributes");   // DOUBLE GATE — without it regions.print would be NaN under a partial custom rubric; do NOT drop as redundant
    requireXY(d, path);
    const p = classPenalty(rubric.print_defect_penalties, d.severity, path);
    return { region: "print", detail: humanize(`print ${d.severity}`), penalty: p };
  }
  fail(path, `unknown region "${d.region}" (corner/edge/surface/crease/stain/print_defect)`);
}

function surfacePenalty(face, d, rubric, path, mult) {
  const row = rubric.surface_penalties[d.depth];
  if (!row) fail(path, `depth must be one of ${Object.keys(rubric.surface_penalties).join("/")}`);
  const p = row[d.size];
  if (p == null) fail(path, `size must be one of ${Object.keys(row).join("/")}`);
  requireXY(d, path);
  validateOptionalLineEndpoints(d, path);
  return { region: "surface", detail: humanize(`${d.depth} ${d.size}`), penalty: roundHalfUp(p * mult * classPenalty(rubric.surface_severity_factors, d.severity, path)) };
}

const ALLOWED_TOP_LEVEL_KEYS = ["front", "back", "subject", "rubric"];

export function score(input, rubric) {
  if (input == null || typeof input !== "object") fail("input", "must be an object");
  for (const k of Object.keys(input)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.includes(k)) fail("input", `unknown key "${k}" (allowed: front/back/subject/rubric)`);
  }
  const regionKeys = regionsFor(rubric);
  const faces = {};
  const lineItems = [];
  for (const face of FACES) {
    const f = input[face] ?? {};
    if (typeof f !== "object" || Array.isArray(f)) fail(face, "must be an object");
    const regions = Object.fromEntries(regionKeys.map((r) => [r, rubric.base_points]));
    const cent = centeringPenalty(face, f.centering, rubric, `${face}.centering`);
    if (cent.penalty > 0) {
      lineItems.push({ face, region: "centering", detail: `deviation ${cent.deviation.toFixed(1)}pt`, penalty: cent.penalty });
      regions.centering = Math.max(0, regions.centering - cent.penalty);
    }
    const defects = f.defects ?? [];
    if (!Array.isArray(defects)) fail(`${face}.defects`, "must be an array");
    defects.forEach((d, i) => {
      const { region, detail, penalty } = defectPenalty(face, d, i, rubric, `${face}.defects`);
      lineItems.push({ face, region, detail, penalty });
      regions[region] = Math.max(0, regions[region] - penalty);
    });
    const pr = f.print;
    if (pr != null) {
      if (!rubric.print_attributes) fail(`${face}.print`, "print requires a rubric with print_attributes");
      if (typeof pr !== "object" || Array.isArray(pr)) fail(`${face}.print`, "must be an object");
      for (const [attr, val] of Object.entries(pr)) {
        const table = rubric.print_attributes[attr];
        if (!table) fail(`${face}.print`, `unknown attribute "${attr}" (${Object.keys(rubric.print_attributes).join("/")})`);
        const p = classPenalty(table, val, `${face}.print.${attr}`, "value");
        // Attribute penalties are multiplier-EXEMPT by design. The ladders carry
        // ONE value per rung, applied identically on either face (unlike stains,
        // which have explicit front/back columns), and that value is an absolute
        // mid-band grade fit: it already IS the deduction that lands the card on
        // the intended cap. Applying front_defect_multiplier would overshoot that
        // cap — e.g. gloss some_loss 375 → 625 → grade 6, but ×1.3 → 488 → 512 →
        // grade 5. So no multiplier here, unlike corner/edge/surface.
        if (p > 0) { // zero rungs are the explicit baseline — validated, no line item
          // `attribute` discriminates print-ATTRIBUTE items (this loop only) from
          // print_defect DEFECT items below, which also land in region "print" but
          // must NEVER carry this key — consumers (e.g. public/score.js's defect-row
          // table) filter on it to tell the two apart. CRITICAL: only this push site
          // sets `attribute` — every other line item in this file omits it entirely,
          // so results under a rubric without print_attributes never carry the key.
          lineItems.push({ face, region: "print", attribute: attr, detail: humanize(`${attr} ${val}`), penalty: p });
          regions.print = Math.max(0, regions.print - p);
        }
      }
    }
    faces[face] = { regions, side_points: Math.min(...regionKeys.map((r) => regions[r])) };
  }
  // points floored to integer before the ladder (normative — custom rubrics may yield fractional penalties)
  const points = Math.floor(Math.min(faces.front.side_points, faces.back.side_points));
  const raw = Math.floor(points / rubric.grade_band_points) * 0.5;
  const grade = raw >= 9.5 ? 10 : Math.max(raw, 1);           // 9.5 slot promoted to 10; grade floors at 1
  const binding_face = faces.front.side_points <= faces.back.side_points ? "front" : "back"; // ties resolve to front (<=)
  const br = faces[binding_face].regions;
  // ties resolve to the earliest region in centering→corners→edges→surface(→print) order
  const binding_region = regionKeys.reduce((a, b) => (br[a] <= br[b] ? a : b));
  // order-insensitive: highest min_grade that the grade still reaches wins
  let bandEntry = null;
  for (const b of rubric.condition_bands) {
    if (grade >= b.min_grade && (bandEntry == null || b.min_grade > bandEntry.min_grade)) bandEntry = b;
  }
  if (bandEntry == null) fail("rubric.condition_bands", `no band covers grade ${grade}`);
  const band = bandEntry.band;
  return {
    rubric_id: rubric.rubric_id, rubric_version: rubric.rubric_version,
    points, grade, grade_label: gradeLabel(grade), band,
    binding_face, binding_region, faces, line_items: lineItems,
  };
}

// NON-NORMATIVE presentation. Every grade renders as its bare numeral; consumers
// map `grade` to their own copy rather than parsing or depending on this string.
function gradeLabel(g) {
  return `${g % 1 ? g.toFixed(1) : g}`;
}
