"use client";
import { useState, useEffect, useCallback } from "react";

const navy   = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted  = "#6B7280";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
  status: string;
  notes: string;
  createdAt: string;
};

const STATUS_OPTIONS = ["new", "contacted", "qualified", "proposal", "closed-won", "closed-lost"];

const STATUS_COLORS: Record<string, string> = {
  "new":          "#DBEAFE",
  "contacted":    "#FEF9C3",
  "qualified":    "#DCFCE7",
  "proposal":     "#EDE9FE",
  "closed-won":   "#D1FAE5",
  "closed-lost":  "#FEE2E2",
};

const STATUS_TEXT: Record<string, string> = {
  "new":          "#1D4ED8",
  "contacted":    "#A16207",
  "qualified":    "#15803D",
  "proposal":     "#7C3AED",
  "closed-won":   "#065F46",
  "closed-lost":  "#991B1B",
};

function Badge({ status }: { status: string }) {
  return (
    <span style={{
      background: STATUS_COLORS[status] ?? "#F3F4F6",
      color: STATUS_TEXT[status] ?? "#374151",
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, textTransform: "capitalize",
    }}>
      {status.replace("-", " ")}
    </span>
  );
}

export default function AdminPage() {
  const [token, setToken]       = useState("");
  const [authed, setAuthed]     = useState(false);
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);

  const fetchLeads = useCallback(async (t: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/leads", { headers: { "x-admin-token": t } });
      if (r.status === 401) { setError("Invalid token."); return; }
      const data = await r.json();
      setLeads(data);
      setAuthed(true);
    } catch {
      setError("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  function login(e: React.FormEvent) {
    e.preventDefault();
    fetchLeads(token);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ status }),
    });
    setLeads(ls => ls.map(l => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s);
  }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/admin/leads/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ notes }),
    });
    setLeads(ls => ls.map(l => l.id === selected.id ? { ...l, notes } : l));
    setSelected(s => s ? { ...s, notes } : s);
    setSaving(false);
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
    setLeads(ls => ls.filter(l => l.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  // stats
  const stats = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#F9FAFB" }}>
        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 14,
          padding: "40px 36px", width: 360 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 28 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: navy }}>Vertex</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: orange }}>Channels</span>
            <span style={{ fontSize: 13, color: muted, marginLeft: 6 }}>Admin</span>
          </div>
          <form onSubmit={login}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Admin token
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Enter your admin token"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14,
                border: `1px solid ${border}`, borderRadius: 8, marginBottom: 16,
                boxSizing: "border-box", fontFamily: "inherit" }}
              required
            />
            {error && <p style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" style={{ width: "100%", background: navy, color: "#fff",
              border: "none", padding: "11px", fontSize: 14, fontWeight: 700,
              borderRadius: 8, cursor: "pointer" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: navy, padding: "0 28px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <a href="/" style={{ display: "flex", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Vertex</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: orange }}>Channels</span>
          </a>
          <span style={{ color: "#475569", fontSize: 13, marginLeft: 8 }}>/ Leads</span>
        </div>
        <button onClick={() => fetchLeads(token)}
          style={{ background: "none", border: `1px solid #334155`, color: "#94A3B8",
            padding: "5px 14px", fontSize: 13, borderRadius: 6, cursor: "pointer" }}>
          Refresh
        </button>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
          gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total", value: leads.length, bg: "#fff" },
            { label: "New", value: stats.new, bg: STATUS_COLORS.new },
            { label: "Contacted", value: stats.contacted, bg: STATUS_COLORS.contacted },
            { label: "Qualified", value: stats.qualified, bg: STATUS_COLORS.qualified },
            { label: "Proposal", value: stats.proposal, bg: STATUS_COLORS.proposal },
            { label: "Won", value: stats["closed-won"], bg: STATUS_COLORS["closed-won"] },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${border}`,
              borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: navy }}>{s.value}</p>
              <p style={{ fontSize: 12, color: muted, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr",
          gap: 20, alignItems: "start" }}>

          {/* Leads list */}
          <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
            {/* Filter bar */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`,
              display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, marginRight: 4 }}>Filter:</span>
              {["all", ...STATUS_OPTIONS].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  style={{ background: filter === s ? navy : "#F3F4F6",
                    color: filter === s ? "#fff" : muted,
                    border: "none", padding: "5px 12px", fontSize: 12, fontWeight: 600,
                    borderRadius: 20, cursor: "pointer", textTransform: "capitalize" }}>
                  {s === "all" ? `All (${leads.length})` : `${s.replace("-", " ")} (${stats[s] ?? 0})`}
                </button>
              ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: muted, fontSize: 14 }}>
                No leads yet.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${border}` }}>
                      {["Name", "Company", "Service", "Status", "Date", ""].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left",
                          fontWeight: 600, color: muted, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(lead => (
                      <tr key={lead.id}
                        onClick={() => { setSelected(lead); setNotes(lead.notes); }}
                        style={{ borderBottom: `1px solid ${border}`, cursor: "pointer",
                          background: selected?.id === lead.id ? "#F0F9FF" : "#fff" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: navy }}>
                          <div>{lead.name}</div>
                          <div style={{ fontSize: 11, color: muted, fontWeight: 400 }}>{lead.email}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: muted }}>{lead.company || "—"}</td>
                        <td style={{ padding: "10px 14px", color: muted, maxWidth: 160,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lead.service || "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <Badge status={lead.status} />
                        </td>
                        <td style={{ padding: "10px 14px", color: muted, whiteSpace: "nowrap" }}>
                          {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={e => { e.stopPropagation(); deleteLead(lead.id); }}
                            style={{ background: "none", border: "none", color: "#EF4444",
                              cursor: "pointer", fontSize: 13, padding: "2px 6px" }}>
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: "#fff", border: `1px solid ${border}`,
              borderRadius: 12, padding: 20, position: "sticky", top: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px", color: navy }}>
                    {selected.name}
                  </p>
                  <a href={`mailto:${selected.email}`}
                    style={{ fontSize: 13, color: orange }}>{selected.email}</a>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    color: muted, fontSize: 18, lineHeight: 1 }}>×</button>
              </div>

              {/* Info rows */}
              {[
                { label: "Company", value: selected.company || "—" },
                { label: "Service interest", value: selected.service || "—" },
                { label: "Submitted", value: new Date(selected.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.05em", color: muted }}>{row.label}</span>
                  <p style={{ fontSize: 13, margin: "2px 0 0", color: navy }}>{row.value}</p>
                </div>
              ))}

              {/* Message */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.05em", color: muted }}>Message</span>
                <p style={{ fontSize: 13, margin: "4px 0 0", color: navy,
                  background: "#F9FAFB", border: `1px solid ${border}`,
                  borderRadius: 8, padding: "10px 12px", lineHeight: 1.6 }}>
                  {selected.message}
                </p>
              </div>

              {/* Status picker */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.05em", color: muted, display: "block", marginBottom: 6 }}>
                  Status
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      style={{ background: selected.status === s ? STATUS_COLORS[s] : "#F3F4F6",
                        color: selected.status === s ? STATUS_TEXT[s] : muted,
                        border: selected.status === s ? `1px solid ${STATUS_TEXT[s]}44` : `1px solid ${border}`,
                        padding: "4px 10px", fontSize: 11, fontWeight: 700,
                        borderRadius: 20, cursor: "pointer", textTransform: "capitalize" }}>
                      {s.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.05em", color: muted, display: "block", marginBottom: 6 }}>
                  Internal notes
                </span>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes…"
                  style={{ width: "100%", padding: "10px 12px", fontSize: 13,
                    border: `1px solid ${border}`, borderRadius: 8, resize: "vertical",
                    fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveNotes} disabled={saving}
                  style={{ flex: 1, background: navy, color: "#fff", border: "none",
                    padding: "10px", fontSize: 13, fontWeight: 700,
                    borderRadius: 8, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : "Save notes"}
                </button>
                <a href={`mailto:${selected.email}?subject=Re: your inquiry`}
                  style={{ padding: "10px 14px", background: "#FFF7ED", color: orange,
                    border: `1px solid #FED7AA`, borderRadius: 8, fontSize: 13,
                    fontWeight: 700, textDecoration: "none" }}>
                  Email
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
