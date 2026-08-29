import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const data: Record<string, unknown> = {};
  for (const f of ["name", "subject", "body"] as const) if (b[f] !== undefined) data[f] = b[f];
  for (const f of ["step", "waitDays"] as const) if (b[f] !== undefined) data[f] = Number(b[f]) || 0;
  if (b.active !== undefined) data.active = Boolean(b.active);

  const template = await db.emailTemplate.update({ where: { id }, data });
  return NextResponse.json(template);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.emailTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
