import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db/client";

const MIN_AD_SPEND = 3000;
const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "suntao@vertexchannels.com";

const CHANNEL_LABEL: Record<string, string> = {
  amazon: "Amazon", walmart: "Walmart", ebay: "eBay",
  newegg: "Newegg", own_site: "Own website", other: "Other",
};

const pickMany = (v: unknown) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x in CHANNEL_LABEL)
    : [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string;
      email: string;
      company: string;
      website?: string;
      productCategories: string;
      monthlyAdSpend: string;
      channels: unknown;
      goals: string;
    };

    if (!body.name?.trim() || !body.email?.trim() || !body.company?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adSpend = parseFloat(body.monthlyAdSpend) || 0;

    if (adSpend < MIN_AD_SPEND) {
      return NextResponse.json({ rejected: true });
    }

    const channelList = pickMany(body.channels);

    await db.contactLead.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim(),
        company: body.company.trim(),
        service: "apply",
        message: body.goals?.trim() ?? "",
        channels: channelList.join(","),
        source: "apply",
        monthlyAdSpend: adSpend,
        productCategories: body.productCategories?.trim() ?? "",
        goals: body.goals?.trim() ?? "",
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Vertex Channels <noreply@vertexchannels.com>",
      to: TO_EMAIL,
      replyTo: body.email,
      subject: `New application from ${body.name} — ${body.company}`,
      text: [
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        `Company: ${body.company}`,
        body.website ? `Website: ${body.website}` : "",
        `Monthly ad spend: $${adSpend.toLocaleString()}`,
        channelList.length ? `Channels: ${channelList.map(c => CHANNEL_LABEL[c]).join(", ")}` : "",
        `Products: ${body.productCategories}`,
        ``,
        `Goals:\n${body.goals}`,
      ].filter(Boolean).join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[apply]", err);
    return NextResponse.json({ error: "Failed to submit — please try again." }, { status: 500 });
  }
}
