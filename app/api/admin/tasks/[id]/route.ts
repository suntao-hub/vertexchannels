import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { AREAS } from "@/lib/tasks";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof b.title === "string" && b.title.trim()) data.title = b.title.trim().slice(0, 200);
  if (typeof b.detail === "string") data.detail = b.detail.slice(0, 2000);
  if (typeof b.area === "string" && b.area in AREAS) data.area = b.area;
  if (typeof b.blocker === "boolean") data.blocker = b.blocker;
  if (b.dueDate !== undefined) {
    data.dueDate = b.dueDate ? new Date(`${String(b.dueDate).slice(0, 10)}T12:00:00.000Z`) : null;
  }
  if (b.status === "done" || b.status === "todo") {
    data.status = b.status;
    data.doneAt = b.status === "done" ? new Date() : null;
  }

  const task = await db.task.update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
