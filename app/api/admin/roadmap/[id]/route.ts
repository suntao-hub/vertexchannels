import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const data: Record<string, unknown> = {};
  if (b.title !== undefined) data.title = String(b.title);
  if (b.detail !== undefined) data.detail = String(b.detail);
  if (b.phase !== undefined) data.phase = String(b.phase);
  if (b.order !== undefined) data.order = Number(b.order) || 0;
  if (b.done !== undefined) {
    data.done = Boolean(b.done);
    data.doneAt = b.done ? new Date() : null;
  }

  const item = await db.roadmapItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.roadmapItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
