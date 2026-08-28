// Standalone calculators from the TWF workbook, plus the Vertex Channels
// excess-inventory model.

// ─── ASP Calculator ──────────────────────────────────────────────────────────
// Minimum Amazon selling price to hit a target ROI, given prep + shipping.
// Workbook formula:  price = (prep + ship + 3.5) / (0.35 - 0.5 * roi)
//   3.5  ≈ flat FBA pick/pack fee (standard size)
//   0.5  = keystone cost ratio (buy at 50% of retail)
//   0.35 = 1 - 0.5 (cost) - 0.15 (Amazon referral)

export interface AspInput {
  prepCost: number;
  shipCostPerUnit: number;
  targetRoi: number; // fraction
  fbaFee?: number;
  costRatio?: number;
  referralRate?: number;
}

export function aspMinPrice(i: AspInput): number | null {
  const fbaFee = i.fbaFee ?? 3.5;
  const costRatio = i.costRatio ?? 0.5;
  const referralRate = i.referralRate ?? 0.15;
  const denom = 1 - costRatio - referralRate - costRatio * i.targetRoi;
  if (denom <= 0) return null;
  return (i.prepCost + i.shipCostPerUnit + fbaFee) / denom;
}

// ─── Sales equity ────────────────────────────────────────────────────────────
// Your rotation share of a listing's sales once you become the Nth seller.

export function salesEquity(unitsPerMonth: number, price: number, sellerCount: number) {
  const denom = sellerCount + 1; // +1 == us
  return {
    equityUnits: unitsPerMonth / denom,
    equityRevenue: (unitsPerMonth * price) / denom,
  };
}

// ─── Deal economics (single unit) ────────────────────────────────────────────

export interface UnitEconInput {
  sellPrice: number;
  buyCost: number;
  prepCost: number;
  shipCostPerUnit: number;
  referralRate?: number; // default 0.15
  fbaFee?: number; // default 3.5
}

export function unitEconomics(i: UnitEconInput) {
  const referralRate = i.referralRate ?? 0.15;
  const fbaFee = i.fbaFee ?? 3.5;
  const referral = i.sellPrice * referralRate;
  const netProfit =
    i.sellPrice - referral - fbaFee - i.buyCost - i.prepCost - i.shipCostPerUnit;
  const margin = i.sellPrice > 0 ? netProfit / i.sellPrice : null;
  const roi = i.buyCost > 0 ? netProfit / i.buyCost : null;
  return { netProfit, margin, roi, referral, fbaFee };
}

// ─── Excess-inventory recovery scenario ──────────────────────────────────────
// Compare "sell to a liquidator now" against "run a promo across our channels".

const WEEKS_PER_MONTH = 4.345;

export interface ExcessInput {
  unitsOnHand: number;
  unitCost: number; // brand/client cost basis per unit
  monthlyHoldingCostPerUnit: number; // storage / capital carrying cost
  liquidationPricePerUnit: number; // net offer from a liquidator today
  promoPricePerUnit: number; // expected gross price across our channels
  promoSelloutWeeks: number; // time to clear the stock via promo
  promoChannelFeeRate: number; // blended marketplace fee, e.g. 0.15
}

export function excessScenario(i: ExcessInput) {
  const costBasis = i.unitsOnHand * i.unitCost;

  const liquidateNow = i.unitsOnHand * i.liquidationPricePerUnit;

  const holdingCost =
    i.unitsOnHand *
    i.monthlyHoldingCostPerUnit *
    (i.promoSelloutWeeks / WEEKS_PER_MONTH) *
    0.5; // avg units on hand halves as the promo sells through
  const promoGross = i.unitsOnHand * i.promoPricePerUnit;
  const promoFees = promoGross * i.promoChannelFeeRate;
  const promoNet = promoGross - promoFees - holdingCost;

  return {
    costBasis,
    liquidateNow,
    liquidateRecoveryPct: costBasis > 0 ? liquidateNow / costBasis : null,
    promoGross,
    promoFees,
    holdingCost,
    promoNet,
    promoRecoveryPct: costBasis > 0 ? promoNet / costBasis : null,
    advantage: promoNet - liquidateNow, // >0 == promo wins
  };
}
