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

I'm {{yourName}} with {{company}}. We run authorized wholesale accounts for brands and manage their presence on Walmart, eBay, Newegg, and other marketplaces — listings, pricing, ads, and fulfillment.

Your {{category}} line looks strong on Amazon and light everywhere else. We'd like to open a wholesale account and run those channels for you.

What do you need from us to get set up as an authorized reseller?

Thanks,
{{yourName}}
{{company}} — {{site}}` },
  { key: "follow_up_1", context: "prospect", name: "Follow-up 1", step: 2, waitDays: 4,
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
