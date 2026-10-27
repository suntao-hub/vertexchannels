"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import AdminShell from "../AdminShell";
import { readSession } from "@/lib/admin/session";
import { MILESTONES, ASSUMED_FEE, mondayOf, usd } from "@/lib/numbers";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";

interface Client {
  id: string; name: string; business: string; monthlyFee: number; status: string; startedAt: string | null; notes: string;
}
interface Week {
  id: string; weekStart: string; sends: number; replies: number; positives: number; reads: number;
  calls: number; newClients: number; spend: number; notes: string;
}
interface Data {
  clients: Client[]; weeks: Week[];
  pipeline: { prospects: Record<string, number>; leads: Record<string, number>; newLeads7d: number };
}

const BUSINESS: Record<string, string> = { channels: "Vertex Channels", launch: "VertexLaunch" };
const STATUS_TONE: Record<string, string> = { active: green, paused: "#A16207", ended: muted };

const localYmd = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%` : "—");
const prettyWeek = (s: string) =>
  new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const EMPTY_WEEK = { sends: "", replies: "", positives: "", reads: "", calls: "", newClients: "", spend: "" };
type WeekField = keyof typeof EMPTY_WEEK;
const WEEK_FIELDS: [WeekField, string][] = [
  ["sends", "Sends"], ["replies", "Replies"], ["positives", "Positive"], ["reads", "Reads sent"],
  ["calls", "Calls"], ["newClients", "New clients"], ["spend", "Spend $"],
];

export default function NumbersPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [data, setData] = useState<Data | null>(null);
  const [newClient, setNewClient] = useState({ name: "", business: "channels", monthlyFee: "" });
  const [weekStart, setWeekStart] = useState(() => mondayOf(localYmd(new Date())));
  const [week, setWeek] = useState<Record<WeekField, string>>(EMPTY_WEEK);

  useEffect(() => { setToken(readSession()); }, []);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await fetch("/api/admin/numbers", { headers: { "x-admin-token": token } });
    if (r.ok) setData(await r.json());
  }, [token]);
  useEffect(() => { if (token) load(); }, [token, load]);

  // Selecting a week that is already logged loads its numbers so it can be edited.
  useEffect(() => {
    const existing = data?.weeks.find((w) => w.weekStart === mondayOf(weekStart));
    setWeek(existing
      ? Object.fromEntries(WEEK_FIELDS.map(([k]) => [k, String(existing[k])])) as Record<WeekField, string>
      : EMPTY_WEEK);
  }, [weekStart, data]);

  const call = useCallback(async (path: string, method: string, body?: unknown) => {
    if (!token) return null;
    const r = await fetch(path, {
      method, headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: body ? JSON.stringify(body) : undefined,
    });
    return r.ok ? r.json() : null;
  }, [token]);

  const patchClient = useCallback(async (id: string, body: Record<string, unknown>) => {
    const u = await call(`/api/admin/numbers/${id}`, "PATCH", body);
    if (u) setData((d) => d && { ...d, clients: d.clients.map((c) => (c.id === id ? u : c)) });
  }, [call]);

  const m = useMemo(() => {
    const clients = data?.clients ?? [];
    const active = clients.filter((c) => c.status === "active");
    const mrr = active.reduce((s, c) => s + c.monthlyFee, 0);
    const paying = active.filter((c) => c.monthlyFee > 0);
    const avgFee = paying.length ? mrr / paying.length : ASSUMED_FEE;
    const idx = MILESTONES.findIndex((x) => mrr < x.mrr);
    const next = idx === -1 ? null : MILESTONES[idx];
    const prev = idx > 0 ? MILESTONES[idx - 1].mrr : 0;
    const t = (data?.weeks ?? []).reduce(
      (a, w) => ({
        sends: a.sends + w.sends, replies: a.replies + w.replies, positives: a.positives + w.positives,
        reads: a.reads + w.reads, calls: a.calls + w.calls, newClients: a.newClients + w.newClients, spend: a.spend + w.spend,
      }),
      { sends: 0, replies: 0, positives: 0, reads: 0, calls: 0, newClients: 0, spend: 0 },
    );
    return {
      mrr, avgFee, assumed: paying.length === 0, next, t,
      byBiz: { channels: active.filter((c) => c.business === "channels").reduce((s, c) => s + c.monthlyFee, 0),
               launch: active.filter((c) => c.business === "launch").reduce((s, c) => s + c.monthlyFee, 0) },
      progress: next ? Math.max(0, Math.min(100, ((mrr - prev) / (next.mrr - prev)) * 100)) : 100,
      need: next ? Math.ceil((next.mrr - mrr) / avgFee) : 0,
    };
  }, [data]);

  if (token === null) {
    return (
      <AdminShell title="Numbers">
        <div style={{ padding: 36, textAlign: "center" }}>
          <a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a>
        </div>
      </AdminShell>
    );
  }

  const field: React.CSSProperties = { fontSize: 13, border: `1px solid ${border}`, borderRadius: 8, padding: "7px 9px", fontFamily: "inherit", background: "#fff", color: navy };
  const card: React.CSSProperties = { background: "#fff", border: `1px solid ${border}`, borderRadius: 10 };
  const th: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontWeight: 600, color: muted, fontSize: 12, whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "8px 12px", fontSize: 13, color: navy, whiteSpace: "nowrap" };
  const cell: React.CSSProperties = { ...field, padding: "4px 7px", border: "1px solid transparent", background: "transparent" };

  async function addClient() {
    if (!newClient.name.trim()) return;
    const c = await call("/api/admin/numbers", "POST", { kind: "client", ...newClient });
    if (c) { setData((d) => d && { ...d, clients: [...d.clients, c] }); setNewClient({ name: "", business: newClient.business, monthlyFee: "" }); }
  }

  async function removeClient(c: Client) {
    if (!confirm(`Delete ${c.name}?`)) return;
    await call(`/api/admin/numbers/${c.id}`, "DELETE");
    setData((d) => d && { ...d, clients: d.clients.filter((x) => x.id !== c.id) });
  }

  async function saveWeek() {
    const w = await call("/api/admin/numbers", "POST", { kind: "week", weekStart, ...week });
    if (w) load();
  }

  async function removeWeek(w: Week) {
    if (!confirm(`Delete the week of ${prettyWeek(w.weekStart)}?`)) return;
    await call(`/api/admin/numbers/${w.id}?kind=week`, "DELETE");
    load();
  }

  const t = m.t;
  const pipeline = data?.pipeline;

  return (
    <AdminShell title="Numbers">
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
        {!data && <p style={{ color: muted, fontSize: 14 }}>Loading…</p>}

        {data && (
          <>
            {/* Revenue and milestones */}
            <div style={{ ...card, borderLeft: `6px solid ${orange}`, padding: "16px 20px", display: "grid", gap: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 28px", alignItems: "baseline" }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: navy }}>{usd(m.mrr)}<span style={{ fontSize: 14, color: muted, fontWeight: 600 }}> / month</span></span>
                <span style={{ fontSize: 14, color: muted }}>{usd(m.mrr * 12)} annual run rate</span>
                <span style={{ fontSize: 13, color: muted }}>
                  Vertex Channels {usd(m.byBiz.channels)} · VertexLaunch {usd(m.byBiz.launch)}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MILESTONES.map((x) => {
                  const hit = m.mrr >= x.mrr;
                  const isNext = m.next?.mrr === x.mrr;
                  return (
                    <span key={x.mrr} style={{
                      fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999,
                      background: hit ? "#DCFCE7" : isNext ? "#FFEDD5" : "#F3F4F6",
                      color: hit ? green : isNext ? "#C2410C" : muted,
                      border: `1px solid ${hit ? "#BBF7D0" : isNext ? "#FED7AA" : border}`,
                    }}>
                      {hit ? "✓ " : ""}{x.label}
                    </span>
                  );
                })}
              </div>

              <div style={{ height: 10, background: "#E5E7EB", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${m.progress}%`, height: "100%", background: m.next ? orange : green }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: muted, lineHeight: 1.6 }}>
                {m.next
                  ? <>Next milestone <b style={{ color: navy }}>{m.next.label}</b> ({usd(m.next.mrr)}/month): <b style={{ color: navy }}>{usd(m.next.mrr - m.mrr)}</b> to go, about <b style={{ color: navy }}>{m.need} more client{m.need === 1 ? "" : "s"}</b> at {m.assumed ? `an assumed ${usd(ASSUMED_FEE)}` : `your average ${usd(m.avgFee)}`} a month.</>
                  : <>Every milestone reached.</>}
              </p>
            </div>

            {/* Clients */}
            <div style={{ ...card, overflow: "hidden" }}>
              <p style={{ margin: 0, padding: "12px 14px", fontSize: 13, fontWeight: 800, color: navy }}>Clients</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                      {["Client", "Business", "Monthly fee", "Status", ""].map((h) => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients.map((c) => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${border}`, opacity: c.status === "ended" ? 0.55 : 1 }}>
                        <td style={td}>
                          <input key={`${c.id}-${c.name}`} defaultValue={c.name} style={{ ...cell, fontWeight: 700, width: 200 }}
                            onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.name) patchClient(c.id, { name: v }); }} />
                        </td>
                        <td style={td}>
                          <select value={c.business} onChange={(e) => patchClient(c.id, { business: e.target.value })} style={cell}>
                            {Object.entries(BUSINESS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </td>
                        <td style={td}>
                          $<input key={`${c.id}-${c.monthlyFee}`} type="number" min={0} defaultValue={c.monthlyFee} style={{ ...cell, width: 90 }}
                            onBlur={(e) => { const v = Math.max(0, Math.round(Number(e.target.value) || 0)); if (v !== c.monthlyFee) patchClient(c.id, { monthlyFee: v }); }} />
                        </td>
                        <td style={td}>
                          <select value={c.status} onChange={(e) => patchClient(c.id, { status: e.target.value })}
                            style={{ ...cell, color: STATUS_TONE[c.status], fontWeight: 700 }}>
                            {["active", "paused", "ended"].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={td}>
                          <button onClick={() => removeClient(c)} aria-label={`Delete ${c.name}`}
                            style={{ background: "none", border: "none", color: muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.clients.length === 0 && (
                <p style={{ margin: 0, padding: "14px", fontSize: 13, color: muted }}>
                  No clients yet. Add each paying client with its monthly fee. MRR counts active clients only.
                </p>
              )}
              <div style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 8, borderTop: `1px solid ${border}` }}>
                <input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") addClient(); }} placeholder="Client name" style={{ ...field, flex: "1 1 200px" }} />
                <select value={newClient.business} onChange={(e) => setNewClient({ ...newClient, business: e.target.value })} style={field}>
                  {Object.entries(BUSINESS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input type="number" min={0} value={newClient.monthlyFee} onChange={(e) => setNewClient({ ...newClient, monthlyFee: e.target.value })}
                  placeholder="Monthly fee $" style={{ ...field, width: 130 }} />
                <button onClick={addClient} style={{ background: orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add client</button>
              </div>
            </div>

            {/* Weekly funnel */}
            <div style={{ ...card, overflow: "hidden" }}>
              <p style={{ margin: 0, padding: "12px 14px 4px", fontSize: 13, fontWeight: 800, color: navy }}>Weekly funnel</p>
              <p style={{ margin: 0, padding: "0 14px 10px", fontSize: 12, color: muted }}>
                Enter Friday's numbers from Instantly and the Deal Desk. Spend is tools, data and any ads for the week.
              </p>

              <div style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "end", borderTop: `1px solid ${border}`, background: "#F9FAFB" }}>
                <label style={{ fontSize: 11, color: muted, display: "grid", gap: 3 }}>
                  Week of
                  <input type="date" value={weekStart} onChange={(e) => e.target.value && setWeekStart(e.target.value)} style={field} />
                </label>
                {WEEK_FIELDS.map(([k, label]) => (
                  <label key={k} style={{ fontSize: 11, color: muted, display: "grid", gap: 3 }}>
                    {label}
                    <input type="number" min={0} value={week[k]} onChange={(e) => setWeek({ ...week, [k]: e.target.value })}
                      style={{ ...field, width: 86 }} />
                  </label>
                ))}
                <button onClick={saveWeek} style={{ background: orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {data.weeks.some((w) => w.weekStart === mondayOf(weekStart)) ? "Update week" : "Save week"}
                </button>
              </div>

              {data.weeks.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                        {["Week of", "Sends", "Replies", "Reply %", "Positive", "Reads", "Calls", "New clients", "Spend", ""].map((h) => <th key={h} style={th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.weeks.map((w) => (
                        <tr key={w.id} onClick={() => setWeekStart(w.weekStart)} style={{ borderBottom: `1px solid ${border}`, cursor: "pointer" }}>
                          <td style={{ ...td, fontWeight: 700 }}>{prettyWeek(w.weekStart)}</td>
                          <td style={td}>{w.sends}</td>
                          <td style={td}>{w.replies}</td>
                          <td style={{ ...td, color: muted }}>{pct(w.replies, w.sends)}</td>
                          <td style={td}>{w.positives}</td>
                          <td style={td}>{w.reads}</td>
                          <td style={td}>{w.calls}</td>
                          <td style={td}>{w.newClients}</td>
                          <td style={td}>{usd(w.spend)}</td>
                          <td style={td}>
                            <button onClick={(e) => { e.stopPropagation(); removeWeek(w); }} aria-label="Delete week"
                              style={{ background: "none", border: "none", color: muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "#F9FAFB", fontWeight: 800 }}>
                        <td style={td}>Total</td>
                        <td style={td}>{t.sends}</td>
                        <td style={td}>{t.replies}</td>
                        <td style={td}>{pct(t.replies, t.sends)}</td>
                        <td style={td}>{t.positives}</td>
                        <td style={td}>{t.reads}</td>
                        <td style={td}>{t.calls}</td>
                        <td style={td}>{t.newClients}</td>
                        <td style={td}>{usd(t.spend)}</td>
                        <td style={td} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ padding: "12px 14px", borderTop: `1px solid ${border}`, display: "flex", flexWrap: "wrap", gap: "6px 28px", fontSize: 13, color: muted }}>
                <span>Positive replies: <b style={{ color: navy }}>{pct(t.positives, t.sends)}</b> of sends</span>
                <span>Sends per client: <b style={{ color: navy }}>{t.newClients > 0 ? Math.round(t.sends / t.newClients).toLocaleString("en-US") : "—"}</b></span>
                <span>Cost per client: <b style={{ color: navy }}>{t.newClients > 0 ? usd(t.spend / t.newClients) : "—"}</b></span>
              </div>
            </div>

            {/* Pipeline snapshot */}
            {pipeline && (
              <div style={{ ...card, padding: "12px 14px", display: "grid", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: navy }}>Pipeline now</p>
                <p style={{ margin: 0, fontSize: 13, color: muted, lineHeight: 1.7 }}>
                  Deal Desk brands: {Object.keys(pipeline.prospects).length === 0 ? "none" :
                    Object.entries(pipeline.prospects).map(([s, n]) => `${s} ${n}`).join(" · ")}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: muted, lineHeight: 1.7 }}>
                  Site leads: {Object.keys(pipeline.leads).length === 0 ? "none" :
                    Object.entries(pipeline.leads).map(([s, n]) => `${s} ${n}`).join(" · ")}
                  {" "}· {pipeline.newLeads7d} new in the last 7 days
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
