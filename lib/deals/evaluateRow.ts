// Bridges a stored ProspectProduct row to the pure scoring engine.
import type { Prisma } from "@/app/generated/prisma";
import { evaluate, type ProductMetrics, type Tri } from "./scoring";

type Bool = boolean | null | undefined;
const tri = (v: Bool): Tri => (v == null ? null : v);
const num = (v: number | null | undefined): number | null => (v == null ? null : v);

export interface ProductRow {
  primeLowPrice: number | null;
  unitsPerMonth: number | null;
  reviewCount: number | null;
  sellerCount: number | null;
  amazonIsSeller: Bool;
  priceStable90d: Bool;
  salesStable90d: Bool;
  merchantFulfilledControlsBB: Bool;
  suppressedBuyBox: Bool;
  manufacturerOnListing: Bool;
  brandRestricted: Bool;
  isThirdPartyBundle: Bool;
  isMultipack: Bool;
  hasFragileItems: Bool;
  hazmat: Bool;
}

export function metricsFromRow(r: Partial<ProductRow>): ProductMetrics {
  return {
    primeLowPrice: num(r.primeLowPrice),
    unitsPerMonth: num(r.unitsPerMonth),
    reviewCount: num(r.reviewCount),
    sellerCount: num(r.sellerCount),
    amazonIsSeller: tri(r.amazonIsSeller),
    priceStable90d: tri(r.priceStable90d),
    salesStable90d: tri(r.salesStable90d),
    merchantFulfilledControlsBB: tri(r.merchantFulfilledControlsBB),
    suppressedBuyBox: tri(r.suppressedBuyBox),
    manufacturerOnListing: tri(r.manufacturerOnListing),
    brandRestricted: tri(r.brandRestricted),
    isThirdPartyBundle: tri(r.isThirdPartyBundle),
    isMultipack: tri(r.isMultipack),
    hasFragileItems: tri(r.hasFragileItems),
    hazmat: tri(r.hazmat),
  };
}

export function recompute(r: Partial<ProductRow>) {
  const m = metricsFromRow(r);
  const full = evaluate(m);
  // hazmat is an automatic disqualifier
  const gatesStatus = m.hazmat === true ? "fail" : full.gates.status;
  const scoreDetail = {
    derived: full.derived,
    gates: full.gates.gates,
    criteria: full.score.criteria,
    maxScore: full.score.maxScore,
    hazmatDisqualified: m.hazmat === true,
  };
  return {
    score: full.score.score,
    band: full.score.band,
    gatesStatus,
    scoredAt: new Date(),
    scoreDetail: JSON.parse(JSON.stringify(scoreDetail)) as Prisma.InputJsonValue,
  };
}
