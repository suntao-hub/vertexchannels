import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { Resend } from "resend";

const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  ?? "";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
export const LINK_TTL_MS    = 15 * 60 * 1000;             // magic link freshness
export const SESSION_TTL_MS  = 7 * 24 * 60 * 60 * 1000;   // signed-in session length

export function signToken(email: string, ts: number) {
  return createHmac("sha256", ADMIN_SECRET).update(`${email}:${ts}`).digest("hex");
}

// maxAgeMs defaults to the session window — API auth. Pass LINK_TTL_MS to
// gate the initial magic-link click.
export function verifyToken(email: string, ts: number, token: string, maxAgeMs: number = SESSION_TTL_MS): boolean {
  if (!ADMIN_SECRET || !ADMIN_EMAIL) return false;
  if (email !== ADMIN_EMAIL) return false;
  if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs) return false;
  const expected = signToken(email, ts);
  // constant-time compare
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: "Email required." }, { status: 400 });
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      // Return success even for wrong email (don't leak who is admin)
      return NextResponse.json({ ok: true });
    }

    const ts    = Date.now();
    const token = signToken(ADMIN_EMAIL, ts);
    const base  = req.headers.get("origin") ?? `https://${req.headers.get("host")}`;
    const link  = `${base}/admin?token=${token}&ts=${ts}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Vertex Channels <noreply@vertexchannels.com>",
      to: ADMIN_EMAIL,
      subject: "Your admin login link",
      text: `Click this link to sign in to the Vertex Channels admin (expires in 15 minutes):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[magic]", err);
    return NextResponse.json({ error: "Failed to send link." }, { status: 500 });
  }
}
