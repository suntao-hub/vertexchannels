// Screening assist: turns a Keepa brand search into findings, suggests an offer
// mode from Amazon signals plus the channel-presence you entered, and drafts an
// opening line. Pure functions (no fetch) so they run on the server and client.
// Everything here is a suggestion. Presence is the user's input and the Amazon
// data is a sample of Keepa's top results, so claims must be re-checked.

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number | null;
  offers: number;
  monthlySold: number | null;
  rank: number | null;
  amazonSells: boolean;
  buyable: boolean;
}

export interface AmazonCheck {
  checkedAt: string;
  query: string;
  scanned: number; // results Keepa returned
  matched: number; // results whose brand matches
  signal: "high" | "medium" | "low" | "none";
  findings: string[];
  volume: { maxMonthlySold: number | null; bestRank: number | null };
  issues: { noOffer: number; crowded: number; amazonSells: number };
  products: AmazonProduct[];
}

export type Presence = "" | "none" | "thin" | "present";

export interface Suggestion {
  mode: "channel" | "dropship" | null;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  secondary?: string;
  missing: string[]; // data that would sharpen the suggestion
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const SUFFIX = /\b(inc|llc|co|corp|corporation|ltd|limited|company|mfg|manufacturing)\b\.?/gi;

// "Nomad Mfg Inc" -> "Nomad". Used for the search term and for matching.
export function cleanBrandName(name: string): string {
  const c = name.replace(SUFFIX, " ").replace(/[.,]+/g, " ").replace(/\s+/g, " ").trim();
  return c || name.trim();
}

export function brandMatches(brand: string, keepaBrand: string): boolean {
  const a = norm(cleanBrandName(brand));
  const b = norm(keepaBrand);
  if (!a || !b) return false;
  if (a === b) return true;
  // Keepa's brand contains ours ("AGM-Products.com" for "AGM Products"). The
  // reverse only counts when Keepa's brand is long and distinctive, so a
  // different company called just "AGM" does not match "AGM Products".
  return (a.length >= 3 && b.includes(a)) || (b.length >= 6 && a.includes(b));
}

// Short, readable product name: drop the brand prefix, cut at the first separator.
export function shortTitle(title: string, brand: string): string {
  let t = title.trim();
  if (t.toLowerCase().startsWith(brand.toLowerCase())) t = t.slice(brand.length).trim();
  t = t.split(/ [-–|] |,|\(/)[0].trim();
  return t.split(/\s+/).slice(0, 6).join(" ");
}

interface RawProduct {
  asin?: string;
  title?: string;
  brand?: string;
  monthlySold?: number;
  stats?: { current?: number[]; buyBoxPrice?: number; totalOfferCount?: number };
}

export function analyzeBrandSearch(brand: string, raw: RawProduct[], nowIso: string): AmazonCheck {
  const mine = raw.filter((p) => brandMatches(brand, p.brand ?? ""));

  const products: AmazonProduct[] = mine.map((p) => {
    const cur = p.stats?.current ?? [];
    const priceCents = (p.stats?.buyBoxPrice ?? -1) > 0 ? p.stats!.buyBoxPrice! : cur[1] > 0 ? cur[1] : cur[0] > 0 ? cur[0] : -1;
    const offers = Math.max(0, p.stats?.totalOfferCount ?? 0);
    return {
      asin: p.asin ?? "",
      title: p.title ?? "",
      price: priceCents > 0 ? priceCents / 100 : null,
      offers,
      monthlySold: typeof p.monthlySold === "number" ? p.monthlySold : null,
      rank: cur[3] > 0 ? cur[3] : null,
      amazonSells: cur[0] > 0,
      buyable: offers > 0 || priceCents > 0,
    };
  });

  const sold = products.map((p) => p.monthlySold ?? 0);
  const ranks = products.map((p) => p.rank).filter((r): r is number => r != null);
  const maxMonthlySold = sold.length ? Math.max(...sold) : null;
  const bestRank = ranks.length ? Math.min(...ranks) : null;

  const noOffer = products.filter((p) => !p.buyable).length;
  const crowded = products.filter((p) => p.offers >= 10);
  const amazonSells = products.filter((p) => p.amazonSells);

  const hasVolume = (maxMonthlySold ?? 0) >= 100 || (bestRank != null && bestRank <= 60000);
  const hasIssues = noOffer >= 1 || crowded.length >= 1 || amazonSells.length >= 1;
  // Listings that exist but none are buyable yet means no Amazon presence to manage.
  const established = products.some((p) => p.buyable && p.offers >= 1);
  const signal: AmazonCheck["signal"] =
    products.length === 0 ? "none"
    : !established ? "low"
    : hasVolume && hasIssues ? "high" : hasIssues ? "medium" : "low";

  const findings: string[] = [];
  if (products.length === 0) findings.push(`No listings found under the brand "${brand}" in Keepa's top results.`);
  else if (!established) findings.push(`${products.length} listing${products.length === 1 ? "" : "s"} found, but none is buyable yet, so Amazon isn't established.`);
  else if (noOffer >= 1) findings.push(noOffer === products.length
    ? `All ${noOffer} listings checked show no buyable offer.`
    : `${noOffer} of ${products.length} listings checked show no buyable offer.`);
  [...crowded].sort((a, b) => b.offers - a.offers).slice(0, 2).forEach((p) =>
    findings.push(`${shortTitle(p.title, brand)} has ${p.offers} sellers${p.amazonSells ? ", including Amazon itself" : ""}.`));
  if (amazonSells.length >= 1 && !crowded.some((p) => p.amazonSells))
    findings.push(`Amazon itself sells ${amazonSells.length === 1 ? shortTitle(amazonSells[0].title, brand) : `${amazonSells.length} of the listings`}.`);
  if (hasVolume && maxMonthlySold) findings.push(`Best seller moves about ${maxMonthlySold} a month${bestRank ? ` (rank ${bestRank.toLocaleString("en-US")})` : ""}.`);

  const top = [...products]
    .sort((a, b) => (a.rank ?? 9e9) - (b.rank ?? 9e9))
    .slice(0, 8)
    .map((p) => ({ ...p, title: p.title.slice(0, 90) }));

  return {
    checkedAt: nowIso, query: brand, scanned: raw.length, matched: products.length, signal,
    findings, volume: { maxMonthlySold, bestRank },
    issues: { noOffer, crowded: crowded.length, amazonSells: amazonSells.length },
    products: top,
  };
}

export function parseAmazon(json: string): AmazonCheck | null {
  if (!json) return null;
  try { return JSON.parse(json) as AmazonCheck; } catch { return null; }
}

const CHANNELS = [
  { key: "walmartPresence", name: "Walmart" },
  { key: "ebayPresence", name: "eBay" },
  { key: "neweggPresence", name: "Newegg" },
] as const;

export interface PresenceInput {
  walmartPresence: string; ebayPresence: string; neweggPresence: string;
}

const gapNames = (p: PresenceInput) =>
  CHANNELS.filter((c) => p[c.key] === "none" || p[c.key] === "thin").map((c) => c.name);
const namesWhere = (p: PresenceInput, v: "none" | "thin") =>
  CHANNELS.filter((c) => p[c.key] === v).map((c) => c.name);
const checkedCount = (p: PresenceInput) => CHANNELS.filter((c) => p[c.key] !== "").length;

const list = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export function suggestMode(p: PresenceInput, amazon: AmazonCheck | null): Suggestion {
  const gaps = gapNames(p);
  const missing: string[] = [];
  if (!amazon) missing.push("Run the Amazon check");
  if (checkedCount(p) < 3) missing.push("Set Walmart, eBay and Newegg presence");

  if (!amazon && checkedCount(p) === 0)
    return { mode: null, confidence: "low", reasons: ["Not enough data yet."], missing };

  if (amazon && (amazon.signal === "high" || amazon.signal === "medium")) {
    return {
      mode: "channel",
      confidence: amazon.signal === "high" ? "high" : "medium",
      reasons: amazon.findings.slice(0, 3),
      secondary: gaps.length >= 2 ? `Drop ship on ${list(gaps)}.` : undefined,
      missing,
    };
  }

  if (gaps.length >= 2) {
    const why = [`Empty or thin on ${list(gaps)}.`];
    if (amazon?.signal === "none") why.push("Not found on Amazon.");
    else if (amazon) why.push("No Amazon problems found.");
    return { mode: "dropship", confidence: amazon ? "medium" : "low", reasons: why, missing: [...missing, "Confirm the brand ships from US stock"] };
  }

  return {
    mode: null, confidence: "low",
    reasons: [amazon ? "No Amazon problems found and few channel gaps." : "Few channel gaps so far."],
    missing,
  };
}

export interface OpeningInput {
  brandName: string; tradeShow: string; booth: string;
}

export function draftOpening(p: OpeningInput & PresenceInput, amazon: AmazonCheck | null, mode: string): string {
  const show = p.tradeShow.trim();
  const hook = show
    ? `I saw ${p.brandName} was exhibiting at ${show}${p.booth.trim() ? ` (booth ${p.booth.trim()})` : ""}.`
    : "";

  let finding = "";
  if (mode === "dropship") {
    const none = namesWhere(p, "none");
    const thin = namesWhere(p, "thin");
    const onAmazon = amazon && amazon.signal !== "none" && amazon.products.some((x) => x.buyable);
    const parts: string[] = [];
    if (none.length) parts.push(`I couldn't find ${onAmazon ? "it" : p.brandName} on ${list(none)}`);
    if (thin.length) parts.push(`${none.length ? "and it has" : `${p.brandName} has`} very little on ${list(thin)}`);
    if (parts.length) finding = `${onAmazon ? `${p.brandName} looks established on Amazon, and ` : ""}${parts.join(", ")}.`;
  } else if (amazon && amazon.matched > 0 && amazon.products.some((x) => x.buyable)) {
    const crowded = [...amazon.products].filter((x) => x.offers >= 10).sort((a, b) => b.offers - a.offers)[0];
    const amz = amazon.products.find((x) => x.amazonSells);
    if (amazon.issues.noOffer >= 2 || (amazon.issues.noOffer >= 1 && amazon.matched <= 4)) {
      finding = amazon.issues.noOffer === amazon.matched
        ? `None of the ${amazon.matched} ${p.brandName} listings I checked on Amazon shows a buyable offer right now.`
        : `${amazon.issues.noOffer} of the ${amazon.matched} ${p.brandName} listings I checked on Amazon show no buyable offer right now.`;
    } else if (crowded) {
      finding = `Your ${shortTitle(crowded.title, p.brandName)} has ${crowded.offers} sellers on Amazon${crowded.amazonSells ? ", including Amazon itself" : ""}.`;
    } else if (amz) {
      finding = `Amazon itself sells your ${shortTitle(amz.title, p.brandName)}.`;
    } else if (amazon.volume.maxMonthlySold && amazon.volume.maxMonthlySold >= 100) {
      const best = [...amazon.products].sort((a, b) => (b.monthlySold ?? 0) - (a.monthlySold ?? 0))[0];
      finding = `Your ${shortTitle(best.title, p.brandName)} is selling well on Amazon, around ${best.monthlySold} a month.`;
    }
  }
  return [hook, finding].filter(Boolean).join(" ");
}

export function marketplaceLinks(brand: string) {
  const q = encodeURIComponent(brand);
  return [
    { name: "Amazon", url: `https://www.amazon.com/s?k=${q}` },
    { name: "Walmart", url: `https://www.walmart.com/search?q=${q}` },
    { name: "eBay", url: `https://www.ebay.com/sch/i.html?_nkw=${q}` },
    { name: "Newegg", url: `https://www.newegg.com/p/pl?d=${q}` },
  ];
}
