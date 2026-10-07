// One-off: sync EmailTemplate rows to the current defaults (by key). Re-runnable.
//   node scripts/sync-templates.mjs "<DATABASE_URL>"
import { neon } from "@neondatabase/serverless";

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) { console.error("Pass DATABASE_URL"); process.exit(1); }
const sql = neon(url);

const T = [
  { key: "initial_1", context: "prospect", name: "Initial outreach", step: 1, waitDays: 0,
    subject: "{{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

{{opening}}

I'm {{yourName}} with {{company}}. We run Walmart, eBay, and Newegg for tools and automotive brands as their authorized reseller: listings, pricing, ads, and fulfillment, on a share of the revenue we add. You keep control of your pricing and your brand, and there's no retainer. We took Brightworks to $1.3M in 2025 on this approach.

If it's useful, I can send a short note on where {{brand}} is missing and what it might be worth. Would that be helpful?

Thanks,
{{yourName}}
{{company}} — {{site}}` },
  { key: "follow_up_1", context: "prospect", name: "Follow-up 1", step: 2, waitDays: 4,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

Following up on my note about {{brand}} beyond Amazon. In case it's easier to see in one place, here's how we work: {{onepager}}

The short version:
- Walmart, eBay, and Newegg run end to end as your authorized reseller. You approve the channels and the pricing floor.
- MAP monitoring and unauthorized-seller cleanup across marketplaces
- Excess or aged stock cleared on the right channels: we list it, you ship each order as it sells, no wholesale write-down

If it's worth exploring, the simplest next step is a 20-minute call, where I'll bring a specific read on which channels fit {{brand}}. Or, if you'd rather start from the account side, tell me what you'd need to see to set us up as an authorized reseller.

What works for you?

{{yourName}}
{{company}}` },
  { key: "follow_up_2", context: "prospect", name: "Follow-up 2 (breakup)", step: 3, waitDays: 7,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

I won't keep crowding your inbox — this is my last note for now.

If expanding {{brand}} beyond its current channels (or clearing excess stock without discounting it on Amazon) is worth a conversation down the road, just reply and I'll pick it back up.

Thanks either way,
{{yourName}}
{{company}}` },
  { key: "situational_no_sellers", context: "prospect", name: "Reply: not accepting new sellers", step: 0, waitDays: 0,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

Understood, and thanks for the quick reply. Can you help me understand the reasoning — is it a distribution policy, or more about controlling how {{brand}} is represented on marketplaces?

I ask because most brands we work with came to us with unauthorized sellers already on their listings. A managed reseller relationship is usually how they get that back under control, alongside MAP enforcement. If that's a live issue for {{brand}}, it may be worth a short call.

{{yourName}}
{{company}}` },
  { key: "situational_denial", context: "prospect", name: "Reply: after a no", step: 0, waitDays: 0,
    subject: "Re: {{brand}} on Walmart, eBay & Newegg",
    body: `Hi {{contact}},

No problem, and thanks for getting back to me.

If anything shifts — a new channel push, an inventory position you need to move, or unauthorized sellers becoming a headache — I'd welcome the chance to revisit. I'll check back in a few months unless I hear from you first.

{{yourName}}
{{company}}` },
];

let n = 0;
for (const t of T) {
  const r = await sql`
    UPDATE "EmailTemplate"
    SET subject = ${t.subject}, body = ${t.body}, name = ${t.name},
        step = ${t.step}, "waitDays" = ${t.waitDays}, context = ${t.context}
    WHERE key = ${t.key} RETURNING key`;
  console.log(r.length ? `updated ${t.key}` : `skipped (not seeded) ${t.key}`);
  if (r.length) n++;
}
console.log(`\n${n} synced`);
