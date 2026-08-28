import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

function checkAuth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await db.contactLead.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(leads);
}
