// Builds an Instantly-ready CSV from Deal Desk prospects. Pure function so it
// can be tested without the UI. Instantly turns every extra column into a
// merge variable, e.g. {{personalization}}, {{trade_show}}, {{booth}}.

export interface ExportProspect {
  id: string;
  brandName: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  category: string;
  stage: string;
  angle: string;
  openingLine: string;
  tradeShow: string;
  booth: string;
}

export interface ExportOptions {
  includeWithoutEmail?: boolean;
}

export interface ExportResult {
  csv: string;
  included: number;
  stats: {
    total: number;
    withEmail: number;
    missingEmail: number;
    invalidEmail: number;
    duplicateEmail: number;
    partner: number;
    alreadyContacted: number;
    roleAddresses: number;
  };
}

const SEGMENT: Record<string, string> = {
  channel: "managed_services",
  dropship: "drop_ship",
  excess: "excess_woot",
  partner: "partner",
};

const ROLE = /^(info|sales|support|contact|hello|admin|office|service|orders|help|customerservice)@/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HEADERS = [
  "email", "first_name", "last_name", "company_name", "website", "phone",
  "personalization", "trade_show", "booth", "segment", "category", "deal_desk_id",
];

function csvCell(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ["", ""];
  return [parts[0], parts.slice(1).join(" ")];
}

// The opening line wins. Without one, fall back to a factual show hook that
// claims no meeting: it only says the brand was exhibiting.
function personalization(p: ExportProspect): string {
  const own = p.openingLine.trim();
  if (own) return own;
  const show = p.tradeShow.trim();
  if (!show) return "";
  const booth = p.booth.trim();
  return `I saw ${p.brandName} was exhibiting at ${show}${booth ? ` (booth ${booth})` : ""}.`;
}

export function buildInstantlyCsv(prospects: ExportProspect[], opts: ExportOptions = {}): ExportResult {
  const stats = {
    total: prospects.length, withEmail: 0, missingEmail: 0, invalidEmail: 0,
    duplicateEmail: 0, partner: 0, alreadyContacted: 0, roleAddresses: 0,
  };
  const seen = new Set<string>();
  const lines: string[] = [HEADERS.join(",")];
  let included = 0;

  for (const p of prospects) {
    if (p.angle === "partner") { stats.partner++; continue; }
    if (p.stage !== "sourced" && p.stage !== "researched") { stats.alreadyContacted++; continue; }

    const email = p.contactEmail.trim();
    if (!email) {
      stats.missingEmail++;
      if (!opts.includeWithoutEmail) continue;
    } else if (!EMAIL.test(email)) {
      stats.invalidEmail++;
      if (!opts.includeWithoutEmail) continue;
    } else {
      const key = email.toLowerCase();
      if (seen.has(key)) { stats.duplicateEmail++; continue; }
      seen.add(key);
      stats.withEmail++;
      if (ROLE.test(email)) stats.roleAddresses++;
    }

    const [first, last] = splitName(p.contactName);
    const row = [
      email, first, last, p.brandName, p.website, p.contactPhone,
      personalization(p), p.tradeShow, p.booth, SEGMENT[p.angle] ?? "managed_services",
      p.category, p.id,
    ];
    lines.push(row.map((c) => csvCell(String(c ?? ""))).join(","));
    included++;
  }

  return { csv: lines.join("\r\n") + "\r\n", included, stats };
}
