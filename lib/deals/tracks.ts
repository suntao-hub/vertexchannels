// Segments (offer modes) and which email sequence each one uses. Shared by the
// Deal Desk, the Sequences page and the sequences API so the rule lives once.

import { isValidEmail } from "./instantlyExport";

export interface SegmentDef {
  key: string; // value stored in BrandProspect.angle
  label: string;
  coldEmail: boolean; // false = never cold emailed
  note: string;
}

export const SEGMENTS: SegmentDef[] = [
  { key: "channel", label: "Managed services", coldEmail: true,
    note: "Uses the Audit sequence: a free one-page read, then a follow-up and a close." },
  { key: "dropship", label: "Drop ship supplier", coldEmail: true,
    note: "Uses the Drop ship sequence: Walmart first, no cost to the brand, they ship each order, and a Woot event in email 2 for aged stock." },
  { key: "excess", label: "Excess / Woot deal", coldEmail: true,
    note: "No dedicated sequence yet. It uses the general sequence, so edit each draft by hand for warm contacts." },
  { key: "partner", label: "Referral partner", coldEmail: false,
    note: "Referral partners are never cold emailed. Contact them by hand." },
];

// Managed-services brands use the audit_* templates, drop-ship brands use
// dropship_*, and every other mode uses the general sequence. Situational
// replies (step 0) are shared by all.
const TRACK_PREFIX: Record<string, string> = { channel: "audit_", dropship: "dropship_" };
const OWN_PREFIXES = Object.values(TRACK_PREFIX);

export const forTrack = (t: { key: string; step: number }, angle: string) => {
  if (t.step === 0) return true;
  const prefix = TRACK_PREFIX[angle || "channel"];
  return prefix ? t.key.startsWith(prefix) : !OWN_PREFIXES.some((p) => t.key.startsWith(p));
};

export function stepsForSegment<T extends { key: string; step: number; active?: boolean; context?: string }>(
  templates: T[], angle: string,
): T[] {
  return templates
    .filter((t) => (t.context ?? "prospect") === "prospect" && t.step > 0 && t.active !== false && forTrack(t, angle))
    .sort((a, b) => a.step - b.step);
}

export interface ReadyInput {
  angle: string; stage: string; contactEmail: string; openingLine: string; tradeShow: string;
}

// Ready to send: still in the first stages, not a partner, a valid email, and
// something to open with (an opening line, or a show hook from the trade show).
export function readyToSend(p: ReadyInput): boolean {
  if (p.angle === "partner") return false;
  if (p.stage !== "sourced" && p.stage !== "researched") return false;
  if (!isValidEmail(p.contactEmail ?? "")) return false;
  return !!(p.openingLine?.trim() || p.tradeShow?.trim());
}
