import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { verifyToken } from "../magic/route";

function checkAuth(req: NextRequest) {
  const header = req.headers.get("x-admin-token") ?? "";
  const [tsStr, token] = header.split(":");
  const ts = parseInt(tsStr, 10);
  const email = process.env.ADMIN_EMAIL ?? "";
  return !isNaN(ts) && verifyToken(email, ts, token);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await db.contactLead.findMany({
    orderBy: { createdAt: "desc" },
    include: { emails: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(leads);
}
