import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { renderTemplate, prospectMergeValues, leadMergeValues } from "@/lib/deals/templates";

// Create a draft outreach email for a prospect OR a lead from a template.
// Merge fields are resolved now; the draft stays editable until sent or logged.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.templateKey || (!b.prospectId && !b.leadId))
    return NextResponse.json({ error: "templateKey and prospectId|leadId required." }, { status: 400 });

  const template = await db.emailTemplate.findUniqueOrThrow({ where: { key: b.templateKey } });

  let values: Record<string, string>;
  let toEmail = "";
  const data: { prospectId?: string; leadId?: string } = {};

  if (b.prospectId) {
    const p = await db.brandProspect.findUniqueOrThrow({ where: { id: b.prospectId } });
    values = prospectMergeValues({
      brand: p.brandName, contact: p.contactName, category: p.category, website: p.website,
    });
    toEmail = p.contactEmail;
    data.prospectId = p.id;
  } else {
    const l = await db.contactLead.findUniqueOrThrow({ where: { id: b.leadId } });
    values = leadMergeValues({ name: l.name, company: l.company, service: l.service });
    toEmail = l.email;
    data.leadId = l.id;
  }

  const draft = await db.outreachEmail.create({
    data: {
      ...data,
      templateKey: template.key,
      step: template.step,
      toEmail,
      subject: renderTemplate(template.subject, values),
      body: renderTemplate(template.body, values),
    },
  });
  return NextResponse.json(draft);
}
