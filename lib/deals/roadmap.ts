// The Vertex Channels build/GTM roadmap — the strategy locked in Aug 2026:
// position as "the non-Amazon channel team" (Spreetail-lite services model +
// excess-inventory wedge), solo, Amazon 3P unavailable for now.

export interface RoadmapSeed {
  phase: string;
  order: number;
  title: string;
  detail: string;
}

export const PHASE_LABEL: Record<string, string> = {
  P0: "P0 · Fill the pipeline — next 2 weeks",
  P1: "P1 · Close 1–3 brands — weeks 2–8",
  P2: "P2 · Systematize — after brand #1 is live",
  P3: "P3 · Scale — 3+ brands",
  parallel: "Parallel track",
};

export const PHASE_ORDER = ["P0", "P1", "P2", "P3", "parallel"];

export const NOT_NOW = [
  "Owned logistics / warehousing",
  "20+ channels",
  "Amazon 3P selling (until the seller account is sorted)",
  "Heavy software build",
  "Retainer-only deals",
];

export const DEFAULT_ROADMAP: RoadmapSeed[] = [
  { phase: "P0", order: 1, title: "Lock the niche in one sentence",
    detail: "DONE: \"We run Walmart, eBay, and Newegg for mid-size tools, automotive, and garage-equipment brands that are strong on Amazon and barely present anywhere else.\"" },
  { phase: "P0", order: 2, title: "Build the target list in Deal Desk — 40 brands scored",
    detail: "Pull a SmartScout brands export for the niche, import it, score. Filter: strong Amazon product, thin/no non-Amazon presence, ~$1M–20M, MAP-friendly, not hazmat." },
  { phase: "P0", order: 3, title: "Write the one-page offer",
    detail: "Services rev-share (15–25% of incremental net) + per-channel launch fee + the excess-inventory wedge. This is your pitch attachment." },
  { phase: "P0", order: 4, title: "Start outreach — 10 first-touches / week",
    detail: "Sequences are already built in the Deal Desk. Just feed it and work the follow-ups." },

  { phase: "P1", order: 1, title: "Sell the low-commitment version first",
    detail: "An excess-inventory lot, or a single-channel pilot (just Walmart). Easy yes; opens the door to full management." },
  { phase: "P1", order: 2, title: "Operate ONE channel end-to-end",
    detail: "Walmart: item setup → pricing → WFS/3PL → ads. Write down every step as you go — that becomes the repeatable checklist." },
  { phase: "P1", order: 3, title: "Get the numbers — first case study",
    detail: "First real result is your entire P2 sales pitch." },

  { phase: "P2", order: 1, title: "Channel-launch checklist in the app",
    detail: "Per brand, per channel — the documented steps from P1 turned into a tracked checklist." },
  { phase: "P2", order: 2, title: "Brand-facing dashboard (BEx-lite)",
    detail: "Sales / inventory / payout, per SKU per channel. The credibility piece — Spreetail's BEx portal is table stakes for trust." },
  { phase: "P2", order: 3, title: "Per-brand P&L + low-stock alerts",
    detail: "Wire in vertex-radar for inventory aging. Spreetail sells \"97% in-stock\" — you need at least a simple version." },

  { phase: "P3", order: 1, title: "Land-and-expand — add channels to existing brands",
    detail: "Cheapest growth. A brand already saying yes on Walmart is an easy yes on eBay + Newegg." },
  { phase: "P3", order: 2, title: "Selective wholesale buys on proven SKUs",
    detail: "The real Spreetail model — take title to fast movers once you have cash flow and proof." },
  { phase: "P3", order: 3, title: "Brand #2–3 in the same category",
    detail: "Referenceable playbook; referrals cluster within a category." },
  { phase: "P3", order: 4, title: "First hire — VA for listing ops",
    detail: "Only past ~5 brands. Listing setup / content is the first thing to delegate." },

  { phase: "parallel", order: 1, title: "Fix the Amazon Seller account",
    detail: "Not blocking — but resolving it roughly doubles the addressable pitch. Work it in the background." },
];
