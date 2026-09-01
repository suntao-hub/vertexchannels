// Outreach sequences.
//
// context "prospect" — cold outbound to brands. Structure follows The Wholesale
//   Formula's reverse-sourcing cadence (initial contact → spaced follow-ups →
//   situational replies); copy leads with the Vertex Channels value prop:
//   multi-channel placement + excess-inventory clearance (consignment) + MAP control.
//
// context "lead" — warm replies to inbound contact-form inquiries.
//
// Merge fields:
//   both:      {{yourName}} {{company}} {{title}} {{site}}
//   prospect:  {{brand}} {{contact}} {{category}} {{website}}
//   lead:      {{name}} {{firstName}} {{leadCompany}} {{service}}

export interface TemplateSeed {
  key: string;
  context: string;
  name: string;
  subject: string;
  body: string;
  step: number;
  waitDays: number;
}

export const PROSPECT_TEMPLATES: TemplateSeed[] = [
  {
    key: "initial_1",
    context: "prospect",
    name: "Initial outreach",
    step: 1,
    waitDays: 0,
    subject: "{{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

{{opening}}

I'm {{yourName}} with {{company}}. We run authorized wholesale accounts for brands and manage their presence on Walmart, eBay, Newegg, and other marketplaces — listings, pricing, ads, and fulfillment.

Your {{category}} line looks strong on Amazon and light everywhere else. We'd like to open a wholesale account and run those channels for you.

What do you need from us to get set up as an authorized reseller?

Thanks,
{{yourName}}
{{company}} — {{site}}`,
  },
  {
    key: "follow_up_1",
    context: "prospect",
    name: "Follow-up 1",
    step: 2,
    waitDays: 4,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

Circling back on opening a wholesale account for {{brand}}.

What we bring, briefly:
- Walmart, eBay, and Newegg run end to end — listings, pricing, ads, fulfillment
- MAP monitoring and unauthorized-seller cleanup across marketplaces
- Aged or excess stock cleared on the right channels — we list it, you ship each order as it sells, no wholesale write-down

More on how it works: {{onepager}}

Happy to jump on a short call if that's easier — what works for you?

{{yourName}}
{{company}}`,
  },
  {
    key: "follow_up_2",
    context: "prospect",
    name: "Follow-up 2 (breakup)",
    step: 3,
    waitDays: 7,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

I won't keep crowding your inbox — this is my last note for now.

If expanding {{brand}} beyond its current channels (or clearing excess stock without discounting it on Amazon) is worth a conversation down the road, just reply and I'll pick it back up.

Thanks either way,
{{yourName}}
{{company}}`,
  },
  {
    key: "situational_no_sellers",
    context: "prospect",
    name: "Reply: not accepting new sellers",
    step: 0,
    waitDays: 0,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

Understood, and thanks for the quick reply. Can you help me understand the reasoning — is it a distribution policy, or more about controlling how {{brand}} is represented on marketplaces?

I ask because most brands we work with came to us with unauthorized sellers already on their listings. A managed reseller relationship is usually how they get that back under control, alongside MAP enforcement. If that's a live issue for {{brand}}, it may be worth a short call.

{{yourName}}
{{company}}`,
  },
  {
    key: "situational_denial",
    context: "prospect",
    name: "Reply: after a no",
    step: 0,
    waitDays: 0,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

No problem, and thanks for getting back to me.

If anything shifts — a new channel push, an inventory position you need to move, or unauthorized sellers becoming a headache — I'd welcome the chance to revisit. I'll check back in a few months unless I hear from you first.

{{yourName}}
{{company}}`,
  },
];

export const LEAD_TEMPLATES: TemplateSeed[] = [
  {
    key: "lead_ack",
    context: "lead",
    name: "Acknowledge & qualify",
    step: 1,
    waitDays: 0,
    subject: "Thanks for reaching out — {{company}}",
    body: `Hi {{firstName}},

Thanks for getting in touch through the site — good to hear from {{leadCompany}}.

So I can point you in the right direction, a few quick questions:
- Which channels are you selling on today, and where do you want to grow?
- Roughly what monthly revenue are you doing on your main channel?
- Is there anything urgent driving this — a launch, excess inventory, unauthorized sellers?

Happy to set up a short call once I have the lay of the land. What days work for you this week or next?

Best,
{{yourName}}
{{company}} — {{site}}`,
  },
  {
    key: "lead_call",
    context: "lead",
    name: "Propose a call",
    step: 2,
    waitDays: 3,
    subject: "Re: Thanks for reaching out — {{company}}",
    body: `Hi {{firstName}},

Following up on your note. I'd like to walk through what we could do for {{leadCompany}} — channel expansion, listing and PPC work, brand protection, and moving through any excess stock.

Do any of these work for a 20-minute call?
- [option 1]
- [option 2]
- [option 3]

If none fit, send me a couple of times and I'll make one work.

{{yourName}}
{{company}}`,
  },
  {
    key: "lead_nudge",
    context: "lead",
    name: "Nudge (gone quiet)",
    step: 3,
    waitDays: 5,
    subject: "Re: Thanks for reaching out — {{company}}",
    body: `Hi {{firstName}},

Circling back once more in case my last note got buried.

If the timing isn't right for {{leadCompany}}, no problem — just let me know and I'll follow up down the road instead. If it is, reply with a time that works and we'll get a call set.

{{yourName}}
{{company}}`,
  },
  {
    key: "lead_proposal_followup",
    context: "lead",
    name: "Post-proposal check-in",
    step: 0,
    waitDays: 0,
    subject: "Re: {{company}} proposal — {{leadCompany}}",
    body: `Hi {{firstName}},

Checking in on the proposal I sent over for {{leadCompany}}. Any questions on scope, pricing, or how we'd sequence the work?

Happy to adjust anything or hop on a quick call to talk it through.

{{yourName}}
{{company}}`,
  },
];

export const DEFAULT_TEMPLATES: TemplateSeed[] = [...PROSPECT_TEMPLATES, ...LEAD_TEMPLATES];

// ─── Merge rendering ─────────────────────────────────────────────────────────

function envDefaults(): Record<string, string> {
  const site = process.env.OUTREACH_SITE || "https://vertexchannels.com";
  return {
    yourName: process.env.OUTREACH_SENDER_NAME || "Suntao",
    company: process.env.OUTREACH_COMPANY || "Vertex Channels",
    title: process.env.OUTREACH_SENDER_TITLE || "Partnerships",
    site,
    onepager: `${site.replace(/\/$/, "")}/for-brands`,
    address: process.env.OUTREACH_ADDRESS || "",
  };
}

export interface ProspectMergeInput {
  brand: string;
  contact: string;
  category: string;
  website: string;
  opening: string;
}

export interface LeadMergeInput {
  name: string;
  company: string;
  service: string;
}

export function prospectMergeValues(p: ProspectMergeInput): Record<string, string> {
  return {
    ...envDefaults(),
    brand: p.brand || "your brand",
    contact: p.contact?.trim() || "there",
    category: p.category?.trim() || "product",
    website: p.website || "",
    opening: p.opening?.trim() || "",
  };
}

export function leadMergeValues(l: LeadMergeInput): Record<string, string> {
  const name = l.name?.trim() || "there";
  return {
    ...envDefaults(),
    name,
    firstName: name.split(/\s+/)[0] || "there",
    leadCompany: l.company?.trim() || "your team",
    service: l.service?.trim() || "",
  };
}

export function renderTemplate(text: string, values: Record<string, string>): string {
  return text
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => values[k] ?? `{{${k}}}`)
    .replace(/\n{3,}/g, "\n\n") // collapse gaps left by empty merge fields
    .trim();
}

// CAN-SPAM footer for cold (prospect) outreach: identifies the sender, gives a
// postal address, and offers an opt-out. Appended at draft time — see
// app/api/admin/deals/outreach/route.ts. OUTREACH_ADDRESS must be set.
export function coldOutreachFooter(values: Record<string, string>): string {
  const lines = [
    "—",
    "{{yourName}} · {{company}}",
    values.address?.trim() ? "{{address}}" : "",
    'Not the right fit? Reply "no thanks" and I won\'t follow up.',
  ].filter(Boolean);
  return "\n\n" + renderTemplate(lines.join("\n"), values);
}
