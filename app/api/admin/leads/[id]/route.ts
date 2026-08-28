import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { verifyToken } from "../../magic/route";

function checkAuth(req: NextRequest) {
  const header = req.headers.get("x-admin-token") ?? "";
  const [tsStr, token] = header.split(":");
  const ts = parseInt(tsStr, 10);
  const email = process.env.ADMIN_EMAIL ?? "";
  return !isNaN(ts) && verifyToken(email, ts, token);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const lead = await db.contactLead.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes  !== undefined && { notes:  body.notes  }),
    },
  });
  return NextResponse.json(lead);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.contactLead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
