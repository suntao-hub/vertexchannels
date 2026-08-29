import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prospects = await db.brandProspect.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      products: { orderBy: { createdAt: "asc" } },
      emails: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json(prospects);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.brandName?.trim())
    return NextResponse.json({ error: "Brand name required." }, { status: 400 });

  const prospect = await db.brandProspect.create({
    data: {
      brandName: b.brandName.trim(),
      website: b.website?.trim() ?? "",
      category: b.category?.trim() ?? "",
      contactName: b.contactName?.trim() ?? "",
      contactEmail: b.contactEmail?.trim() ?? "",
      contactPhone: b.contactPhone?.trim() ?? "",
      source: b.source ?? "manual",
      notes: b.notes ?? "",
    },
    include: { products: true },
  });
  return NextResponse.json(prospect);
}
