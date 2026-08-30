"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import AdminShell from "../AdminShell";
import { OutreachSection, type OutreachEmail, type EmailTemplate } from "../OutreachSection";
import { parseCsv, autoMap, SMARTSCOUT_HINTS } from "@/lib/deals/csv";
import { readSession } from "@/lib/admin/session";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";
const red = "#B91C1C";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tri = boolean | null;

interface ScoreDetail {
  derived: {
    monthlyRevenue: number | null;
    equityUnits: number | null;
    equityRevenue: number | null;
    estProfit15: number | null;
  };
  gates: { key: string; label: string; passed: Tri }[];
  criteria: { key: string; label: string; weight: number; passed: Tri; auto: boolean }[];
  maxScore: number;
  hazmatDisqualified: boolean;
}

interface Product {
  id: string;
  prospectId: string;
  asin: string;
  title: string;
  productUrl: string;
  primeLowPrice: number | null;
  unitsPerMonth: number | null;
  reviewCount: number | null;
  rating: number | null;
  sellerCount: number | null;
  amazonIsSeller: Tri;
  priceStable90d: Tri;
  salesStable90d: Tri;
  merchantFulfilledControlsBB: Tri;
  suppressedBuyBox: Tri;
  manufacturerOnListing: Tri;
  brandRestricted: Tri;
  isThirdPartyBundle: Tri;
  isMultipack: Tri;
  hasFragileItems: Tri;
  hazmat: Tri;
  buyCost: number | null;
  prepCost: number | null;
  shipCostPerUnit: number | null;
  targetRoi: number | null;
  fbaFee: number | null;
  referralRate: number | null;
  score: number | null;
  band: string;
  gatesStatus: string;
  scoreDetail: ScoreDetail | null;
  snapshotSource: string;
  snapshotAt: string | null;
}

interface Prospect {
  id: string;
  brandName: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  category: string;
  stage: string;
  source: string;
  archiveReason: string;
  fitRank: number | null;
  openingLine: string;
  notes: string;
  firstEmailAt: string | null;
  secondEmailAt: string | null;
  products: Product[];
  emails: OutreachEmail[];
  updatedAt: string;
}

const STAGES = [
  "sourced", "researched", "contacted", "replied",
  "negotiating", "account_open", "active", "passed",
];
const STAGE_LABEL: Record<string, string> = {
  sourced: "Sourced", researched: "Researched", contacted: "Contacted",
  replied: "Replied", negotiating: "Negotiating", account_open: "Account open",
  active: "Active", passed: "Passed",
};
const BAND_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  high_priority: { bg: "#DCFCE7", fg: "#15803D", label: "High priority" },
  contact: { bg: "#FEF9C3", fg: "#A16207", label: "Contact" },
  archive: { bg: "#FEE2E2", fg: "#991B1B", label: "Archive" },
};

// ─── Session ─────────────────────────────────────────────────────────────────

function useAdminToken() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => { setToken(readSession()); }, []);
  return token;
}

// ─── Small UI helpers ────────────────────────────────────────────────────────

function TriToggle({ value, onChange }: { value: Tri; onChange: (v: Tri) => void }) {
  const opts: [string, Tri, string][] = [
    ["Yes", true, green], ["No", false, red], ["?", null, muted],
  ];
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {opts.map(([label, v, color]) => {
        const active = value === v;
        return (
          <button key={label} onClick={() => onChange(v)}
            style={{
              background: active ? color : "#F3F4F6",
              color: active ? "#fff" : muted,
              border: "none", borderRadius: 6, padding: "3px 9px",
              fontSize: 11, fontWeight: 700, cursor: "pointer", minWidth: 30,
            }}>
            {label}
          </button>
        );
      })}
    </span>
  );
}

function NumField({ label, value, suffix, prefix, step, onCommit }: {
  label: string; value: number | null; suffix?: string; prefix?: string;
  step?: string; onCommit: (v: number | null) => void;
}) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  useEffect(() => { setDraft(value == null ? "" : String(value)); }, [value]);
  return (
    <label style={{ display: "block", fontSize: 12 }}>
      <span style={{ color: muted, fontWeight: 600 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
        {prefix && <span style={{ color: muted, fontSize: 12 }}>{prefix}</span>}
        <input
          type="number" step={step ?? "any"} value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const v = draft.trim() === "" ? null : Number(draft);
            if (v !== value) onCommit(Number.isNaN(v as number) ? null : v);
          }}
          style={{
            width: "100%", padding: "6px 8px", fontSize: 13, border: `1px solid ${border}`,
            borderRadius: 6, fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
        {suffix && <span style={{ color: muted, fontSize: 12 }}>{suffix}</span>}
      </span>
    </label>
  );
}

const fmt$ = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtN = (n: number | null | undefined, d = 0) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: d });

// ─── Excess-inventory calculator (client-only, not persisted) ─────────────────

function ExcessCalculator() {
  const [i, setI] = useState({
    unitsOnHand: 500, unitCost: 8, monthlyHoldingCostPerUnit: 0.6,
    liquidationPricePerUnit: 4, promoPricePerUnit: 14,
    promoSelloutWeeks: 8, promoChannelFeeRate: 0.15,
  });
  const set = (k: keyof typeof i) => (v: number | null) => setI((s) => ({ ...s, [k]: v ?? 0 }));

  const r = useMemo(() => {
    const costBasis = i.unitsOnHand * i.unitCost;
    const liquidateNow = i.unitsOnHand * i.liquidationPricePerUnit;
    const holdingCost = i.unitsOnHand * i.monthlyHoldingCostPerUnit * (i.promoSelloutWeeks / 4.345) * 0.5;
    const promoGross = i.unitsOnHand * i.promoPricePerUnit;
    const promoFees = promoGross * i.promoChannelFeeRate;
    const promoNet = promoGross - promoFees - holdingCost;
    return {
      costBasis, liquidateNow, promoNet, holdingCost, promoFees,
      liqPct: costBasis ? liquidateNow / costBasis : 0,
      promoPct: costBasis ? promoNet / costBasis : 0,
      advantage: promoNet - liquidateNow,
    };
  }, [i]);

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 10, padding: 14, marginTop: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", color: navy }}>
        Excess-inventory recovery
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
        <NumField label="Units on hand" value={i.unitsOnHand} onCommit={set("unitsOnHand")} />
        <NumField label="Unit cost" prefix="$" value={i.unitCost} onCommit={set("unitCost")} />
        <NumField label="Holding $/unit/mo" prefix="$" value={i.monthlyHoldingCostPerUnit} onCommit={set("monthlyHoldingCostPerUnit")} />
        <NumField label="Liquidator $/unit" prefix="$" value={i.liquidationPricePerUnit} onCommit={set("liquidationPricePerUnit")} />
        <NumField label="Promo $/unit (gross)" prefix="$" value={i.promoPricePerUnit} onCommit={set("promoPricePerUnit")} />
        <NumField label="Sell-through wks" value={i.promoSelloutWeeks} onCommit={set("promoSelloutWeeks")} />
        <NumField label="Channel fee rate" value={i.promoChannelFeeRate} step="0.01" onCommit={set("promoChannelFeeRate")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div style={{ background: "#FEE2E2", borderRadius: 8, padding: 10 }}>
          <p style={{ fontSize: 11, color: "#991B1B", fontWeight: 700, margin: 0 }}>LIQUIDATE NOW</p>
          <p style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", color: navy }}>{fmt$(r.liquidateNow)}</p>
          <p style={{ fontSize: 11, color: muted, margin: "2px 0 0" }}>{(r.liqPct * 100).toFixed(0)}% of cost basis</p>
        </div>
        <div style={{ background: "#DCFCE7", borderRadius: 8, padding: 10 }}>
          <p style={{ fontSize: 11, color: "#15803D", fontWeight: 700, margin: 0 }}>PROMO ACROSS CHANNELS</p>
          <p style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", color: navy }}>{fmt$(r.promoNet)}</p>
          <p style={{ fontSize: 11, color: muted, margin: "2px 0 0" }}>{(r.promoPct * 100).toFixed(0)}% of cost basis · net of {fmt$(r.promoFees)} fees + {fmt$(r.holdingCost)} holding</p>
        </div>
      </div>
      <p style={{ fontSize: 12, margin: "10px 0 0", color: r.advantage >= 0 ? green : red, fontWeight: 700 }}>
        {r.advantage >= 0 ? "Promo recovers " : "Liquidating recovers "}
        {fmt$(Math.abs(r.advantage))} {r.advantage >= 0 ? "more" : "more"} than the alternative.
      </p>
    </div>
  );
}

// ─── Product card ────────────────────────────────────────────────────────────

const SNAPSHOT_TOGGLES: [keyof Product, string][] = [
  ["amazonIsSeller", "Amazon is a seller"],
  ["priceStable90d", "Price stable 90d (±10%)"],
  ["salesStable90d", "Sales stable 90d"],
  ["merchantFulfilledControlsBB", "MFN controls buy box"],
  ["suppressedBuyBox", "Buy box suppressed"],
];
const REVIEW_TOGGLES: [keyof Product, string][] = [
  ["manufacturerOnListing", "Manufacturer on listing w/ others"],
  ["brandRestricted", "Brand-restricted"],
  ["isThirdPartyBundle", "Is a 3P bundle"],
  ["isMultipack", "Is a multi-pack"],
  ["hasFragileItems", "Contains fragile items"],
  ["hazmat", "Hazmat (disqualifier)"],
];

function ProductCard({ product, token, onChange, onDelete, keepaOn }: {
  product: Product; token: string; keepaOn: boolean;
  onChange: (p: Product) => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const patch = useCallback(async (partial: Record<string, unknown>) => {
    setBusy(true);
    const r = await fetch(`/api/admin/deals/product/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(partial),
    });
    if (r.ok) onChange(await r.json());
    setBusy(false);
  }, [product.id, token, onChange]);

  const refresh = useCallback(async () => {
    setBusy(true);
    const r = await fetch("/api/admin/deals/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ input: product.asin }),
    });
    const j = await r.json();
    if (j.snapshot) {
      const s = j.snapshot;
      await patch({
        primeLowPrice: s.primeLowPrice, unitsPerMonth: s.unitsPerMonth,
        reviewCount: s.reviewCount, rating: s.rating, sellerCount: s.sellerCount,
        amazonIsSeller: s.amazonIsSeller, priceStable90d: s.priceStable90d,
        salesStable90d: s.salesStable90d, merchantFulfilledControlsBB: s.merchantFulfilledControlsBB,
        suppressedBuyBox: s.suppressedBuyBox, fbaFee: s.fbaFee, referralRate: s.referralRate,
        title: s.title, snapshotSource: "keepa",
      });
    }
    setBusy(false);
  }, [product.asin, token, patch]);

  const d = product.scoreDetail;
  const band = BAND_STYLE[product.band] ?? { bg: "#F3F4F6", fg: muted, label: "Unscored" };
  const gateColor = product.gatesStatus === "pass" ? green
    : product.gatesStatus === "fail" ? red : muted;

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", background: "#fff" }}>
        <span style={{ fontSize: 11, color: muted }}>{open ? "▾" : "▸"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {product.title || product.asin}
          </p>
          <p style={{ fontSize: 11, color: muted, margin: "1px 0 0" }}>
            {product.asin} · {product.snapshotSource}
            {product.snapshotAt ? ` · ${new Date(product.snapshotAt).toLocaleDateString()}` : ""}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: gateColor }}>
          gates: {product.gatesStatus}
        </span>
        <span style={{ background: band.bg, color: band.fg, fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 16 }}>
          {product.score ?? "—"}/100 · {band.label}
        </span>
      </div>

      {open && (
        <div style={{ padding: 14, borderTop: `1px solid ${border}`, background: "#FAFAFA" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <a href={product.productUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: orange, fontWeight: 600 }}>Open on Amazon ↗</a>
            {keepaOn && (
              <button onClick={refresh} disabled={busy}
                style={{ marginLeft: "auto", background: navy, color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {busy ? "…" : "Refresh from Keepa"}
              </button>
            )}
            <button onClick={onDelete}
              style={{ background: "none", border: `1px solid ${border}`, color: red, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
              Remove
            </button>
          </div>

          {/* Snapshot numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
            <NumField label="Prime low price" prefix="$" value={product.primeLowPrice} onCommit={(v) => patch({ primeLowPrice: v })} />
            <NumField label="Units / month" value={product.unitsPerMonth} onCommit={(v) => patch({ unitsPerMonth: v })} />
            <NumField label="Review count" value={product.reviewCount} onCommit={(v) => patch({ reviewCount: v })} />
            <NumField label="Sellers (excl. us)" value={product.sellerCount} onCommit={(v) => patch({ sellerCount: v })} />
          </div>

          {/* Snapshot toggles */}
          <div style={{ marginTop: 12 }}>
            {SNAPSHOT_TOGGLES.map(([k, label]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ fontSize: 12, color: navy }}>{label}</span>
                <TriToggle value={product[k] as Tri} onChange={(v) => patch({ [k]: v })} />
              </div>
            ))}
          </div>

          {/* Manual review toggles */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "14px 0 6px" }}>
            Manual review
          </p>
          {REVIEW_TOGGLES.map(([k, label]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontSize: 12, color: navy }}>{label}</span>
              <TriToggle value={product[k] as Tri} onChange={(v) => patch({ [k]: v })} />
            </div>
          ))}

          {/* Economics */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "14px 0 6px" }}>
            Deal economics
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
            <NumField label="Buy cost" prefix="$" value={product.buyCost} onCommit={(v) => patch({ buyCost: v })} />
            <NumField label="Prep cost" prefix="$" value={product.prepCost} onCommit={(v) => patch({ prepCost: v })} />
            <NumField label="Ship / unit" prefix="$" value={product.shipCostPerUnit} onCommit={(v) => patch({ shipCostPerUnit: v })} />
            <NumField label="Target ROI" suffix="(0-1)" step="0.05" value={product.targetRoi} onCommit={(v) => patch({ targetRoi: v })} />
            <NumField label="FBA fee" prefix="$" value={product.fbaFee} onCommit={(v) => patch({ fbaFee: v })} />
            <NumField label="Referral rate" suffix="(0-1)" step="0.01" value={product.referralRate} onCommit={(v) => patch({ referralRate: v })} />
          </div>

          {/* Computed */}
          {d && <Computed product={product} d={d} />}
        </div>
      )}
    </div>
  );
}

function Computed({ product, d }: { product: Product; d: ScoreDetail }) {
  const aspMin = useMemo(() => {
    const prep = product.prepCost, ship = product.shipCostPerUnit, roi = product.targetRoi;
    if (prep == null || ship == null || roi == null) return null;
    const fba = product.fbaFee ?? 3.5;
    const ref = product.referralRate ?? 0.15;
    const denom = 1 - 0.5 - ref - 0.5 * roi;
    return denom > 0 ? (prep + ship + fba) / denom : null;
  }, [product.prepCost, product.shipCostPerUnit, product.targetRoi, product.fbaFee, product.referralRate]);

  const mark = (t: Tri) => (t === true ? "✓" : t === false ? "✕" : "?");
  const markColor = (t: Tri) => (t === true ? green : t === false ? red : muted);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 12 }}>
        {[
          ["Revenue/mo", fmt$(d.derived.monthlyRevenue)],
          ["Equity units/mo", fmtN(d.derived.equityUnits, 0)],
          ["Equity rev/mo", fmt$(d.derived.equityRevenue)],
          ["Profit @15%/mo", fmt$(d.derived.estProfit15)],
          ["ASP floor", aspMin == null ? "—" : fmt$(aspMin)],
        ].map(([label, val]) => (
          <div key={label} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 10px" }}>
            <p style={{ fontSize: 10, color: muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
            <p style={{ fontSize: 15, fontWeight: 800, margin: "2px 0 0", color: navy }}>{val}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "0 0 4px" }}>
        4-point gates {d.hazmatDisqualified && <span style={{ color: red }}>· HAZMAT — disqualified</span>}
      </p>
      {d.gates.map((g) => (
        <div key={g.key} style={{ fontSize: 12, padding: "2px 0", color: navy }}>
          <span style={{ color: markColor(g.passed), fontWeight: 800, marginRight: 6 }}>{mark(g.passed)}</span>
          {g.label}
        </div>
      ))}

      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "12px 0 4px" }}>
        20-point rubric — {product.score}/{d.maxScore}
      </p>
      <div style={{ height: 8, background: "#E5E7EB", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${product.score ?? 0}%`, height: "100%", background: orange }} />
      </div>
      {d.criteria.map((c) => (
        <div key={c.key} style={{ fontSize: 12, padding: "2px 0", display: "flex", gap: 6, color: navy }}>
          <span style={{ color: markColor(c.passed), fontWeight: 800 }}>{mark(c.passed)}</span>
          <span style={{ flex: 1 }}>{c.label}</span>
          <span style={{ color: muted }}>{c.weight}{c.auto ? "" : " ·m"}</span>
        </div>
      ))}

      <ExcessCalculator />
    </div>
  );
}


// ─── Detail panel ────────────────────────────────────────────────────────────

function ProspectDetail({ prospect, templates, token, keepaOn, onUpdate, onReload, onDelete }: {
  prospect: Prospect; templates: EmailTemplate[]; token: string; keepaOn: boolean;
  onUpdate: (p: Prospect) => void; onReload: () => Promise<void>; onDelete: () => void;
}) {
  const [notes, setNotes] = useState(prospect.notes);
  const [newAsin, setNewAsin] = useState("");
  const [adding, setAdding] = useState(false);
  useEffect(() => { setNotes(prospect.notes); }, [prospect.id, prospect.notes]);

  const patch = useCallback(async (partial: Record<string, unknown>) => {
    const r = await fetch(`/api/admin/deals/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(partial),
    });
    if (r.ok) onUpdate(await r.json());
  }, [prospect.id, token, onUpdate]);

  const addProduct = useCallback(async () => {
    if (!newAsin.trim()) return;
    setAdding(true);
    const r = await fetch("/api/admin/deals/product", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ prospectId: prospect.id, asin: newAsin.trim(), autoLookup: keepaOn }),
    });
    if (r.ok) {
      const p: Product = await r.json();
      onUpdate({ ...prospect, products: [...prospect.products, p] });
      setNewAsin("");
    } else {
      alert((await r.json()).error ?? "Failed to add.");
    }
    setAdding(false);
  }, [newAsin, prospect, token, keepaOn, onUpdate]);

  const field = (label: string, key: keyof Prospect, type = "text") => {
    const raw = (prospect[key] as string) ?? "";
    const value = type === "date" && raw ? raw.slice(0, 10) : raw;
    return (
      <label key={`${key}-${raw}`} style={{ display: "block", fontSize: 12, marginBottom: 8 }}>
        <span style={{ color: muted, fontWeight: 600 }}>{label}</span>
        <input
          type={type} defaultValue={value}
          onBlur={(e) => { if (e.target.value !== value) patch({ [key]: e.target.value }); }}
          style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: `1px solid ${border}`, borderRadius: 6, marginTop: 3, boxSizing: "border-box", fontFamily: "inherit" }}
        />
      </label>
    );
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <input
          defaultValue={prospect.brandName}
          onBlur={(e) => { if (e.target.value !== prospect.brandName) patch({ brandName: e.target.value }); }}
          style={{ fontSize: 17, fontWeight: 800, color: navy, border: "none", outline: "none", width: "70%", fontFamily: "inherit" }}
        />
        <button onClick={onDelete} style={{ background: "none", border: "none", color: red, cursor: "pointer", fontSize: 13 }}>Delete</button>
      </div>

      {/* Stage */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {STAGES.map((s) => (
          <button key={s} onClick={() => patch({ stage: s })}
            style={{
              background: prospect.stage === s ? navy : "#F3F4F6",
              color: prospect.stage === s ? "#fff" : muted,
              border: "none", borderRadius: 16, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}>
            {STAGE_LABEL[s]}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {field("Website", "website")}
        {field("Category", "category")}
        {field("Contact name", "contactName")}
        {field("Contact email", "contactEmail", "email")}
        {field("Contact phone", "contactPhone")}
        {field("Source", "source")}
        {field("1st email", "firstEmailAt", "date")}
        {field("2nd email", "secondEmailAt", "date")}
      </div>

      <label key={`opening-${prospect.id}`} style={{ display: "block", fontSize: 12, marginTop: 4 }}>
        <span style={{ color: muted, fontWeight: 600 }}>
          Opening line <span style={{ fontWeight: 400 }}>— the specific hook for the first cold email ({"{{opening}}"})</span>
        </span>
        <textarea defaultValue={prospect.openingLine} rows={2}
          placeholder="e.g. Noticed 8 sellers on your top listing and no Walmart presence."
          onBlur={(e) => { if (e.target.value !== prospect.openingLine) patch({ openingLine: e.target.value }); }}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${border}`, borderRadius: 6, marginTop: 3, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
        />
      </label>

      <label style={{ display: "block", fontSize: 12, marginTop: 10 }}>
        <span style={{ color: muted, fontWeight: 600 }}>Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== prospect.notes) patch({ notes }); }}
          rows={3}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${border}`, borderRadius: 6, marginTop: 3, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
        />
      </label>

      <OutreachSection
        ownerKind="prospect" ownerId={prospect.id} contactEmail={prospect.contactEmail}
        emails={prospect.emails ?? []}
        templates={templates.filter((t) => t.context === "prospect")}
        token={token}
        onEmailsChange={(emails) => onUpdate({ ...prospect, emails })}
        onOwnerRefetch={onReload}
      />

      {/* Products */}
      <div style={{ marginTop: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "0 0 8px" }}>
          Candidate products ({prospect.products.length})
        </p>
        {prospect.products.map((p) => (
          <ProductCard
            key={p.id} product={p} token={token} keepaOn={keepaOn}
            onChange={(np) => onUpdate({ ...prospect, products: prospect.products.map((x) => x.id === np.id ? np : x) })}
            onDelete={async () => {
              if (!confirm(`Remove ${p.asin}?`)) return;
              await fetch(`/api/admin/deals/product/${p.id}`, { method: "DELETE", headers: { "x-admin-token": token } });
              onUpdate({ ...prospect, products: prospect.products.filter((x) => x.id !== p.id) });
            }}
          />
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newAsin} onChange={(e) => setNewAsin(e.target.value)}
            placeholder="ASIN or Amazon URL"
            onKeyDown={(e) => { if (e.key === "Enter") addProduct(); }}
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${border}`, borderRadius: 6, fontFamily: "inherit" }}
          />
          <button onClick={addProduct} disabled={adding}
            style={{ background: navy, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {adding ? "Adding…" : keepaOn ? "Add + look up" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DealDeskPage() {
  const token = useAdminToken();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [keepaOn, setKeepaOn] = useState(false);
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("fit");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newBrand, setNewBrand] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    const [pr, lk, tp] = await Promise.all([
      fetch("/api/admin/deals", { headers: { "x-admin-token": token } }),
      fetch("/api/admin/deals/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ input: "B000000000" }),
      }),
      fetch("/api/admin/deals/templates", { headers: { "x-admin-token": token } }),
    ]);
    setProspects(await pr.json());
    try { setKeepaOn((await lk.json()).configured === true); } catch { /* */ }
    try { setTemplates(await tp.json()); } catch { /* */ }
    setLoading(false);
  }, [token]);

  const reloadSilent = useCallback(() => load(true), [load]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const createProspect = useCallback(async () => {
    if (!newBrand.trim() || !token) return;
    const r = await fetch("/api/admin/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ brandName: newBrand.trim() }),
    });
    if (r.ok) {
      const p: Prospect = await r.json();
      setProspects((ps) => [{ ...p, products: p.products ?? [], emails: p.emails ?? [] }, ...ps]);
      setSelectedId(p.id);
      setNewBrand(""); setShowNew(false);
    }
  }, [newBrand, token]);

  if (token === undefined || (loading && token)) {
    return <Centered>Loading…</Centered>;
  }
  if (token === null) {
    return <Centered><a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a></Centered>;
  }

  const bestScore = (p: Prospect) => p.products.reduce((m, x) => Math.max(m, x.score ?? -1), -1);
  const SORTS: Record<string, (a: Prospect, b: Prospect) => number> = {
    fit: (a, b) => (a.fitRank ?? 9e9) - (b.fitRank ?? 9e9) || a.brandName.localeCompare(b.brandName),
    score: (a, b) => bestScore(b) - bestScore(a),
    updated: (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
    name: (a, b) => a.brandName.localeCompare(b.brandName),
  };
  const filtered = (stageFilter === "all" ? prospects : prospects.filter((p) => p.stage === stageFilter))
    .slice().sort(SORTS[sortBy] ?? SORTS.fit);
  const selected = prospects.find((p) => p.id === selectedId) ?? null;

  return (
    <AdminShell
      title="Deal Desk"
      actions={
        <>
          <span style={{ fontSize: 11, fontWeight: 600, color: keepaOn ? "#15803D" : "#B45309" }}>
            Keepa {keepaOn ? "connected" : "not configured"}
          </span>
          <button onClick={() => load()} style={{ background: "#fff", border: `1px solid ${border}`, color: muted, padding: "5px 14px", fontSize: 13, borderRadius: 6, cursor: "pointer" }}>
            Refresh
          </button>
        </>
      }
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          {["all", ...STAGES].map((s) => (
            <button key={s} onClick={() => setStageFilter(s)}
              style={{
                background: stageFilter === s ? navy : "#F3F4F6",
                color: stageFilter === s ? "#fff" : muted,
                border: "none", borderRadius: 16, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
              {s === "all" ? `All (${prospects.length})` : `${STAGE_LABEL[s]} (${prospects.filter((p) => p.stage === s).length})`}
            </button>
          ))}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            style={{ marginLeft: "auto", fontSize: 12, border: `1px solid ${border}`, borderRadius: 8, padding: "6px 8px", color: muted, background: "#fff" }}>
            <option value="fit">Sort: Fit rank</option>
            <option value="score">Sort: Best score</option>
            <option value="updated">Sort: Recently updated</option>
            <option value="name">Sort: A–Z</option>
          </select>
          <button onClick={() => { setShowImport((v) => !v); setShowNew(false); }}
            style={{ background: "#fff", color: navy, border: `1px solid ${border}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Import CSV
          </button>
          <button onClick={() => { setShowNew((v) => !v); setShowImport(false); }}
            style={{ background: orange, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + New prospect
          </button>
        </div>

        {showNew && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)}
              placeholder="Brand name" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") createProspect(); }}
              style={{ flex: 1, padding: "9px 12px", fontSize: 14, border: `1px solid ${border}`, borderRadius: 8, fontFamily: "inherit" }}
            />
            <button onClick={createProspect}
              style={{ background: navy, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Create
            </button>
          </div>
        )}

        {showImport && (
          <ImportPanel token={token} onImported={reloadSilent} onClose={() => setShowImport(false)} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: selected ? "minmax(0,420px) 1fr" : "1fr", gap: 20, alignItems: "start" }}>
          <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 36, textAlign: "center", color: muted, fontSize: 14 }}>No prospects.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${border}` }}>
                    {["#", "Brand", "Stage", "Products", "Best"].map((h) => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, color: muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const bs = bestScore(p);
                    return (
                      <tr key={p.id} onClick={() => setSelectedId(p.id)}
                        style={{ borderBottom: `1px solid ${border}`, cursor: "pointer", background: selectedId === p.id ? "#F0F9FF" : "#fff" }}>
                        <td style={{ padding: "9px 12px", color: muted, fontWeight: 700, width: 32 }}>{p.fitRank ?? "—"}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: navy }}>
                          {p.brandName}
                          <div style={{ fontSize: 11, color: muted, fontWeight: 400 }}>{p.category || "—"}</div>
                        </td>
                        <td style={{ padding: "9px 12px", color: muted }}>{STAGE_LABEL[p.stage] ?? p.stage}</td>
                        <td style={{ padding: "9px 12px", color: muted }}>{p.products.length}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: bs >= 76 ? green : bs >= 66 ? "#A16207" : bs >= 0 ? red : muted }}>
                          {bs >= 0 ? `${bs}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <ProspectDetail
              prospect={selected} templates={templates} token={token} keepaOn={keepaOn}
              onUpdate={(np) => setProspects((ps) => ps.map((x) => x.id === np.id ? np : x))}
              onReload={reloadSilent}
              onDelete={async () => {
                if (!confirm(`Delete ${selected.brandName}?`)) return;
                await fetch(`/api/admin/deals/${selected.id}`, { method: "DELETE", headers: { "x-admin-token": token } });
                setProspects((ps) => ps.filter((x) => x.id !== selected.id));
                setSelectedId(null);
              }}
            />
          )}
        </div>
      </div>
    </AdminShell>
  );
}

// ─── CSV import ──────────────────────────────────────────────────────────────

const CORE_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "brandName", label: "Brand name", required: true },
  { key: "website", label: "Website" },
  { key: "category", label: "Category" },
  { key: "contactEmail", label: "Contact email" },
  { key: "fitRank", label: "Fit rank" },
];

function ImportPanel({ token, onImported, onClose }: {
  token: string; onImported: () => Promise<void>; onClose: () => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [noteCols, setNoteCols] = useState<string[]>([]);
  const [preset, setPreset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [err, setErr] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { headers: h, rows: r } = parseCsv(String(reader.result ?? ""));
        if (!h.length) { setErr("Couldn't read any columns from that file."); return; }
        setHeaders(h); setRows(r);
        const auto = autoMap(h, SMARTSCOUT_HINTS);
        setMap(auto);
        setNoteCols(h.filter((c) => !Object.values(auto).includes(c)));
      } catch { setErr("Failed to parse the CSV."); }
    };
    reader.readAsText(file);
  }

  function applyPreset() {
    setPreset(true);
    const auto = autoMap(headers, SMARTSCOUT_HINTS);
    setMap(auto);
    setNoteCols(headers.filter((c) => !Object.values(auto).includes(c)));
  }

  const brandCol = map.brandName;
  const buildRow = (r: Record<string, string>) => {
    const notes = noteCols
      .map((c) => (r[c] ? `${c}: ${r[c]}` : ""))
      .filter(Boolean).join(" · ").slice(0, 500);
    return {
      brandName: brandCol ? r[brandCol] : "",
      website: map.website ? r[map.website] : "",
      category: map.category ? r[map.category] : "",
      contactEmail: map.contactEmail ? r[map.contactEmail] : "",
      fitRank: map.fitRank ? r[map.fitRank] : "",
      notes: notes ? `${preset ? "SmartScout import" : "CSV import"} — ${notes}` : "",
    };
  };

  const ready = !!brandCol && rows.length > 0;
  const validCount = ready ? rows.filter((r) => (r[brandCol] ?? "").trim()).length : 0;

  async function doImport() {
    setBusy(true); setErr("");
    const payload = { rows: rows.map(buildRow), source: preset ? "smartscout" : "import" };
    const res = await fetch("/api/admin/deals/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error ?? "Import failed."); return; }
    const j = await res.json();
    setResult(j);
    await onImported();
  }

  const sel: React.CSSProperties = {
    padding: "6px 8px", fontSize: 12, border: `1px solid ${border}`, borderRadius: 6, fontFamily: "inherit", background: "#fff",
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: navy, margin: 0 }}>Import brands from CSV</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: muted }}>SmartScout, Jungle Scout, Helium 10, or any brand list</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      </div>

      <input type="file" accept=".csv,text/csv" onChange={onFile} style={{ fontSize: 13, marginBottom: 12 }} />
      {err && <p style={{ color: "#DC2626", fontSize: 12, margin: "0 0 10px" }}>{err}</p>}

      {headers.length > 0 && !result && (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <button onClick={applyPreset}
              style={{ background: preset ? navy : "#F3F4F6", color: preset ? "#fff" : muted, border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              SmartScout preset
            </button>
            <span style={{ fontSize: 11, color: muted }}>{rows.length} rows · {headers.length} columns</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginBottom: 12 }}>
            {CORE_FIELDS.map((f) => (
              <label key={f.key} style={{ fontSize: 12 }}>
                <span style={{ color: muted, fontWeight: 600 }}>{f.label}{f.required && <span style={{ color: "#DC2626" }}> *</span>}</span>
                <select value={map[f.key] ?? ""} onChange={(e) => {
                  const v = e.target.value;
                  setMap((m) => ({ ...m, [f.key]: v }));
                  setNoteCols((nc) => v ? nc.filter((c) => c !== v) : nc);
                }} style={{ ...sel, width: "100%", marginTop: 3 }}>
                  <option value="">— none —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "0 0 6px" }}>
            Fold into notes
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {headers.filter((h) => !Object.values(map).includes(h)).map((h) => {
              const on = noteCols.includes(h);
              return (
                <button key={h} onClick={() => setNoteCols((nc) => on ? nc.filter((c) => c !== h) : [...nc, h])}
                  style={{ background: on ? "#EEF2FF" : "#F3F4F6", color: on ? "#3730A3" : muted, border: `1px solid ${on ? "#C7D2FE" : border}`, borderRadius: 6, padding: "3px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {h}
                </button>
              );
            })}
          </div>

          {ready && (
            <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 10, marginBottom: 12, background: "#FAFAFA" }}>
              <p style={{ fontSize: 11, color: muted, margin: "0 0 6px", fontWeight: 700 }}>Preview (first 3)</p>
              {rows.slice(0, 3).map((r, i) => {
                const b = buildRow(r);
                return (
                  <div key={i} style={{ fontSize: 12, marginBottom: 6, color: navy }}>
                    <strong>{b.brandName || "(no name — will skip)"}</strong>
                    {b.category ? ` · ${b.category}` : ""}{b.website ? ` · ${b.website}` : ""}
                    {b.notes ? <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>{b.notes}</div> : null}
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={doImport} disabled={!ready || busy}
            style={{ background: ready ? navy : "#9CA3AF", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: ready ? "pointer" : "not-allowed" }}>
            {busy ? "Importing…" : `Import ${validCount} brand${validCount === 1 ? "" : "s"}`}
          </button>
        </>
      )}

      {result && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 13, color: green, fontWeight: 700, margin: 0 }}>
            Imported {result.created} · skipped {result.skipped} (blank or already in pipeline)
          </p>
          <button onClick={onClose} style={{ background: navy, color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Done</button>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontFamily: "system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
