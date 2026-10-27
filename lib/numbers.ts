// Revenue milestones, as monthly recurring revenue (MRR). The last one is a
// $1M annual run rate ($83,334 x 12). Edit the list to change the targets.

export const MILESTONES: { mrr: number; label: string }[] = [
  { mrr: 10000, label: "$10k" },
  { mrr: 30000, label: "$30k" },
  { mrr: 50000, label: "$50k" },
  { mrr: 83334, label: "$1M run rate" },
];

// Used for "clients needed" until at least one active client has a fee.
export const ASSUMED_FEE = 5000;

/** The Monday on or before a YYYY-MM-DD date. */
export function mondayOf(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
