import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { recompute } from "@/lib/deals/evaluateRow";
import { keepaLookup, extractAsin, type KeepaSnapshot } from "@/lib/deals/keepa";

// Add a candidate product (ASIN) to a prospect. If a Keepa key is configured
// and `autoLookup` is set, the snapshot is fetched and scored immediately.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();

  if (!b.prospectId) return NextResponse.json({ error: "prospectId required." }, { status: 400 });
  const asin = extractAsin(b.asin ?? "");
  if (!asin) return NextResponse.json({ error: "Valid ASIN or Amazon URL required." }, { status: 400 });

  let snap: KeepaSnapshot | null = null;
  if (b.autoLookup) {
    try { snap = await keepaLookup(asin); }
    catch (e) { console.error("[deals/product] keepa", e); }
  }

  const snapFields = snap
    ? {
        title: snap.title,
        productUrl: snap.productUrl,
        primeLowPrice: snap.primeLowPrice,
        unitsPerMonth: snap.unitsPerMonth,
        reviewCount: snap.reviewCount,
        rating: snap.rating,
        sellerCount: snap.sellerCount,
        amazonIsSeller: snap.amazonIsSeller,
        priceStable90d: snap.priceStable90d,
        salesStable90d: snap.salesStable90d,
        merchantFulfilledControlsBB: snap.merchantFulfilledControlsBB,
        suppressedBuyBox: snap.suppressedBuyBox,
        fbaFee: snap.fbaFee,
        referralRate: snap.referralRate,
        snapshotSource: "keepa",
        snapshotAt: new Date(),
      }
    : { title: "", productUrl: `https://www.amazon.com/dp/${asin}` };

  const scored = recompute(snapFields);

  const product = await db.prospectProduct.create({
    data: {
      prospectId: b.prospectId as string,
      asin,
      ...snapFields,
      ...scored,
    },
  });

  await db.brandProspect.update({ where: { id: b.prospectId }, data: { updatedAt: new Date() } });
  return NextResponse.json(product);
}
