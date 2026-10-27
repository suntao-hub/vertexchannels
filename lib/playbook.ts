// The Vertex Channels operating playbook. Served to the admin through an
// authenticated route (/api/admin/playbook) so the strategy stays out of the
// public JavaScript. Edit this file when a decision changes, and add a line to
// the decision log.

export type Block =
  | { t: "p"; text: string }
  | { t: "note"; text: string }
  | { t: "list"; items: string[] }
  | { t: "steps"; items: string[] }
  | { t: "checks"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "cols"; boxes: { title: string; text?: string; items?: string[] }[] }
  | { t: "flow"; columns: { title: string; items: string[] }[] }
  | { t: "issues"; items: { level: "Critical" | "High" | "Medium"; title: string; why: string; fix: string }[] }
  | { t: "log"; items: { date: string; text: string }[] };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Playbook {
  updated: string;
  verdict: { title: string; paragraphs: string[] };
  sections: Section[];
}

export const PLAYBOOK: Playbook = {
  updated: "Late Oct 2026",
  verdict: {
    title: "Services lead. Drop ship is a capped sidecar.",
    paragraphs: [
      "Managed services (Amazon and marketplace accounts, sold through a free one-page audit) are what you sell first and build toward. Drop ship runs as a small pilot that produces proof, orders and a Woot deal. Excess stock moves through Woot events. A brand sees one company, Vertex Channels, and one offer per email.",
      "Why: services fit a 10-hour week, put account risk on the brand's accounts, use your operator background and tools, and pay more per hour. At the drop-ship floor of $8 an order, 125 orders earn $1,000.",
    ],
  },
  sections: [
    {
      id: "model",
      title: "How the model runs",
      blocks: [
        {
          t: "flow",
          columns: [
            { title: "Find", items: ["Trade show lists: SEMA, AAPEX", "SmartScout brand lists", "Warm network and partners"] },
            { title: "Qualify in the Deal Desk", items: ["Channel presence, MAP, Amazon check", "Set offer mode and opening line"] },
            { title: "Export to Instantly", items: ["Services campaign: free audit read", "Drop-ship campaign: capped pilot"] },
            { title: "Deliver", items: ["Audit, then Amazon and marketplace retainer", "Walmart drop ship: 2 suppliers, 20 SKUs", "Woot event for excess stock"] },
            { title: "Revenue", items: ["Retainer or revenue share", "Spread per order", "Woot deal spread"] },
          ],
        },
        { t: "note", text: "Every lead enters through the Deal Desk and leaves with one offer mode. The pilot feeds services in one place: order history becomes proof that earns a retainer conversation." },
      ],
    },
    {
      id: "offers",
      title: "Offers and where the money is",
      blocks: [
        {
          t: "table",
          head: ["Offer", "Sold to", "What the brand gets", "You earn", "Risk sits on", "Role"],
          rows: [
            ["Managed services", "Brands with Amazon or seller-control problems", "Free one-page audit, then account management, catalog cleanup, seller monitoring (flag and report, no promised removals)", "Retainer or revenue share", "The brand's accounts", "Primary. The profit pool"],
            ["Drop ship supplier", "Brands with empty channels and US stock", "More channels at no cost; they ship each order", "Spread per order, $8 and 10% minimum", "Your seller accounts", "Capped. Proof and learning"],
            ["Excess / Woot deal", "Brands holding stock that must move", "A time-limited Woot event, supplier ships", "Spread on the deal", "You and one buyer relationship", "Opportunistic cash lever"],
            ["Referral partner", "Reps, distributors, network contacts", "Introductions to brands", "A fee per signed brand", "Little", "Source. Never cold emailed"],
          ],
        },
        { t: "note", text: "Woot allows drop ship and you hold an active Woot account. Confirm categories, pricing and payment terms with the buyer before Woot appears in an outreach email." },
      ],
    },
    {
      id: "segments",
      title: "Choosing an offer mode for each brand",
      blocks: [
        {
          t: "cols",
          boxes: [
            { title: "Managed services if", items: ["Strong sales rank but messy listings", "Many sellers on one listing, or Amazon sells it", "Flagship listing has no buyable offer", "Wrong brand name or category on a listing"] },
            { title: "Drop ship if", items: ["Two or more empty channels", "Little Amazon trouble", "Ships from US stock", "Price points leave a spread of $25 or more"] },
            { title: "Excess / Woot if", items: ["The contact names stock they need to move", "Aged or discontinued lines"] },
          ],
        },
        { t: "note", text: "One mode per brand and channel. If you resell a brand on a channel, you do not also run that brand's own store there. Put the secondary offer in the brand's notes." },
        {
          t: "table",
          head: ["SEMA 2026 brand", "Booth", "Mode", "Why"],
          rows: [
            ["AGM Products", "56243", "Services", "Real Amazon volume, few sellers, inconsistent variant specs"],
            ["Ken-Tool", "42082", "Services", "About 38 sellers on a top listing, Amazon sells it"],
            ["Coxreels", "11278", "Services", "16 sellers on key listings, flagship not buyable"],
            ["Toolgrid", "38231", "Services", "Wrong category, up to 12 sellers per listing"],
            ["Pro Eagle", "59037", "Services", "The Beast listed under brand COOKE, flagship listings not buyable"],
            ["Race Ramps", "20047", "Services", "3 of 4 main listings not buyable"],
            ["Strong Hand Tools", "36111", "Services", "Duplicate listings, stale prices. Low sales, send last"],
            ["Levrack", "11377", "Drop ship", "Empty on Walmart and Newegg, thin on eBay"],
            ["Millner-Haufen", "35192, 36098", "Drop ship", "Empty on Walmart and Newegg. Check price points"],
            ["Nomad Mfg", "45254", "Drop ship", "Not on Amazon, thin or empty on every other channel"],
            ["Industrial Gold", "36017", "Drop ship", "Verify the product first. Freight-heavy"],
            ["GEDORE", "38157", "Excess / Woot", "Warm contact (Troy), asked about excess stock"],
          ],
        },
      ],
    },
    {
      id: "system",
      title: "The system",
      blocks: [
        {
          t: "table",
          head: ["Piece", "Job", "Rule"],
          rows: [
            ["Deal Desk (this admin)", "Source of truth for every prospect: show, booth, channel presence, offer mode, opening line, contact, emails, terms learned", "Nothing lives only in Instantly or a spreadsheet"],
            ["Instantly", "Sends the cold sequences from the .co mailbox", "One campaign per offer mode. The Deal Desk templates are the copy source"],
            ["vertexchannels.co mailbox", "Sending identity", "Replies move to suntao@vertexchannels.com. Never cold email from the .com domain"],
            ["Google Workspace (.com)", "Human replies, warm contacts, hand-sent notes", "Log hand-sent emails in the Deal Desk"],
            ["Pilot sheet", "Supplier cost, MAP, stock and channel prices for the 20 pilot SKUs", "A spreadsheet until about 50 SKUs"],
          ],
        },
        { t: "p", text: "Working a list, start to finish" },
        {
          t: "steps",
          items: [
            "Import the list (CSV or tab-separated text) and type the show name so every brand is tagged and marked to visit.",
            "Screen each brand: use the Screen panel (or each brand's Screening assist) to run the Amazon check, open the marketplace search links, set Walmart, eBay and Newegg presence, and note MAP. The assist suggests an offer mode and drafts an opening line. Verify before sending.",
            "Set the offer mode and write or confirm the opening line.",
            "Add a named contact and verify the email. Prefer a person over info@.",
            "Check the segment tabs: each offer mode shows how many brands are ready (valid email plus something to open with).",
            "Open the Sequences page, copy that segment's emails (Managed services uses the Audit sequence, Drop ship has its own) into an Instantly campaign, then export the segment's list and upload it to that campaign.",
            "Work the dated checklist on the Tasks page. Tasks marked Blocks Nov 10 must be done before the first send.",
            "When someone replies, set the stage, log the outcome, and record terms learned in Brand HQ.",
          ],
        },
        { t: "note", text: "On hold until the pilot passes: Airtable, VertexTracker, a supplier portal, Mandarin pages, Wayfair and Shopify. Planned builds: eBay presence through its API (needs a free developer key), a bulk stage update after export, and supplier, SKU and listing tables once a supplier signs." },
      ],
    },
    {
      id: "outreach",
      title: "Outreach plan",
      blocks: [
        {
          t: "table",
          head: ["When", "Do"],
          rows: [
            ["Late Oct to Nov 6", "Warm-up runs on the .co mailbox (started late October). Find named contacts, verify emails, confirm each opening line. Move DMARC to p=quarantine. Around Nov 5 to 6, send a seed test to a Gmail and an Outlook inbox you control. If it lands in spam, do not send."],
            ["Nov 10", "First small batch: 5 to 10 a day, services brands only, with the hand-written opening line. Send Tuesday to Thursday mornings. Skip Nov 11 (Veterans Day)."],
            ["Nov 16", "Follow-up 1 for the first batch. Day 4 falls on a Saturday, so it goes Monday."],
            ["Nov 17 onward", "If bounces stay under 2% and replies look normal, add 5 a day. Reach 30 a day around Nov 24."],
            ["Nov 20", "Close email for the first batch, before Thanksgiving week."],
            ["After Nov 30", "Send the larger templated lists, including the drop-ship campaign."],
          ],
        },
        {
          t: "cols",
          boxes: [
            { title: "Services sequence", text: "Three emails over about 10 days: the show hook plus one specific finding with an offer of a free one-page read; a short follow-up asking who handles the listings; a polite close. Copy is in Deal Desk templates (Audit) and in the Instantly paste-in file." },
            { title: "Rules", items: ["Plain text, tracking off, at most one link", "Mailing address and an opt-out line in every email", "Re-check each finding the day before sending", "Verify emails the same week you send", "Pause and return to warm-up if bounces pass 2%", "Warm-up stays on while campaigns run"] },
            { title: "Replies", items: ["Answer within 4 business hours", "Reply from the .co mailbox, copy the .com, then move the thread to .com", "Set the stage to Replied in the Deal Desk", "Deliver the free read within 2 business days"] },
          ],
        },
      ],
    },
    {
      id: "week",
      title: "Weekly rhythm",
      blocks: [
        {
          t: "cols",
          boxes: [
            { title: "About 4 hours: services", text: "Sell and deliver audits, work warm contacts (Bob Hall, Chris, Troy), and serve current clients." },
            { title: "About 3 hours: drop-ship pilot", text: "Forward orders twice a day, upload tracking, update the pilot sheet, check account health." },
            { title: "About 3 hours: outreach and admin", text: "Contacts, verification, sends, replies, Deal Desk logging." },
          ],
        },
        { t: "p", text: "Daily routine (weekdays, ticked off on the Tasks page)" },
        {
          t: "steps",
          items: [
            "Block 1, sales, 90 minutes, first: same-day replies, contacts and verified emails, review the day's sends. No building and no client work until it is done.",
            "Block 2, client delivery, 3 hours, in VertexLaunch. Batch by client rather than touching every client daily.",
            "Block 3, build or admin, 60 minutes, capped at about 5 hours a week.",
            "Block 4, close the day, 15 minutes: tick off Tasks and pick tomorrow's top 3.",
            "Monday: 20-minute plan from the Numbers page. Friday: log the week in Numbers, then the 30-minute review. First of the month: update clients and fees.",
          ],
        },
        { t: "note", text: "Revenue milestones, tracked as monthly recurring revenue on the Numbers page: $10k, $30k, $50k, then $83,334 a month, which is a $1M run rate. Advertising budget is small, so growth comes from cold email, referrals and current clients. The weekly log records spend so cost per client is visible." },
        { t: "p", text: "Friday review, 30 minutes" },
        {
          t: "checks",
          items: [
            "Sends, bounces, replies, positive replies this week and in total",
            "Audits delivered and audits that turned into a conversation",
            "Pilot orders, net per order, on-time shipment, cancellations",
            "One template or opening line to improve next week",
            "Hours used against the 10-hour cap, and what stops first if over",
          ],
        },
      ],
    },
    {
      id: "pilot",
      title: "Drop-ship pilot, capped",
      blocks: [
        { t: "note", text: "Two suppliers, about 20 SKUs, Walmart only, for 60 days. Its jobs are proof, one Woot deal and a case study. It is not the main revenue source." },
        {
          t: "steps",
          items: [
            "Customer buys on Walmart at or above the brand's MAP.",
            "The order arrives. Forward it to the supplier twice a day.",
            "Supplier ships direct, blind packed, and sends tracking.",
            "Upload tracking to Walmart the same day.",
            "Walmart pays out, less fees.",
            "Pay the supplier's cost, net 15 after the payout. You keep the spread and own customer service, returns and account health.",
          ],
        },
        {
          t: "cols",
          boxes: [
            { title: "Margin rule", text: "List a SKU only if net per order is at least $8 and 10% of price after fees, shipping and a 5% return allowance. Favor items with a spread of $25 or more. Heavy items need a freight quote in writing." },
            { title: "Account health", items: ["On-time shipment 98% or better", "Valid tracking 99% or better", "Cancellations under 2%", "Pause a supplier after 2 weeks under target"] },
            { title: "Agreement before any listing", items: ["Authorization letter per channel", "Ship in 2 business days, blind packed", "Daily stock updates, returns and damage terms", "Paid net 15 after marketplace payout", "Liability insurance and indemnity", "Exclusivity ask, 6 to 12 months per channel", "Attorney review once"] },
          ],
        },
      ],
    },
    {
      id: "gates",
      title: "Gates and targets",
      blocks: [
        {
          t: "table",
          head: ["Measure", "90-day target", "Stop rule"],
          rows: [
            ["Verified contacts emailed", "150 to 300", "Fewer than 2 positive replies per 100 sends: change the list or the offer"],
            ["Bounce rate", "Under 2%", "Above 2%: pause and return to warm-up"],
            ["Free reads delivered", "3 or more", "None delivered by Dec 15: the offer is not landing"],
            ["Paid audit or retainer", "At least 1 from the SEMA list", "None by late January: rework the offer before building more"],
            ["Suppliers signed (pilot)", "2", "Margin fails on most test SKUs: drop ship becomes a lead door only"],
            ["Woot deals", "1", "Buyer terms do not allow supplier shipping or pricing: drop the Woot offer"],
            ["Net per order", "$8 and 10% or better", "Below, on most orders: stop listing"],
            ["Hours per week", "10 or fewer", "Over the cap two weeks running: cut scope, not the cap"],
          ],
        },
        { t: "note", text: "Treat the reply and signing numbers as stretch targets. Cold email rarely closes half of its positive conversations. The 100-send rule decides what happens next." },
      ],
    },
    {
      id: "risks",
      title: "Risks, ranked",
      blocks: [
        {
          t: "issues",
          items: [
            { level: "Critical", title: "Your hours do not cover everything", why: "Order forwarding, customer replies, reconciliation, outreach, onboarding and Woot all sit on one person with other work.", fix: "The 4, 3 and 3 hour split, two order windows a day, a cap on live SKUs, and a part-time assistant once the second supplier is live." },
            { level: "Critical", title: "The drop-ship margin is thin and unproven", why: "Fees, returns, damage and freight can erase an $8 spread, and no supplier's dealer cost is known yet.", fix: "Get dealer cost on five SKUs from one supplier and run the numbers before any drop-ship email goes out." },
            { level: "High", title: "Supplier mistakes land on your accounts", why: "A late shipment or bad tracking hits your Walmart metrics, and a suspension stops the pilot. Amazon third-party selling is not available to you.", fix: "Walmart only, the pause rule, and no new suppliers faster than you can supervise them." },
            { level: "High", title: "The reseller position is easy to walk around", why: "Once a brand sees sales, it can open its own store or add other resellers.", fix: "Channel exclusivity for 6 to 12 months, and a monthly sales report to each supplier." },
            { level: "High", title: "Services have little proof in this niche yet", why: "Brightworks ended, and Amazon management is a crowded market. Your edge is the niche, your operator background and your tools.", fix: "Make the free read a showable deliverable, and use the first two as case studies with the brand's permission." },
            { level: "High", title: "Seller of record carries product liability", why: "For lifting and other automotive equipment you are the named seller.", fix: "Attorney review, supplier insurance and indemnity, and a check on your own cover. Start with lower-risk categories." },
            { level: "Medium", title: "Claims can go stale or be wrong", why: "Opening lines cite seller counts and stock levels that change. A wrong claim ends the conversation.", fix: "Re-check each line the day before sending. Use only facts you can show." },
            { level: "Medium", title: "Site and emails must match the offer", why: "The live brand page still leads with revenue share and no retainer. A brand that clicks through from an email sees a different pitch.", fix: "Update the brand page, then the drop-ship templates, before the larger send." },
          ],
        },
      ],
    },
    {
      id: "presend",
      title: "Before the first send on Nov 10",
      blocks: [
        {
          t: "cols",
          boxes: [
            { title: "Ready the list", items: ["Named contact and verified email for each services brand", "Opening line re-checked the day before", "Export filtered to SEMA 2026 and Managed services"] },
            { title: "Ready the sender", items: ["Warm-up running at least 2 weeks, and left on", "DMARC on the .co domain moved from p=none to p=quarantine", "Seed test (around Nov 5 to 6) from the .co mailbox to a Gmail and an Outlook inbox you control lands in the inbox, not spam", "Gmail Postmaster Tools set up for the .co domain, with spam rate under 0.1%", "Tracking off, plain text, footer with address and opt-out", "Daily limit 5 to 10, weekdays only"] },
            { title: "Confirm", items: ["You can cite the SFA results publicly", "Sender name is Suntao Dung everywhere", "A delivery plan for the free read within 2 business days"] },
          ],
        },
      ],
    },
    {
      id: "log",
      title: "Decision log",
      blocks: [
        {
          t: "log",
          items: [
            { date: "Oct 25–26", text: "Services lead, drop ship capped, Woot for excess. One company name and one offer per email." },
            { date: "Oct 26", text: "The read is free. Sender name is Suntao Dung." },
            { date: "Oct 26", text: "Woot confirmed to allow drop ship, and the Woot account is active." },
            { date: "Oct 26", text: "Instantly sends cold email and the Deal Desk records everything. No Airtable, VertexTracker, supplier portal or Mandarin pages for now." },
            { date: "Oct 26", text: "The .co warm-up started. First send stays Nov 10, but as a small batch to the services brands." },
            { date: "Oct 26", text: "SEMA brands segmented: 7 services, 4 drop ship, 1 excess." },
            { date: "Oct 26", text: "Segment tabs with ready counts and a Sequences page (per-segment emails, copy for Instantly, per-segment export) added to the admin." },
            { date: "Oct 26", text: "Warm-up kept as insurance, not the plan: list quality, authentication, low volume and real replies matter more. Added DMARC p=quarantine, a seed test and Gmail Postmaster monitoring to the pre-send checklist." },
            { date: "Oct 26", text: "Screening assist added: Keepa Amazon check per brand or in batches of 10, a suggested offer mode, a draft opening line, and marketplace search links. Walmart, eBay and Newegg presence stays manual." },
            { date: "Oct 26", text: "Drop ship sequence written: Walmart only, Woot mentioned in email 2, three steps on the same 0, 4, 6 day rhythm. The brand page was rewritten to match the two offers (free read, Walmart drop ship)." },
            { date: "Oct 26", text: "Tasks page added to the admin: the dated action plan, with the 10 blockers that must be done before the Nov 10 send." },
            { date: "Oct 26", text: "/apply now accepts everyone. Ad spend is kept and used only to sort leads: a Priority or Standard tag in the email and a sortable column in Leads." },
            { date: "Oct 26", text: "No promise to remove unauthorized sellers in emails or on the site. We flag and report them; removals are the marketplace's call." },
            { date: "Oct 26", text: "Goal: a $1M run rate across Vertex Channels and VertexLaunch. Milestones $10k, $30k, $50k and $83,334 a month. Numbers page added (clients and MRR, weekly funnel, pipeline), and a daily and weekly routine added to Tasks. Ad budget is limited, so no paid-ads plan." },
            { date: "Oct 27", text: "Focus rule for 90 days: Vertex Channels managed services is the only engine. VertexLaunch is delivery tooling, not sold as SaaS. Drop ship stays capped. Other projects are maintenance only. Aim at brands with about $2M+ revenue and $4-5k+ a month fees. First hire near $30k a month." },
          ],
        },
        { t: "p", text: "Open questions" },
        {
          t: "list",
          items: [
            "Woot buyer: categories, price points, quantities and payment terms for Q4 and Q1",
            "Can your Walmart account list other brands' products, including tools and automotive?",
            "May you cite the SFA results publicly?",
            "Wayfair: will it approve other brands' products on your account?",
            "Exclusivity: one reseller per brand and channel, or none?",
            "Who reviews the supplier agreement, and by when?",
            "Which channel follows Walmart: eBay or Newegg?",
          ],
        },
      ],
    },
  ],
};
