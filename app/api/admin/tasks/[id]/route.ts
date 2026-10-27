import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { AREAS, nextDue } from "@/lib/tasks";

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
    const current = await db.task.findUnique({ where: { id }, select: { repeat: true, dueDate: true, doneAt: true } });
    const justDone = !!current?.doneAt && Date.now() - current.doneAt.getTime() < 6 * 3600 * 1000;
    if (b.status === "done" && current?.repeat && justDone && current.dueDate && current.dueDate.getTime() > Date.now()) {
      // Ticked twice in a row: it has already rolled forward, so leave it alone.
      return NextResponse.json(await db.task.findUnique({ where: { id } }));
    }
    if (b.status === "done" && current?.repeat) {
      // Repeating task: stay "todo", record when it was done, and roll to the next date.
      // The client sends its own local date so "today" matches the user's clock.
      const today = /^\d{4}-\d{2}-\d{2}$/.test(String(b.today)) ? String(b.today) : new Date().toISOString().slice(0, 10);
      const due = current.dueDate ? current.dueDate.toISOString().slice(0, 10) : today;
      data.doneAt = new Date();
      data.dueDate = new Date(`${nextDue(current.repeat, due > today ? due : today)}T12:00:00.000Z`);
    } else {
      data.status = b.status;
      data.doneAt = b.status === "done" ? new Date() : null;
    }
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
