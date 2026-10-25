import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { keepaBrandSearch, keepaConfigured } from "@/lib/deals/keepa";
import { analyzeBrandSearch, cleanBrandName } from "@/lib/deals/screening";

// Runs a Keepa brand search for one prospect, stores the analysis on the
// prospect, and returns it. Costs about 10 Keepa tokens per call.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!keepaConfigured()) return NextResponse.json({ error: "Keepa isn't configured." }, { status: 400 });

  const { prospectId } = await req.json();
  if (!prospectId) return NextResponse.json({ error: "prospectId required." }, { status: 400 });

  const prospect = await db.brandProspect.findUnique({ where: { id: prospectId } });
  if (!prospect) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const { products, tokensLeft } = await keepaBrandSearch(cleanBrandName(prospect.brandName));
    const check = analyzeBrandSearch(prospect.brandName, products as never[], new Date().toISOString());
    const updated = await db.brandProspect.update({
      where: { id: prospectId },
      data: { amazonData: JSON.stringify(check), amazonCheckedAt: new Date() },
      include: { products: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ prospect: updated, tokensLeft });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Amazon check failed." }, { status: 502 });
  }
}
