import { Resend } from "resend";
import { db } from "@/lib/db/client";

const FROM = process.env.OUTREACH_FROM || "Vertex Channels <noreply@vertexchannels.com>";
const REPLY_TO = process.env.OUTREACH_REPLY_TO || process.env.CONTACT_TO_EMAIL || "";

// Send one outreach email via Resend, then record the send and nudge the
// prospect forward (stamp the email date, advance an early-stage prospect).
export async function sendOutreachEmail(id: string) {
  const email = await db.outreachEmail.findUniqueOrThrow({
    where: { id },
    include: { prospect: true },
  });

  const to = email.toEmail || email.prospect.contactEmail;
  if (!to) throw new Error("No recipient — set the prospect's contact email first.");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: email.subject,
    text: email.body,
  });
  if (error) throw new Error(`Resend: ${error.message}`);

  const now = new Date();
  await db.outreachEmail.update({
    where: { id },
    data: { status: "sent", sentAt: now, toEmail: to },
  });
  await stampProspect(email.prospectId, now);
}

// Record an email that was sent by hand elsewhere, without sending anything.
export async function logOutreachEmail(id: string) {
  const email = await db.outreachEmail.findUniqueOrThrow({ where: { id } });
  const now = new Date();
  await db.outreachEmail.update({
    where: { id },
    data: { status: "logged", sentAt: now },
  });
  await stampProspect(email.prospectId, now);
}

async function stampProspect(prospectId: string, at: Date) {
  const p = await db.brandProspect.findUniqueOrThrow({ where: { id: prospectId } });
  const data: Record<string, unknown> = { updatedAt: at };
  if (!p.firstEmailAt) data.firstEmailAt = at;
  else if (!p.secondEmailAt) data.secondEmailAt = at;
  if (p.stage === "sourced" || p.stage === "researched") data.stage = "contacted";
  await db.brandProspect.update({ where: { id: prospectId }, data });
}
