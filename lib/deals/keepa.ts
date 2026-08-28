// Keepa adapter — turns a raw Keepa /product response into the normalized
// fields the scoring engine consumes. Any field Keepa can't answer is left
// `null` so the UI falls back to manual entry.
//
// CsvType indices (see keepacom/api_backend Product.java):
//   0 AMAZON · 1 NEW · 3 SALES · 10 NEW_FBA · 11 COUNT_NEW · 16 RATING (0-50)
//   17 COUNT_REVIEWS · 18 BUY_BOX_SHIPPING
// Prices are integer cents; -1 / -2 mean "no data".

const AMAZON_SELLER_ID = "ATVPDKIKX0DER";
const KEEPA_DOMAIN_US = 1;

const CSV = {
  AMAZON: 0, NEW: 1, SALES: 3, NEW_FBA: 10, COUNT_NEW: 11,
  RATING: 16, COUNT_REVIEWS: 17, BUY_BOX_SHIPPING: 18,
} as const;

export interface KeepaSnapshot {
  asin: string;
  title: string;
  productUrl: string;
  primeLowPrice: number | null;
  unitsPerMonth: number | null;
  reviewCount: number | null;
  rating: number | null;
  sellerCount: number | null;
  amazonIsSeller: boolean | null;
  priceStable90d: boolean | null;
  salesStable90d: boolean | null;
  merchantFulfilledControlsBB: boolean | null;
  suppressedBuyBox: boolean | null;
  fbaFee: number | null; // $ pick & pack
  referralRate: number | null; // fraction
  raw: { salesRank: number | null; salesRank90d: number | null };
}

const cents = (v: unknown): number | null =>
  typeof v === "number" && v >= 0 ? v / 100 : null;

const firstNonNeg = (...vals: unknown[]): number | null => {
  for (const v of vals) if (typeof v === "number" && v >= 0) return v;
  return null;
};

const within = (a: number, b: number, pct: number) =>
  b > 0 && Math.abs(a - b) / b <= pct;

export function keepaConfigured(): boolean {
  return !!process.env.KEEPA_API_KEY;
}

export async function keepaLookup(asin: string): Promise<KeepaSnapshot | null> {
  const key = process.env.KEEPA_API_KEY;
  if (!key) return null;

  const url =
    `https://api.keepa.com/product?key=${key}&domain=${KEEPA_DOMAIN_US}` +
    `&asin=${encodeURIComponent(asin)}&stats=90&offers=20&buybox=1&rating=1`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Keepa API ${res.status}`);
  const data = await res.json();
  const p = data?.products?.[0];
  if (!p) return null;

  const stats = p.stats ?? {};
  const cur: number[] = stats.current ?? [];
  const avg90: number[] = stats.avg90 ?? [];

  const primeLowPrice =
    cents(stats.buyBoxPrice) ??
    cents(cur[CSV.NEW]) ??
    cents(cur[CSV.BUY_BOX_SHIPPING]) ??
    cents(cur[CSV.NEW_FBA]) ??
    cents(cur[CSV.AMAZON]);

  const unitsPerMonth = typeof p.monthlySold === "number" ? p.monthlySold : null;
  const reviewCount = firstNonNeg(cur[CSV.COUNT_REVIEWS]);
  const ratingRaw = cur[CSV.RATING];
  const rating = typeof ratingRaw === "number" && ratingRaw >= 0 ? ratingRaw / 10 : null;

  // Prefer the fresh total offer count; fall back to the historical COUNT_NEW.
  const sellerCount = firstNonNeg(stats.totalOfferCount, cur[CSV.COUNT_NEW]);

  const amazonIsSeller =
    stats.buyBoxIsAmazon === true
      ? true
      : p.availabilityAmazon === undefined && stats.buyBoxIsAmazon == null
        ? null
        : p.availabilityAmazon !== -1;

  const newCur = cur[CSV.NEW];
  const newAvg = avg90[CSV.NEW];
  const priceStable90d =
    typeof newCur === "number" && newCur >= 0 && typeof newAvg === "number" && newAvg >= 0
      ? within(newCur, newAvg, 0.1)
      : null;

  // Sales stability — prefer Keepa's 90-day change in units sold; allow up to a
  // 35% decline before calling a listing unstable. Fall back to sales-rank drift.
  const delta = stats.deltaPercent90_monthlySold;
  const rankCur = cur[CSV.SALES];
  const rankAvg = avg90[CSV.SALES];
  const salesStable90d =
    unitsPerMonth == null
      ? null
      : typeof delta === "number"
        ? delta >= -35
        : typeof rankCur === "number" && rankCur >= 0 && typeof rankAvg === "number" && rankAvg >= 0
          ? rankCur / rankAvg <= 2
          : null;

  const bbSeller: string | null = stats.buyBoxSellerId ?? null;
  const bbIsFba: boolean | null =
    typeof stats.buyBoxIsFBA === "boolean" ? stats.buyBoxIsFBA : null;

  const hasOffers = typeof stats.totalOfferCount === "number" && stats.totalOfferCount > 0;
  const suppressedBuyBox =
    bbSeller == null
      ? hasOffers ? true : null
      : bbSeller === "" || bbSeller === "-1" || bbSeller === "-2";

  const merchantFulfilledControlsBB =
    suppressedBuyBox === true || bbSeller === AMAZON_SELLER_ID
      ? false
      : bbIsFba == null
        ? null
        : bbIsFba === false;

  const fbaFee = cents(p.fbaFees?.pickAndPackFee);
  const refRaw = p.referralFeePercent ?? p.referralFeePercentage;
  const referralRate = typeof refRaw === "number" && refRaw > 0 ? refRaw / 100 : null;

  return {
    asin,
    title: p.title ?? "",
    productUrl: `https://www.amazon.com/dp/${asin}`,
    primeLowPrice,
    unitsPerMonth,
    reviewCount,
    rating,
    sellerCount,
    amazonIsSeller,
    priceStable90d,
    salesStable90d,
    merchantFulfilledControlsBB,
    suppressedBuyBox,
    fbaFee,
    referralRate,
    raw: {
      salesRank: typeof rankCur === "number" && rankCur >= 0 ? rankCur : null,
      salesRank90d: typeof rankAvg === "number" && rankAvg >= 0 ? rankAvg : null,
    },
  };
}

export function extractAsin(input: string): string | null {
  const s = input.trim();
  if (/^[A-Z0-9]{10}$/i.test(s)) return s.toUpperCase();
  const m =
    s.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})/i) ??
    s.match(/[/?&](?:asin|ASIN)=([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
}
