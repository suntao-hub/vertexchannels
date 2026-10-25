"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import AdminShell from "../AdminShell";
import { readSession } from "@/lib/admin/session";
import { SEGMENTS, readyToSend } from "@/lib/deals/tracks";
import { buildInstantlyCsv, isValidEmail, type ExportProspect } from "@/lib/deals/instantlyExport";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";
const amber = "#B45309";

interface P extends ExportProspect {
  angle: string; stage: string; contactEmail: string; openingLine: string; tradeShow: string;
}
interface Step {
  key: string; name: string; step: number; waitDays: number; dayOverall: number;
  subject: string; body: string;
}
interface SeqData {
  segment: { key: string; label: string; note: string; coldEmail: boolean };
  steps: Step[]; instantlyCopy: string; sample: { id: string; brandName: string } | null;
}

export default function SequencesPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [prospects, setProspects] = useState<P[]>([]);
  const [segment, setSegment] = useState("channel");
  const [sampleId, setSampleId] = useState("");
  const [data, setData] = useState<SeqData | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const copyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setToken(readSession()); }, []);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/deals", { headers: { "x-admin-token": token } })
      .then((r) => r.json()).then(setProspects).catch(() => setErr("Couldn't load brands."));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setData(null); setErr("");
    const q = new URLSearchParams({ segment, ...(sampleId ? { prospectId: sampleId } : {}) });
    fetch(`/api/admin/sequences?${q}`, { headers: { "x-admin-token": token } })
      .then(async (r) => { if (!r.ok) throw new Error("Couldn't load the sequence."); setData(await r.json()); })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load."));
  }, [token, segment, sampleId]);

  const counts = useMemo(() => SEGMENTS.map((s) => {
    const mine = prospects.filter((p) => (p.angle || "channel") === s.key);
    return { ...s, total: mine.length, ready: mine.filter(readyToSend).length };
  }), [prospects]);

  const mine = useMemo(
    () => prospects.filter((p) => (p.angle || "channel") === segment)
      .sort((a, b) => a.brandName.localeCompare(b.brandName)),
    [prospects, segment],
  );
  const exp = useMemo(() => buildInstantlyCsv(mine), [mine]);
  const def = SEGMENTS.find((s) => s.key === segment)!;

  function download() {
    const blob = new Blob([exp.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instantly-${segment}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const copy = useCallback(async () => {
    if (!data?.instantlyCopy) return;
    try { await navigator.clipboard.writeText(data.instantlyCopy); }
    catch { copyRef.current?.select(); document.execCommand?.("copy"); }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }, [data]);

  if (token === null) {
    return (
      <AdminShell title="Sequences">
        <div style={{ padding: 36, textAlign: "center" }}>
          <a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a>
        </div>
      </AdminShell>
    );
  }

  const btn = (primary: boolean, disabled = false): React.CSSProperties => ({
    background: disabled ? "#9CA3AF" : primary ? orange : "#fff", color: primary || disabled ? "#fff" : navy,
    border: primary || disabled ? "none" : `1px solid ${border}`, borderRadius: 8, padding: "8px 16px",
    fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <AdminShell title="Sequences">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, display: "grid", gap: 18 }}>
        <p style={{ fontSize: 13, color: muted, margin: 0, maxWidth: 760 }}>
          One email sequence per offer mode. Each email is shown rendered for a sample brand, exactly as a draft will read.
          Copy the sequence into an Instantly campaign, then export that segment&apos;s list to upload to it.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {counts.map((s) => {
            const on = segment === s.key;
            return (
              <button key={s.key} onClick={() => { setSegment(s.key); setSampleId(""); }}
                style={{ background: on ? navy : "#fff", color: on ? "#fff" : navy, border: `1px solid ${on ? navy : border}`, borderRadius: 16, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {s.label} · {s.total}
                {s.coldEmail && (
                  <span style={{ marginLeft: 6, fontWeight: 600, color: on ? "#BBF7D0" : s.ready > 0 ? green : amber }}>{s.ready} ready</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", display: "grid", gap: 10 }}>
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{def.note}</p>
          {def.coldEmail && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <button onClick={download} disabled={exp.included === 0} style={btn(true, exp.included === 0)}>
                Export {def.label} to Instantly ({exp.included} {exp.included === 1 ? "row" : "rows"})
              </button>
              {exp.included === 0 && (
                <span style={{ fontSize: 12, color: amber }}>
                  No brand here has a valid email yet. Add contacts in the <a href="/admin/deals" style={{ color: orange, fontWeight: 700 }}>Deal Desk</a>.
                </span>
              )}
              {exp.stats.missingEmail > 0 && exp.included > 0 && (
                <span style={{ fontSize: 12, color: muted }}>{exp.stats.missingEmail} more have no email.</span>
              )}
            </div>
          )}
        </div>

        {err && <p style={{ color: "#DC2626", fontSize: 13 }}>{err}</p>}
        {!data && !err && <p style={{ color: muted, fontSize: 14 }}>Loading…</p>}

        {data && def.coldEmail && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <label style={{ fontSize: 12, color: muted, fontWeight: 600 }}>Preview as</label>
              <select value={sampleId || data.sample?.id || ""} onChange={(e) => setSampleId(e.target.value)}
                style={{ fontSize: 13, border: `1px solid ${border}`, borderRadius: 8, padding: "6px 8px", background: "#fff" }}>
                {!data.sample && <option value="">Example brand</option>}
                {mine.map((p) => <option key={p.id} value={p.id}>{p.brandName}</option>)}
              </select>
            </div>

            {data.steps.length === 0 && (
              <p style={{ fontSize: 13, color: amber }}>No active templates for this segment. Add them in <a href="/admin/deals/templates" style={{ color: orange }}>templates</a>.</p>
            )}

            {data.steps.map((s) => (
              <div key={s.key} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "baseline" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: orange }}>STEP {s.step}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: navy }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: muted }}>
                    {s.waitDays === 0 && s.step === 1 ? "Day 0" : `Waits ${s.waitDays} days after the previous step (day ${s.dayOverall})`}
                  </span>
                </div>
                <p style={{ fontSize: 13, margin: 0 }}><b>Subject:</b> {s.subject}</p>
                <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#F9FAFB", border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px" }}>{s.body}</pre>
              </div>
            ))}

            {data.instantlyCopy && (
              <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: navy }}>Copy for Instantly</span>
                  <button onClick={copy} style={btn(false)}>{copied ? "Copied" : "Copy all steps"}</button>
                </div>
                <p style={{ fontSize: 12, color: muted, margin: 0 }}>
                  Merge fields are already converted to Instantly&apos;s variables, and the address and opt-out footer are included.
                </p>
                <textarea ref={copyRef} readOnly value={data.instantlyCopy} rows={12}
                  style={{ width: "100%", boxSizing: "border-box", fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12, border: `1px solid ${border}`, borderRadius: 8, padding: 10, background: "#F9FAFB" }} />
              </div>
            )}
          </>
        )}

        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, overflow: "hidden" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: navy, margin: 0, padding: "12px 14px", borderBottom: `1px solid ${border}` }}>
            Brands in {def.label} ({mine.length})
          </p>
          {mine.length === 0 ? (
            <p style={{ padding: 16, fontSize: 13, color: muted, margin: 0 }}>No brands in this mode yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Brand", "Contact", "Email", "Opening", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mine.map((p) => {
                    const ok = isValidEmail(p.contactEmail ?? "");
                    const open = p.openingLine?.trim() ? "Own line" : p.tradeShow?.trim() ? "Show hook" : "None";
                    const ready = readyToSend(p);
                    return (
                      <tr key={p.id} style={{ borderTop: `1px solid ${border}` }}>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: navy }}>{p.brandName}</td>
                        <td style={{ padding: "8px 12px", color: muted }}>{p.contactName || "—"}</td>
                        <td style={{ padding: "8px 12px", color: ok ? green : amber, fontWeight: 600 }}>{ok ? "Valid" : p.contactEmail ? "Check" : "Missing"}</td>
                        <td style={{ padding: "8px 12px", color: open === "None" ? amber : muted }}>{open}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: ready ? green : muted }}>
                          {ready ? "Ready" : p.stage !== "sourced" && p.stage !== "researched" ? "In progress" : "Not ready"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
