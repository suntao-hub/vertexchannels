import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";

const STR_FIELDS = [
  "brandName", "website", "contactName", "contactEmail", "contactPhone",
  "category", "stage", "source", "archiveReason", "notes",
] as const;
const DATE_FIELDS = ["firstEmailAt", "secondEmailAt"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const data: Record<string, unknown> = {};
  for (const f of STR_FIELDS) if (b[f] !== undefined) data[f] = b[f];
  for (const f of DATE_FIELDS)
    if (b[f] !== undefined) data[f] = b[f] ? new Date(b[f]) : null;

  const prospect = await db.brandProspect.update({
    where: { id },
    data,
    include: { products: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(prospect);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.brandProspect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
