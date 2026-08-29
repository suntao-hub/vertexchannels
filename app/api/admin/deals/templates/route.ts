import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { DEFAULT_TEMPLATES } from "@/lib/deals/templates";

// Seed any context that has no templates yet (so adding the "lead" set later
// doesn't require a manual migration).
async function seedMissing() {
  const contexts = [...new Set(DEFAULT_TEMPLATES.map((t) => t.context))];
  for (const ctx of contexts) {
    const count = await db.emailTemplate.count({ where: { context: ctx } });
    if (count === 0) {
      await db.emailTemplate.createMany({
        data: DEFAULT_TEMPLATES.filter((t) => t.context === ctx),
      });
    }
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await seedMissing();
  const context = req.nextUrl.searchParams.get("context") ?? undefined;
  const templates = await db.emailTemplate.findMany({
    where: context ? { context } : undefined,
    orderBy: [{ context: "asc" }, { step: "asc" }, { name: "asc" }],
  });
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
      context: b.context === "lead" ? "lead" : "prospect",
      name: b.name.trim(),
      subject: b.subject.trim(),
      body: b.body,
      step: Number(b.step) || 0,
      waitDays: Number(b.waitDays) || 0,
    },
  });
  return NextResponse.json(template);
}
