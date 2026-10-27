import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { mondayOf } from "@/lib/numbers";

const BUSINESSES = ["channels", "launch"];
const STATUSES = ["active", "paused", "ended"];
const int = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
const ymd = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : "");

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [clients, weeks, stages, leadStatuses, newLeads] = await Promise.all([
    db.clientAccount.findMany({ orderBy: { createdAt: "asc" } }),
    db.weeklyLog.findMany({ orderBy: { weekStart: "desc" }, take: 26 }),
    db.brandProspect.groupBy({ by: ["stage"], _count: { _all: true } }),
    db.contactLead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.contactLead.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  return NextResponse.json({
    clients,
    weeks,
    pipeline: {
      prospects: Object.fromEntries(stages.map((s) => [s.stage, s._count._all])),
      leads: Object.fromEntries(leadStatuses.map((s) => [s.status, s._count._all])),
      newLeads7d: newLeads,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();

  if (b.kind === "week") {
    const start = ymd(b.weekStart);
    if (!start) return NextResponse.json({ error: "Week start required." }, { status: 400 });
    const data = {
      sends: int(b.sends), replies: int(b.replies), positives: int(b.positives), reads: int(b.reads),
      calls: int(b.calls), newClients: int(b.newClients), spend: int(b.spend),
      notes: String(b.notes ?? "").slice(0, 500),
    };
    const weekStart = mondayOf(start);
    const week = await db.weeklyLog.upsert({
      where: { weekStart }, create: { weekStart, ...data }, update: data,
    });
    return NextResponse.json(week);
  }

  if (!String(b.name ?? "").trim()) return NextResponse.json({ error: "Name required." }, { status: 400 });
  const client = await db.clientAccount.create({
    data: {
      name: String(b.name).trim().slice(0, 120),
      business: BUSINESSES.includes(b.business) ? b.business : "channels",
      monthlyFee: int(b.monthlyFee),
      status: STATUSES.includes(b.status) ? b.status : "active",
      startedAt: ymd(b.startedAt) ? new Date(`${ymd(b.startedAt)}T12:00:00.000Z`) : null,
      notes: String(b.notes ?? "").slice(0, 500),
    },
  });
  return NextResponse.json(client);
}
