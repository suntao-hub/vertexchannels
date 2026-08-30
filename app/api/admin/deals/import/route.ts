import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";

interface ImportRow {
  brandName: string;
  website?: string;
  category?: string;
  contactEmail?: string;
  fitRank?: number | null;
  notes?: string;
}

// pull the first integer out of things like "1", "1 of 35", "#1"
function parseRank(v: unknown): number | null {
  const m = String(v ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// Bulk-create prospects from a parsed CSV. Dedupes by brand name
// (case-insensitive) against everything already in the pipeline.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rows, source } = (await req.json()) as { rows: ImportRow[]; source?: string };

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

    await db.brandProspect.create({
      data: {
        brandName: name,
        website: (r.website ?? "").trim(),
        category: (r.category ?? "").trim(),
        contactEmail: (r.contactEmail ?? "").trim(),
        fitRank: parseRank(r.fitRank),
        notes: (r.notes ?? "").trim(),
        source: source === "smartscout" ? "smartscout" : "import",
      },
    });
    created++;
    createdNames.push(name);
  }

  return NextResponse.json({ created, skipped, createdNames });
}
