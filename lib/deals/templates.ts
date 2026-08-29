// Default outreach sequence. Structure follows The Wholesale Formula's
// reverse-sourcing cadence (initial contact → spaced follow-ups → situational
// replies); copy is original and leads with the Vertex Channels value prop:
// multi-channel placement (Walmart / eBay / Newegg / Woot) + excess-inventory
// recovery + MAP / unauthorized-seller control.
//
// Merge fields: {{brand}} {{contact}} {{category}} {{website}} {{yourName}}
//               {{company}} {{title}} {{site}}

export interface TemplateSeed {
  key: string;
  name: string;
  subject: string;
  body: string;
  step: number;
  waitDays: number;
}

export const DEFAULT_TEMPLATES: TemplateSeed[] = [
  {
    key: "initial_1",
    name: "Initial outreach",
    step: 1,
    waitDays: 0,
    subject: "Wholesale partnership — {{brand}} across more channels",
    body: `Hi {{contact}},

I'm {{yourName}} with {{company}}, a US-based multi-channel retailer. We run authorized wholesale accounts and place brands across Amazon, Walmart, eBay, and Newegg.

We've been watching {{brand}} and believe your {{category}} line would sell well with our customer base. We'd like to open a wholesale account and grow your presence on the channels you aren't fully covering today.

What do you need from us to get set up as an authorized reseller?

Thanks,
{{yourName}}
{{company}} — {{site}}`,
  },
  {
    key: "follow_up_1",
    name: "Follow-up 1",
    step: 2,
    waitDays: 4,
    subject: "Re: Wholesale partnership — {{brand}}",
    body: `Hi {{contact}},

Circling back on opening a wholesale account for {{brand}}.

What we bring, briefly:
- Clean listings and A+ content, active advertising, and MAP monitoring
- Distribution onto Walmart, eBay, and Newegg where there are gaps today
- A path to move aged or excess inventory across those channels rather than discounting it on Amazon

Happy to jump on a short call if that's easier — what works for you?

{{yourName}}
{{company}}`,
  },
  {
    key: "follow_up_2",
    name: "Follow-up 2 (breakup)",
    step: 3,
    waitDays: 7,
    subject: "Re: Wholesale partnership — {{brand}}",
    body: `Hi {{contact}},

I won't keep crowding your inbox — this is my last note for now.

If expanding {{brand}} beyond its current channels (or clearing through excess stock) is worth a conversation down the road, just reply and I'll pick it back up.

Thanks either way,
{{yourName}}
{{company}}`,
  },
  {
    key: "situational_no_sellers",
    name: "Reply: not accepting new sellers",
    step: 0,
    waitDays: 0,
    subject: "Re: Wholesale partnership — {{brand}}",
    body: `Hi {{contact}},

Understood, and thanks for the quick reply. Can you help me understand the reasoning — is it a distribution policy, or more about controlling how {{brand}} is represented on marketplaces?

I ask because most brands we work with came to us with unauthorized sellers already on their listings. A managed reseller relationship is usually how they get that back under control, alongside MAP enforcement. If that's a live issue for {{brand}}, it may be worth a short call.

{{yourName}}
{{company}}`,
  },
  {
    key: "situational_denial",
    name: "Reply: after a no",
    step: 0,
    waitDays: 0,
    subject: "Re: Wholesale partnership — {{brand}}",
    body: `Hi {{contact}},

No problem, and thanks for getting back to me.

If anything shifts — a new channel push, an inventory position you need to move, or unauthorized sellers becoming a headache — I'd welcome the chance to revisit. I'll check back in a few months unless I hear from you first.

{{yourName}}
{{company}}`,
  },
];

export interface MergeContext {
  brand: string;
  contact: string;
  category: string;
  website: string;
}

export function renderTemplate(text: string, ctx: MergeContext): string {
  const values: Record<string, string> = {
    brand: ctx.brand || "your brand",
    contact: ctx.contact?.trim() || "there",
    category: ctx.category?.trim() || "product",
    website: ctx.website || "",
    yourName: process.env.OUTREACH_SENDER_NAME || "Suntao",
    company: process.env.OUTREACH_COMPANY || "Vertex Channels",
    title: process.env.OUTREACH_SENDER_TITLE || "Partnerships",
    site: process.env.OUTREACH_SITE || "https://vertexchannels.com",
  };
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => values[k] ?? `{{${k}}}`);
}
