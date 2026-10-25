import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/admin/auth";
import { PLAYBOOK } from "@/lib/playbook";

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(PLAYBOOK);
}
