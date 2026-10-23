// Minimal RFC-4180 CSV parser — handles quoted fields, embedded commas /
// newlines, and "" escaped quotes. Enough for marketplace-tool exports
// (SmartScout, Jungle Scout, Helium 10, plain brand lists).

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(text: string): ParsedCsv {
  const src = text.replace(/^﻿/, ""); // strip BOM
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") records.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); records.push(row); }

  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map((h) => h.trim());
  const rows = records.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
  return { headers, rows };
}

// Tab-separated text, e.g. a trade-show directory copied off a web page: a
// header line with tabs, data rows with tabs, and stray lines (counts, section
// titles, lone name repeats) with none. Dedupes on the first column because
// "featured" and "all" sections repeat the same exhibitors.
export function looksTabSeparated(text: string, fileName = ""): boolean {
  if (/\.csv$/i.test(fileName)) return false;
  return text.split(/\r?\n/).slice(0, 20).some((l) => l.includes("\t"));
}

export function parseTabText(text: string): ParsedCsv {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => l.includes("\t") && l.split("\t")[0].trim() !== "");
  if (headerIdx < 0) return { headers: [], rows: [] };

  const rawHeaderLine = lines[headerIdx];
  const cols = rawHeaderLine.split("\t").map((h) => h.trim());
  const keep = cols.map((h, i) => ({ h, i })).filter((c) => c.h !== "" && !/^add to planner$/i.test(c.h));
  const headers = keep.map((c) => c.h);
  const key = rawHeaderLine.split("\t")[0].trim().toLowerCase();

  const seen = new Set<string>();
  const rows: Record<string, string>[] = [];
  for (let n = headerIdx + 1; n < lines.length; n++) {
    const parts = lines[n].split("\t");
    if (parts.length < 2) continue;
    const first = (parts[0] ?? "").trim();
    if (!first || first.toLowerCase() === key) continue; // blank / repeated header
    const id = first.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    const obj: Record<string, string> = {};
    keep.forEach((c) => { obj[c.h] = (parts[c.i] ?? "").trim(); });
    rows.push(obj);
  }
  return { headers, rows };
}

// Fuzzy auto-mapping for the "SmartScout" preset. Values are ordered
// lowercase substrings to try against each header.
export const SMARTSCOUT_HINTS: Record<string, string[]> = {
  brandName: ["brand name", "brand", "manufacturer", "exhibitor", "company name"],
  website: ["website", "domain", "web site"],
  category: ["subcategory", "sub category", "category", "main category"],
  contactEmail: ["email", "contact email", "e-mail"],
  fitRank: ["fit rank", "rank", "priority"],
  booth: ["booth number", "booth #", "booth no", "booth"],
};

export function autoMap(headers: string[], hints: Record<string, string[]>): Record<string, string> {
  const lower = headers.map((h) => h.toLowerCase());
  const out: Record<string, string> = {};
  for (const [field, needles] of Object.entries(hints)) {
    for (const needle of needles) {
      const idx = lower.findIndex((h) => h === needle);
      if (idx >= 0) { out[field] = headers[idx]; break; }
    }
    if (out[field]) continue;
    for (const needle of needles) {
      const idx = lower.findIndex((h) => h.includes(needle));
      if (idx >= 0) { out[field] = headers[idx]; break; }
    }
  }
  return out;
}
