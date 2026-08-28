// The Wholesale Formula scouting rubric, reproduced as code.
//
// Two stages:
//   1. Four hard GATES — fail any one and the product is dead.
//   2. Sixteen weighted CRITERIA summing to 100 points, with priority bands.
//
// A criterion / gate is `true` (met), `false` (not met), or `null` (unknown —
// data not yet gathered). Score only counts criteria that are explicitly `true`.

export type Tri = boolean | null;

export interface ProductMetrics {
  primeLowPrice: number | null;
  unitsPerMonth: number | null;
  reviewCount: number | null;
  sellerCount: number | null; // competitive sellers, excluding us
  amazonIsSeller: Tri;
  priceStable90d: Tri;
  salesStable90d: Tri;
  merchantFulfilledControlsBB: Tri;
  suppressedBuyBox: Tri;
  manufacturerOnListing: Tri;
  brandRestricted: Tri;
  isThirdPartyBundle: Tri;
  isMultipack: Tri;
  hasFragileItems: Tri;
  hazmat: Tri;
}

export interface DerivedMetrics {
  monthlyRevenue: number | null;
  equityUnits: number | null; // your rotation share if you join as a seller
  equityRevenue: number | null;
  estProfit15: number | null; // 15%-margin proxy on equity revenue
}

export function derive(m: ProductMetrics): DerivedMetrics {
  const { primeLowPrice: price, unitsPerMonth: units, sellerCount: sellers } = m;
  const monthlyRevenue = price != null && units != null ? price * units : null;
  const denom = sellers != null ? sellers + 1 : null; // +1 == us joining
  const equityUnits = units != null && denom ? units / denom : null;
  const equityRevenue = monthlyRevenue != null && denom ? monthlyRevenue / denom : null;
  const estProfit15 = equityRevenue != null ? 0.15 * equityRevenue : null;
  return { monthlyRevenue, equityUnits, equityRevenue, estProfit15 };
}

// ─── Gates ───────────────────────────────────────────────────────────────────

export interface GateResult {
  key: string;
  label: string;
  passed: Tri;
}

export interface GateEvaluation {
  gates: GateResult[];
  status: "pass" | "fail" | "incomplete";
}

export function evaluateGates(
  m: ProductMetrics,
  d: DerivedMetrics,
  minPrice = 20,
): GateEvaluation {
  const gates: GateResult[] = [
    {
      key: "price",
      label: `Amazon price ≥ $${minPrice}`,
      passed: m.primeLowPrice == null ? null : m.primeLowPrice >= minPrice,
    },
    {
      key: "amazon_absent",
      label: "Amazon is NOT a seller",
      passed: m.amazonIsSeller == null ? null : m.amazonIsSeller === false,
    },
    {
      key: "not_sole_seller",
      label: "Brand owner is NOT the only seller",
      passed: m.sellerCount == null ? null : m.sellerCount >= 2,
    },
    {
      key: "equity_min",
      label: "Est. sales equity ≥ 20 units/mo",
      passed: d.equityUnits == null ? null : d.equityUnits >= 20,
    },
  ];

  let status: GateEvaluation["status"] = "pass";
  if (gates.some((g) => g.passed === false)) status = "fail";
  else if (gates.some((g) => g.passed === null)) status = "incomplete";

  return { gates, status };
}

// ─── Weighted rubric ─────────────────────────────────────────────────────────

export interface Criterion {
  key: string;
  label: string;
  weight: number;
  passed: Tri;
  auto: boolean; // true == resolvable from a data feed; false == manual review
}

export interface ScoreEvaluation {
  criteria: Criterion[];
  score: number;
  maxScore: number;
  band: "high_priority" | "contact" | "archive";
}

export function evaluateScore(m: ProductMetrics, d: DerivedMetrics): ScoreEvaluation {
  const not = (v: Tri): Tri => (v == null ? null : v === false);

  const criteria: Criterion[] = [
    { key: "vol90", label: "Est. sales volume > 90/mo", weight: 8, auto: true,
      passed: m.unitsPerMonth == null ? null : m.unitsPerMonth > 90 },
    { key: "equity60", label: "Our sales equity > 60 units/mo", weight: 10, auto: true,
      passed: d.equityUnits == null ? null : d.equityUnits > 60 },
    { key: "reviews25", label: "Product has > 25 reviews", weight: 4, auto: true,
      passed: m.reviewCount == null ? null : m.reviewCount > 25 },
    { key: "sales_stable", label: "Stable sales over 90 days", weight: 8, auto: true,
      passed: m.salesStable90d },
    { key: "price_stable", label: "Price stable over 90 days (±10%)", weight: 8, auto: true,
      passed: m.priceStable90d },
    { key: "mfn_bb", label: "Merchant-fulfilled controls buy box", weight: 4, auto: true,
      passed: m.merchantFulfilledControlsBB },
    { key: "mfr_on_listing", label: "Manufacturer on listing w/ others", weight: 2, auto: false,
      passed: m.manufacturerOnListing },
    { key: "suppressed_bb", label: "Product has suppressed buy box", weight: 4, auto: true,
      passed: m.suppressedBuyBox },
    { key: "rev1200", label: "Listing generates > $1,200/mo sales", weight: 8, auto: true,
      passed: d.monthlyRevenue == null ? null : d.monthlyRevenue > 1200 },
    { key: "equity_rev400", label: "Our equity of sales > $400/mo", weight: 10, auto: true,
      passed: d.equityRevenue == null ? null : d.equityRevenue > 400 },
    { key: "profit250", label: "Est. profit (15% margin) > $250/mo", weight: 10, auto: true,
      passed: d.estProfit15 == null ? null : d.estProfit15 > 250 },
    { key: "brand_restricted", label: "Product is brand-restricted", weight: 6, auto: false,
      passed: m.brandRestricted },
    { key: "not_bundle", label: "Listing is NOT a 3P bundle", weight: 4, auto: false,
      passed: not(m.isThirdPartyBundle) },
    { key: "not_multipack", label: "Listing is NOT a multi-pack", weight: 4, auto: false,
      passed: not(m.isMultipack) },
    { key: "not_fragile", label: "Does NOT contain fragile items", weight: 6, auto: false,
      passed: not(m.hasFragileItems) },
    { key: "sellers_gt3", label: "Greater than three unique sellers", weight: 4, auto: true,
      passed: m.sellerCount == null ? null : m.sellerCount > 3 },
  ];

  const score = criteria.reduce((s, c) => s + (c.passed === true ? c.weight : 0), 0);
  const maxScore = criteria.reduce((s, c) => s + c.weight, 0); // 100
  const band = score >= 76 ? "high_priority" : score >= 66 ? "contact" : "archive";

  return { criteria, score, maxScore, band };
}

export interface FullEvaluation {
  derived: DerivedMetrics;
  gates: GateEvaluation;
  score: ScoreEvaluation;
}

export function evaluate(m: ProductMetrics, minPrice = 20): FullEvaluation {
  const derived = derive(m);
  return {
    derived,
    gates: evaluateGates(m, derived, minPrice),
    score: evaluateScore(m, derived),
  };
}
