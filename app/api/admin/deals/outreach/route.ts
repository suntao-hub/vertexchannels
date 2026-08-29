import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { renderTemplate } from "@/lib/deals/templates";

// Create a draft outreach email for a prospect from a template. Merge fields
// are resolved now; the draft stays editable until it is sent or logged.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.prospectId || !b.templateKey)
    return NextResponse.json({ error: "prospectId and templateKey required." }, { status: 400 });

  const [prospect, template] = await Promise.all([
    db.brandProspect.findUniqueOrThrow({ where: { id: b.prospectId } }),
    db.emailTemplate.findUniqueOrThrow({ where: { key: b.templateKey } }),
  ]);

  const ctx = {
    brand: prospect.brandName,
    contact: prospect.contactName,
    category: prospect.category,
    website: prospect.website,
  };

  const draft = await db.outreachEmail.create({
    data: {
      prospectId: prospect.id,
      templateKey: template.key,
      step: template.step,
      toEmail: prospect.contactEmail,
      subject: renderTemplate(template.subject, ctx),
      body: renderTemplate(template.body, ctx),
    },
  });
  return NextResponse.json(draft);
}
