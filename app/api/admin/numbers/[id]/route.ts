import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";

const BUSINESSES = ["channels", "launch"];
const STATUSES = ["active", "paused", "ended"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim().slice(0, 120);
  if (BUSINESSES.includes(b.business)) data.business = b.business;
  if (STATUSES.includes(b.status)) data.status = b.status;
  if (b.monthlyFee !== undefined) data.monthlyFee = Math.max(0, Math.round(Number(b.monthlyFee) || 0));
  if (typeof b.notes === "string") data.notes = b.notes.slice(0, 500);
  if (b.startedAt !== undefined) {
    data.startedAt = /^\d{4}-\d{2}-\d{2}$/.test(String(b.startedAt)) ? new Date(`${b.startedAt}T12:00:00.000Z`) : null;
  }

  const client = await db.clientAccount.update({ where: { id }, data });
  return NextResponse.json(client);
}

// ?kind=week deletes a weekly log row; otherwise a client.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (req.nextUrl.searchParams.get("kind") === "week") await db.weeklyLog.delete({ where: { id } });
  else await db.clientAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
