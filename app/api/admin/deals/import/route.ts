import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";

interface ImportRow {
  brandName: string;
  website?: string;
  category?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  openingLine?: string;
  angle?: string;
  tradeShow?: string;
  fitRank?: number | null;
  booth?: string;
  notes?: string;
}

const ANGLES = new Set(["channel", "dropship", "excess", "partner"]);

// pull the first integer out of things like "1", "1 of 35", "#1"
function parseRank(v: unknown): number | null {
  const m = String(v ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// Bulk-create prospects from a parsed CSV. Dedupes by brand name
// (case-insensitive) against everything already in the pipeline.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rows, source, tradeShow } = (await req.json()) as {
    rows: ImportRow[]; source?: string; tradeShow?: string;
  };
  const show = (tradeShow ?? "").trim().slice(0, 80);

  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "No rows." }, { status: 400 });
  if (rows.length > 2000)
    return NextResponse.json({ error: "Too many rows (max 2000)." }, { status: 400 });

  const existing = await db.brandProspect.findMany({ select: { brandName: true } });
  const seen = new Set(existing.map((p) => p.brandName.trim().toLowerCase()));

  let created = 0;
  let skipped = 0;
  const createdNames: string[] = [];

  for (const r of rows) {
    const name = (r.brandName ?? "").trim();
    if (!name) { skipped++; continue; }
    const key = name.toLowerCase();
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);

    // A row's own show wins over the batch-wide one.
    const rowShow = (r.tradeShow ?? "").trim().slice(0, 80) || show;
    const angle = (r.angle ?? "").trim().toLowerCase();

    await db.brandProspect.create({
      data: {
        brandName: name,
        website: (r.website ?? "").trim(),
        category: (r.category ?? "").trim(),
        contactEmail: (r.contactEmail ?? "").trim(),
        contactName: (r.contactName ?? "").trim().slice(0, 120),
        contactPhone: (r.contactPhone ?? "").trim().slice(0, 80),
        openingLine: (r.openingLine ?? "").trim().slice(0, 600),
        ...(ANGLES.has(angle) ? { angle } : {}),
        fitRank: parseRank(r.fitRank),
        notes: (r.notes ?? "").trim(),
        source: source === "smartscout" ? "smartscout" : "import",
        ...(rowShow ? { tradeShow: rowShow, booth: (r.booth ?? "").trim().slice(0, 60), showStatus: "to_visit" } : {}),
      },
    });
    created++;
    createdNames.push(name);
  }

  return NextResponse.json({ created, skipped, createdNames });
}
