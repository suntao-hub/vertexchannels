import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { checkAuth } from "@/lib/admin/auth";
import { renderTemplate, prospectMergeValues, coldOutreachFooter } from "@/lib/deals/templates";
import { SEGMENTS, stepsForSegment } from "@/lib/deals/tracks";

// Returns one segment's email sequence: each step rendered for a sample brand
// (so you see exactly what a draft will say) plus a paste-in copy for Instantly
// with Instantly's merge variables.
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const segment = req.nextUrl.searchParams.get("segment") ?? "channel";
  const prospectId = req.nextUrl.searchParams.get("prospectId") ?? "";
  const def = SEGMENTS.find((s) => s.key === segment);
  if (!def) return NextResponse.json({ error: "Unknown segment." }, { status: 400 });

  const all = await db.emailTemplate.findMany({ where: { context: "prospect" } });
  const steps = def.coldEmail ? stepsForSegment(all, segment) : [];

  let sample = prospectId
    ? await db.brandProspect.findUnique({ where: { id: prospectId } })
    : null;
  if (!sample) {
    const inSegment = await db.brandProspect.findMany({
      where: { angle: segment }, orderBy: { updatedAt: "desc" }, take: 50,
    });
    sample = inSegment.find((p) => p.openingLine.trim()) ?? inSegment[0] ?? null;
  }

  const values = prospectMergeValues({
    brand: sample?.brandName ?? "Example Brand",
    contact: sample?.contactName ?? "Jane Doe",
    category: sample?.category ?? "",
    website: sample?.website ?? "",
    opening: sample?.openingLine ?? "",
    show: sample?.tradeShow ?? "SEMA 2026",
    booth: sample?.booth ?? "11111",
  });
  const footer = coldOutreachFooter(values);

  // Same values, but the per-brand fields become Instantly's merge variables.
  const instantlyValues = {
    ...values,
    firstName: "{{firstName}}", contact: "{{firstName}}", brand: "{{companyName}}",
    opening: "{{personalization}}", show: "{{trade_show}}", booth: "{{booth}}",
    category: "{{category}}", website: "{{website}}",
  };

  let day = 0;
  const out = steps.map((t) => {
    day += t.waitDays;
    return {
      key: t.key, name: t.name, step: t.step, waitDays: t.waitDays, dayOverall: day,
      subject: renderTemplate(t.subject, values),
      body: renderTemplate(t.body, values) + footer,
      instantlySubject: renderTemplate(t.subject, instantlyValues),
      instantlyBody: renderTemplate(t.body, instantlyValues) + footer,
    };
  });

  const instantlyCopy = out.length
    ? [
        "Variables: map first_name and company_name when you upload the CSV; personalization, trade_show, booth and category come from the export.",
        "Settings: plain text, tracking off, weekdays only.",
        "",
        ...out.map((s) =>
          `----- STEP ${s.step}${s.dayOverall ? ` (day ${s.dayOverall})` : " (day 0)"}\nSubject: ${s.instantlySubject}\n\n${s.instantlyBody}\n`),
      ].join("\n")
    : "";

  return NextResponse.json({
    segment: def, steps: out, instantlyCopy,
    sample: sample ? { id: sample.id, brandName: sample.brandName } : null,
  });
}
