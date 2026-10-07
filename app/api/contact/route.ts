import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db/client";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "suntao@vertexchannels.com";

const REVENUE_LABEL: Record<string, string> = {
  under_500k: "Under $500K", "500k_1_5m": "$500K–$1.5M", "1_5m_5m": "$1.5M–$5M",
  "5m_15m": "$5M–$15M", over_15m: "Over $15M",
};
const CHANNEL_LABEL: Record<string, string> = {
  amazon: "Amazon", walmart: "Walmart", ebay: "eBay", newegg: "Newegg", own_site: "Own website", other: "Other",
};
const YES_NO_LABEL: Record<string, string> = { yes: "Yes", no: "No", not_sure: "Not sure" };

// Accept only known values — these fields come from a public form.
const pick = (v: unknown, allowed: Record<string, string>) =>
  typeof v === "string" && v in allowed ? v : "";
const pickMany = (v: unknown, allowed: Record<string, string>) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x in allowed) : [];

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, service, message, revenueBand, channels, hasExcess, mapPolicy } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const revenue = pick(revenueBand, REVENUE_LABEL);
    const channelList = pickMany(channels, CHANNEL_LABEL);
    const excess = pick(hasExcess, YES_NO_LABEL);
    const map = pick(mapPolicy, YES_NO_LABEL);

    // Save lead to database
    await db.contactLead.create({
      data: {
        name: name.trim(), email: email.trim(), company: company?.trim() ?? "",
        service: service?.trim() ?? "", message: message.trim(),
        revenueBand: revenue, channels: channelList.join(","), hasExcess: excess, mapPolicy: map,
      },
    });

    // Send email notification
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Vertex Channels <noreply@vertexchannels.com>",
      to: TO_EMAIL,
      replyTo: email,
      subject: `New inquiry from ${name}${company ? ` — ${company}` : ""}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        company  ? `Company: ${company}` : "",
        service  ? `Interested in: ${service}` : "",
        revenue  ? `Annual revenue: ${REVENUE_LABEL[revenue]}` : "",
        channelList.length ? `Sells on: ${channelList.map((c) => CHANNEL_LABEL[c]).join(", ")}` : "",
        excess   ? `Excess inventory: ${YES_NO_LABEL[excess]}` : "",
        map      ? `MAP policy: ${YES_NO_LABEL[map]}` : "",
        ``,
        message,
      ].filter(Boolean).join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Failed to send — please try again." }, { status: 500 });
  }
}
