import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { recompute, type ProductRow } from "@/lib/deals/evaluateRow";

const NUM_FIELDS = [
  "primeLowPrice", "unitsPerMonth", "reviewCount", "rating", "sellerCount",
  "buyCost", "prepCost", "shipCostPerUnit", "targetRoi", "fbaFee", "referralRate",
] as const;
const BOOL_FIELDS = [
  "amazonIsSeller", "priceStable90d", "salesStable90d", "merchantFulfilledControlsBB",
  "suppressedBuyBox", "manufacturerOnListing", "brandRestricted",
  "isThirdPartyBundle", "isMultipack", "hasFragileItems", "hazmat",
] as const;
const STR_FIELDS = ["title", "productUrl", "snapshotSource"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const data: Record<string, unknown> = {};
  for (const f of NUM_FIELDS)
    if (b[f] !== undefined) data[f] = b[f] === null || b[f] === "" ? null : Number(b[f]);
  for (const f of BOOL_FIELDS)
    if (b[f] !== undefined) data[f] = b[f] === null ? null : Boolean(b[f]);
  for (const f of STR_FIELDS) if (b[f] !== undefined) data[f] = b[f];

  const merged = { ...(await db.prospectProduct.findUniqueOrThrow({ where: { id } })), ...data };
  const scored = recompute(merged as unknown as Partial<ProductRow>);

  const product = await db.prospectProduct.update({
    where: { id },
    data: { ...data, ...scored },
  });
  await db.brandProspect.update({
    where: { id: product.prospectId },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.prospectProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
