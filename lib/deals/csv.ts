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

// Fuzzy auto-mapping for the "SmartScout" preset. Values are ordered
// lowercase substrings to try against each header.
export const SMARTSCOUT_HINTS: Record<string, string[]> = {
  brandName: ["brand name", "brand", "manufacturer"],
  website: ["website", "domain", "url", "web site"],
  category: ["subcategory", "sub category", "category", "main category"],
  contactEmail: ["email", "contact email", "e-mail"],
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
