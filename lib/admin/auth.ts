import { NextRequest } from "next/server";
import { verifyToken } from "@/app/api/admin/magic/route";

// Shared admin gate for API routes. Session token arrives as "<ts>:<token>"
// in the x-admin-token header (see app/admin/page.tsx).
export function checkAuth(req: NextRequest): boolean {
  const header = req.headers.get("x-admin-token") ?? "";
  const [tsStr, token] = header.split(":");
  const ts = parseInt(tsStr, 10);
  const email = process.env.ADMIN_EMAIL ?? "";
  return !isNaN(ts) && !!token && verifyToken(email, ts, token);
}
