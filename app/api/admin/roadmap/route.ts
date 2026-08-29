import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { DEFAULT_ROADMAP } from "@/lib/deals/roadmap";

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((await db.roadmapItem.count()) === 0) {
    await db.roadmapItem.createMany({ data: DEFAULT_ROADMAP });
  }
  const items = await db.roadmapItem.findMany({ orderBy: [{ phase: "asc" }, { order: "asc" }] });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.title?.trim() || !b.phase) return NextResponse.json({ error: "title and phase required." }, { status: 400 });
  const max = await db.roadmapItem.aggregate({ where: { phase: b.phase }, _max: { order: true } });
  const item = await db.roadmapItem.create({
    data: {
      phase: b.phase,
      title: b.title.trim(),
      detail: b.detail?.trim() ?? "",
      order: (max._max.order ?? 0) + 1,
    },
  });
  return NextResponse.json(item);
}
