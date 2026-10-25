import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { SEED_TASKS, AREAS } from "@/lib/tasks";

const toDate = (s: string) => new Date(`${s}T12:00:00.000Z`);

async function seedMissing(onlyIfEmpty: boolean) {
  if (onlyIfEmpty && (await db.task.count()) > 0) return 0;
  const have = new Set((await db.task.findMany({ select: { key: true } })).map((t) => t.key));
  const missing = SEED_TASKS.filter((t) => !have.has(t.key));
  if (missing.length === 0) return 0;
  await db.task.createMany({
    data: missing.map((t) => ({
      key: t.key, title: t.title, detail: t.detail, area: t.area,
      dueDate: toDate(t.due), blocker: !!t.blocker,
    })),
  });
  return missing.length;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await seedMissing(true); // first visit only
  const tasks = await db.task.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();

  if (b.restorePlan) {
    const added = await seedMissing(false);
    return NextResponse.json({ added });
  }

  if (!b.title?.trim()) return NextResponse.json({ error: "Title required." }, { status: 400 });
  const task = await db.task.create({
    data: {
      title: String(b.title).trim().slice(0, 200),
      detail: String(b.detail ?? "").slice(0, 2000),
      area: b.area in AREAS ? b.area : "admin",
      dueDate: b.dueDate ? toDate(String(b.dueDate).slice(0, 10)) : null,
      blocker: !!b.blocker,
    },
  });
  return NextResponse.json(task);
}
