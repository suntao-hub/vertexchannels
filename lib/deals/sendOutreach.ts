import { Resend } from "resend";
import { db } from "@/lib/db/client";

const FROM = process.env.OUTREACH_FROM || "Vertex Channels <noreply@vertexchannels.com>";
const REPLY_TO = process.env.OUTREACH_REPLY_TO || process.env.CONTACT_TO_EMAIL || "";

// Send one outreach email via Resend, then record the send and nudge the
// owner (prospect or lead) forward.
export async function sendOutreachEmail(id: string) {
  const email = await db.outreachEmail.findUniqueOrThrow({
    where: { id },
    include: { prospect: true, lead: true },
  });

  const to = email.toEmail || email.prospect?.contactEmail || email.lead?.email || "";
  if (!to) throw new Error("No recipient — set the contact email first.");

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
  await db.outreachEmail.update({ where: { id }, data: { status: "sent", sentAt: now, toEmail: to } });
  await stampOwner(email.prospectId, email.leadId, now);
}

// Record an email sent by hand elsewhere, without sending anything.
export async function logOutreachEmail(id: string) {
  const email = await db.outreachEmail.findUniqueOrThrow({ where: { id } });
  const now = new Date();
  await db.outreachEmail.update({ where: { id }, data: { status: "logged", sentAt: now } });
  await stampOwner(email.prospectId, email.leadId, now);
}

async function stampOwner(prospectId: string | null, leadId: string | null, at: Date) {
  if (prospectId) {
    const p = await db.brandProspect.findUniqueOrThrow({ where: { id: prospectId } });
    const data: Record<string, unknown> = { updatedAt: at };
    if (!p.firstEmailAt) data.firstEmailAt = at;
    else if (!p.secondEmailAt) data.secondEmailAt = at;
    if (p.stage === "sourced" || p.stage === "researched") data.stage = "contacted";
    await db.brandProspect.update({ where: { id: prospectId }, data });
    return;
  }
  if (leadId) {
    const l = await db.contactLead.findUniqueOrThrow({ where: { id: leadId } });
    const data: Record<string, unknown> = { updatedAt: at };
    if (!l.firstEmailAt) data.firstEmailAt = at;
    if (l.status === "new") data.status = "contacted";
    await db.contactLead.update({ where: { id: leadId }, data });
  }
}
