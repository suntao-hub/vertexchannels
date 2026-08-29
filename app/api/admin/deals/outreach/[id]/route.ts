import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { sendOutreachEmail, logOutreachEmail } from "@/lib/deals/sendOutreach";

// PATCH accepts:
//   { subject?, body?, toEmail? }        — edit a draft
//   { outcome: "replied" | ... }         — record the reply outcome
//   { action: "send" }                   — send via Resend now
//   { action: "log" }                    — mark as sent-by-hand, no send
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();

  try {
    if (b.action === "send") await sendOutreachEmail(id);
    else if (b.action === "log") await logOutreachEmail(id);

    const data: Record<string, unknown> = {};
    for (const f of ["subject", "body", "toEmail"] as const) if (b[f] !== undefined) data[f] = b[f];
    if (b.outcome !== undefined) data.outcome = b.outcome;
    if (b.status !== undefined && !b.action) data.status = b.status;

    const email = Object.keys(data).length
      ? await db.outreachEmail.update({ where: { id }, data })
      : await db.outreachEmail.findUniqueOrThrow({ where: { id } });

    // If the brand replied, reflect it on the prospect stage.
    if (b.outcome === "replied" || b.outcome === "interested") {
      const e = await db.outreachEmail.findUniqueOrThrow({ where: { id } });
      const p = await db.brandProspect.findUniqueOrThrow({ where: { id: e.prospectId } });
      if (p.stage === "contacted") {
        await db.brandProspect.update({ where: { id: p.id }, data: { stage: "replied" } });
      }
    }
    return NextResponse.json(email);
  } catch (err) {
    console.error("[outreach PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.outreachEmail.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
