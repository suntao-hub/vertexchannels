import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { DEFAULT_TEMPLATES } from "@/lib/deals/templates";

async function seedIfEmpty() {
  const count = await db.emailTemplate.count();
  if (count > 0) return;
  await db.emailTemplate.createMany({ data: DEFAULT_TEMPLATES });
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await seedIfEmpty();
  const templates = await db.emailTemplate.findMany({ orderBy: [{ step: "asc" }, { name: "asc" }] });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.name?.trim() || !b.subject?.trim() || !b.body?.trim())
    return NextResponse.json({ error: "name, subject, body required." }, { status: 400 });

  const key = (b.key?.trim() || b.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")).slice(0, 60);
  const template = await db.emailTemplate.create({
    data: {
      key,
      name: b.name.trim(),
      subject: b.subject.trim(),
      body: b.body,
      step: Number(b.step) || 0,
      waitDays: Number(b.waitDays) || 0,
    },
  });
  return NextResponse.json(template);
}
