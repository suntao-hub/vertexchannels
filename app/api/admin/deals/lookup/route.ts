import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/admin/auth";
import { keepaLookup, keepaConfigured, extractAsin } from "@/lib/deals/keepa";

// Fetch a Keepa snapshot for an ASIN without persisting it — used to preview
// data before adding a product, or to refresh an existing one.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { input } = await req.json();

  const asin = extractAsin(input ?? "");
  if (!asin) return NextResponse.json({ error: "Valid ASIN or Amazon URL required." }, { status: 400 });
  if (!keepaConfigured())
    return NextResponse.json({ asin, configured: false, snapshot: null });

  try {
    const snapshot = await keepaLookup(asin);
    return NextResponse.json({ asin, configured: true, snapshot });
  } catch (e) {
    console.error("[deals/lookup]", e);
    return NextResponse.json({ error: "Keepa lookup failed." }, { status: 502 });
  }
}
