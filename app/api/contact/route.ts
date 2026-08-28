import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db/client";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "suntao@vertexchannels.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, service, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    // Save lead to database
    await db.contactLead.create({
      data: { name: name.trim(), email: email.trim(), company: company?.trim() ?? "", service: service?.trim() ?? "", message: message.trim() },
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
