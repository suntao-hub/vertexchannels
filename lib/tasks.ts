// The action plan, seeded into the Task table by key. Dates come from the
// playbook timeline: first send Nov 10, follow-up Nov 16, ramp Nov 17, close
// Nov 20, full rate Nov 24, larger lists Nov 30. "blocker" means it must be
// done before the first send. Edit tasks in /admin/tasks; add new plan tasks
// here and use "Restore plan tasks" on that page to load them.

export const AREAS: Record<string, { label: string; bg: string; fg: string }> = {
  outreach: { label: "Outreach", bg: "#FFEDD5", fg: "#C2410C" },
  services: { label: "Services", bg: "#DCFCE7", fg: "#15803D" },
  dropship: { label: "Drop ship", bg: "#FEF3C7", fg: "#92400E" },
  deliverability: { label: "Deliverability", bg: "#DBEAFE", fg: "#1D4ED8" },
  site: { label: "Site", bg: "#EDE9FE", fg: "#6D28D9" },
  legal: { label: "Legal", bg: "#FEE2E2", fg: "#B91C1C" },
  network: { label: "Network", bg: "#E0F2FE", fg: "#0369A1" },
  admin: { label: "Admin", bg: "#F3F4F6", fg: "#4B5563" },
};

export interface SeedTask {
  key: string;
  title: string;
  detail: string;
  area: keyof typeof AREAS;
  due: string; // YYYY-MM-DD
  blocker?: boolean;
  repeat?: Repeat;
}

export const FIRST_SEND = "2026-11-10";

// A repeating task stays "todo" when ticked and rolls to its next date.
export type Repeat = "weekdays" | "mon" | "fri" | "monthly";

export const REPEAT_LABEL: Record<string, string> = {
  weekdays: "every weekday", mon: "every Monday", fri: "every Friday", monthly: "monthly",
};

const utc = (ymd: string) => new Date(`${ymd}T12:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** The first date strictly after `from` (YYYY-MM-DD) on which a repeating task is due. */
export function nextDue(repeat: string, from: string): string {
  const d = utc(from);
  if (repeat === "monthly") {
    return fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 12)));
  }
  const want: Record<string, number[]> = { weekdays: [1, 2, 3, 4, 5], mon: [1], fri: [5] };
  const days = want[repeat] ?? [1, 2, 3, 4, 5];
  do d.setUTCDate(d.getUTCDate() + 1); while (!days.includes(d.getUTCDay()));
  return fmt(d);
}

export const SEED_TASKS: SeedTask[] = [
  // ── Daily and weekly routine (repeats) ──
  { key: "routine-sales", area: "outreach", due: "2026-10-26", repeat: "weekdays",
    title: "Block 1 · Sales (90 min)",
    detail: "First thing, before delivery. Same-day replies, find contacts and verify emails, review the day's sends. No building and no client work until this is done." },
  { key: "routine-delivery", area: "services", due: "2026-10-26", repeat: "weekdays",
    title: "Block 2 · Client delivery (3 hrs)",
    detail: "Work in VertexLaunch. Batch by client (for example Active Tools Monday and Thursday) rather than touching every client daily." },
  { key: "routine-build", area: "admin", due: "2026-10-26", repeat: "weekdays",
    title: "Block 3 · Build or admin (60 min)",
    detail: "Capped at about 5 hours a week. If the cap is used up, skip this block." },
  { key: "routine-close", area: "admin", due: "2026-10-26", repeat: "weekdays",
    title: "Block 4 · Close the day (15 min)",
    detail: "Tick off Tasks, then pick tomorrow's top 3." },
  { key: "weekly-plan", area: "admin", due: "2026-11-02", repeat: "mon",
    title: "Monday plan (20 min)",
    detail: "Open Numbers. Check the pipeline and last week's funnel, then set this week's top 3 sales targets." },
  { key: "weekly-log", area: "admin", due: "2026-10-30", repeat: "fri",
    title: "Log the week in Numbers (5 min)",
    detail: "Enter sends, replies, positive replies, free reads delivered, calls and new clients for the week." },
  { key: "weekly-review", area: "admin", due: "2026-12-04", repeat: "fri",
    title: "Friday review (30 min)",
    detail: "Sends, bounces, replies and positive replies. Reads that became conversations. Hours used against the caps. One template or opening line to improve next week." },
  { key: "monthly-clients", area: "admin", due: "2026-11-02", repeat: "monthly",
    title: "Update clients and fees in Numbers",
    detail: "Check each client's monthly fee and status so MRR is right, then look at the next milestone and what it needs." },

  // ── Before the first send ──
  { key: "screen-services", area: "services", due: "2026-10-30", blocker: true,
    title: "Screen the 7 services brands",
    detail: "Deal Desk, filter SEMA 2026 and Managed services, open Screen. Run the Amazon check, use the marketplace search links, set Walmart, eBay and Newegg presence on each. Confirm the suggested mode." },
  { key: "dmarc-quarantine", area: "deliverability", due: "2026-10-30", blocker: true,
    title: "Move DMARC on the .co domain to p=quarantine",
    detail: "DNS change at the registrar. Keep SPF and DKIM as they are." },
  { key: "sender-name-env", area: "admin", due: "2026-10-30",
    title: "Check OUTREACH_SENDER_NAME in Vercel",
    detail: "It overrides the default sender name. It should read Suntao Dung, or be removed so the default applies." },
  { key: "deploy-check", area: "admin", due: "2026-10-28",
    title: "Confirm the latest Vercel deployment succeeded",
    detail: "Check the newest deploy on main, then open Deal Desk, Sequences and Playbook in the admin." },
  { key: "postmaster", area: "deliverability", due: "2026-11-02", blocker: true,
    title: "Set up Gmail Postmaster Tools for the .co domain",
    detail: "Verify the domain, then watch the spam rate. Aim for under 0.1%." },
  { key: "find-contacts", area: "outreach", due: "2026-11-03", blocker: true,
    title: "Find a named contact and email for each of the 7 services brands",
    detail: "AGM, Ken-Tool, Coxreels, Toolgrid, Pro Eagle, Race Ramps, Strong Hand Tools. Prefer ecommerce, operations or the owner. Enter name and email in the Deal Desk." },
  { key: "cite-sfa", area: "legal", due: "2026-11-03",
    title: "Confirm you can cite the SFA results publicly",
    detail: "Also check any non-compete or non-solicit that touches these categories. The SFA line stays out of the emails until this is settled." },
  { key: "read-template", area: "services", due: "2026-11-06", blocker: true,
    title: "Build the one-page read template and produce one sample",
    detail: "Listings, sellers, channel gaps. You promise delivery within 2 business days of a yes, so the format must exist before the first reply." },
  { key: "verify-emails", area: "outreach", due: "2026-11-06", blocker: true,
    title: "Verify the emails (NeverBounce or ZeroBounce)",
    detail: "Do this the same week you send. Prefer a person over info@." },
  { key: "seed-test", area: "deliverability", due: "2026-11-06", blocker: true,
    title: "Seed test from the .co mailbox",
    detail: "Send to a Gmail and an Outlook inbox you control. It must land in the inbox. If it lands in spam, do not send." },
  { key: "instantly-campaign", area: "outreach", due: "2026-11-06", blocker: true,
    title: "Create the services campaign in Instantly",
    detail: "Sequences page, Managed services tab, Copy for Instantly. Plain text, tracking off, weekdays only, step 2 waits 4 days, step 3 waits 6 more. Daily limit 5 to 10." },
  { key: "site-cta", area: "site", due: "2026-11-06",
    title: "Check the home page buttons and the /apply form",
    detail: "/apply now accepts everyone and only tags $3,000+ ad spend as Priority in the notification email. Confirm the home page nav and hero wording still match the services-first offer." },
  { key: "reopen-lines", area: "outreach", due: "2026-11-09", blocker: true,
    title: "Re-check every opening line the day before sending",
    detail: "Seller counts and stock change. If a claim is no longer true, change it or keep only the show hook." },
  { key: "upload-list", area: "outreach", due: "2026-11-09", blocker: true,
    title: "Export the services list and upload it to the Instantly campaign",
    detail: "Sequences page, Export. Only brands with a valid email are included." },

  // ── Send and ramp ──
  { key: "send-1", area: "outreach", due: "2026-11-10",
    title: "First send: 5 to 10 a day to the services brands",
    detail: "Tuesday to Thursday mornings. Skip Nov 11 (Veterans Day). Watch bounces and replies." },
  { key: "followup-1", area: "outreach", due: "2026-11-16",
    title: "Follow-up 1 goes out for the first batch",
    detail: "Day 4 falls on a Saturday, so it sends Monday. Confirm Instantly is set to weekdays only." },
  { key: "ramp-1", area: "deliverability", due: "2026-11-17",
    title: "Review bounces and replies, add 5 a day if healthy",
    detail: "Bounces under 2% and replies look normal. Otherwise hold the volume or pause and return to warm-up." },
  { key: "close-1", area: "outreach", due: "2026-11-20",
    title: "Close email goes out for the first batch",
    detail: "Lands before Thanksgiving week." },
  { key: "ramp-2", area: "deliverability", due: "2026-11-24",
    title: "Reach 30 a day if metrics hold, and repeat the seed test",
    detail: "Check the Postmaster spam rate too." },
  { key: "send-2", area: "outreach", due: "2026-11-30",
    title: "Send the larger templated lists",
    detail: "Includes the drop-ship campaign, but only after the drop-ship proof tasks below are done." },

  // ── Services track ──
  { key: "deliver-reads", area: "services", due: "2026-11-20",
    title: "Deliver every free read within 2 business days of a yes",
    detail: "Standing rule. Log each in the Deal Desk and note whether it turned into a conversation." },
  { key: "unscreened-35", area: "admin", due: "2026-11-13",
    title: "Decide what to do with the 35 unscreened SmartScout brands",
    detail: "They defaulted to Managed services without screening, which inflates the counts. Run the Screen panel in batches of 10, or move them aside." },

  // ── Drop-ship track ──
  { key: "woot-call", area: "dropship", due: "2026-11-13",
    title: "Call the Woot buyer",
    detail: "Ask: categories, price points, quantities, payment terms for Q4 and Q1, and how supplier-shipped events work. Woot stays out of emails until this is clear." },
  { key: "walmart-proof", area: "dropship", due: "2026-11-13",
    title: "List two real SKUs on Walmart with an authorization letter",
    detail: "Confirms your account can carry another brand's products, including tools and automotive." },
  { key: "margin-proof", area: "dropship", due: "2026-11-20",
    title: "Get dealer cost on 5 SKUs from one supplier and run the margin check",
    detail: "Net per order must be at least $8 and 10% after fees, shipping and a 5% return allowance. If most fail, drop ship becomes a lead door only." },
  { key: "dropship-screen", area: "dropship", due: "2026-11-13",
    title: "Screen the 4 drop-ship brands and load opening lines",
    detail: "Levrack, Millner-Haufen, Nomad, Industrial Gold. Verify each ships from US stock and check price points." },

  { key: "find-contacts-dropship", area: "dropship", due: "2026-11-13",
    title: "Find a named contact and email for the drop-ship and excess brands",
    detail: "Levrack, Millner-Haufen, Nomad, Industrial Gold, and the excess brand (GEDORE, where Troy is the warm contact). Prefer ecommerce, operations or the owner. Enter name and email in the Deal Desk so the drop-ship list can be exported." },

  // ── Legal and site ──
  { key: "attorney", area: "legal", due: "2026-11-13",
    title: "Choose an attorney for the supplier agreement",
    detail: "One review, then reuse. Covers authorization, drop-ship terms, returns, net 15 after payout, indemnity, exclusivity." },
  { key: "agreement-draft", area: "legal", due: "2026-11-24",
    title: "Supplier agreement drafted and reviewed",
    detail: "Needed before any drop-ship listing goes live." },
  { key: "insurance", area: "legal", due: "2026-11-24",
    title: "Check your own insurance as seller of record",
    detail: "Especially for lifting and other automotive equipment." },
  { key: "site-pages", area: "site", due: "2026-11-20",
    title: "Add a privacy policy, a supplier application form and an excess-inventory upload",
    detail: "From the PRD must-haves. The brand page is already rewritten." },

  // ── Network ──
  { key: "bob-hall", area: "network", due: "2026-10-30",
    title: "Message Bob Hall (AutoSport) on LinkedIn",
    detail: "Warm contact. He used to sell jacks and stands on Amazon and stepped back." },
  { key: "chris-nasebr", area: "network", due: "2026-10-30",
    title: "Send Chris (NASEBR) the follow-up with the brand page link",
    detail: "Ask him to forward the brand page to outdoor brands he reps. The page now matches the offer." },
  { key: "troy-gedore", area: "network", due: "2026-11-03",
    title: "Contact Troy (GEDORE) about excess inventory",
    detail: "Warm contact. Offer mode is Excess / Woot. Confirm the Woot terms first if you can." },
  { key: "orazen", area: "network", due: "2026-11-03",
    title: "Confirm with Orazen that you can name them publicly",
    detail: "They stay off the site until you hear back." },
  { key: "brightworks-quote", area: "network", due: "2026-11-13",
    title: "Ask Brightworks for a short testimonial with numbers",
    detail: "Your strongest proof. Even though the contract ended." },

  // ── Weekly ──
  { key: "review-1030", area: "admin", due: "2026-10-30", title: "Friday review", detail: "30 minutes. Sends, bounces, replies, audits delivered, pilot numbers, one thing to improve, hours used against the 10-hour cap." },
  { key: "review-1106", area: "admin", due: "2026-11-06", title: "Friday review", detail: "30 minutes. Check the Nov 10 blockers are all done." },
  { key: "review-1113", area: "admin", due: "2026-11-13", title: "Friday review", detail: "30 minutes. First week of sends: bounces, replies, positive replies." },
  { key: "review-1120", area: "admin", due: "2026-11-20", title: "Friday review", detail: "30 minutes. Decide whether to ramp, and whether the 100-send rule applies yet." },
  { key: "review-1127", area: "admin", due: "2026-11-27", title: "Friday review", detail: "30 minutes. Plan the Nov 30 larger send." },
];
