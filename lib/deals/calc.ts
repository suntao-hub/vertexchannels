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

// ─── Excess-inventory consignment scenario ───────────────────────────────────
// Early-stage model: Vertex Channels lists the brand's excess on the right
// clearance channels; the brand keeps the stock and ships each order direct as
// it sells; VC takes a commission on the proceeds.
// No lot purchase, no capital outlay. Compares "consign with us" against the
// brand doing nothing (keeps paying to store it, recovers $0).

const WEEKS_PER_MONTH = 4.345;

export interface ExcessInput {
  unitsOnHand: number;
  unitCost: number; // brand cost basis per unit
  monthlyHoldingCostPerUnit: number; // storage / capital carrying cost
  clearancePricePerUnit: number; // expected gross sale price on clearance channels
  selloutWeeks: number; // time to clear the stock
  channelFeeRate: number; // blended marketplace fee, e.g. 0.15
  vcCommissionRate: number; // VC's cut of post-fee proceeds, e.g. 0.20
}

export function excessScenario(i: ExcessInput) {
  const costBasis = i.unitsOnHand * i.unitCost;

  // holding cost the brand keeps paying if it does nothing, over the window it
  // would otherwise have cleared the stock (avg on-hand halves as it sells)
  const holdingDuringSellout =
    i.unitsOnHand *
    i.monthlyHoldingCostPerUnit *
    (i.selloutWeeks / WEEKS_PER_MONTH) *
    0.5;

  const gross = i.unitsOnHand * i.clearancePricePerUnit;
  const channelFees = gross * i.channelFeeRate;
  const afterFees = gross - channelFees;
  const vcCommission = afterFees * i.vcCommissionRate;
  const brandNet = afterFees - vcCommission; // found revenue to the brand

  return {
    costBasis,
    gross,
    channelFees,
    vcCommission,
    brandNet,
    brandRecoveryPct: costBasis > 0 ? brandNet / costBasis : null,
    holdingDuringSellout,
    // vs. doing nothing: brand nets this AND stops the carrying cost
    brandAdvantage: brandNet + holdingDuringSellout,
  };
}
