"use client";
import { useState, useEffect, useCallback } from "react";
import AdminShell from "../AdminShell";
import { PHASE_LABEL, PHASE_ORDER, NOT_NOW } from "@/lib/deals/roadmap";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";
const red = "#B91C1C";

interface Item {
  id: string; phase: string; order: number;
  title: string; detail: string; done: boolean; doneAt: string | null;
}

function useToken() {
  const [t, setT] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("vc_admin_session");
      if (s) {
        const ts = parseInt(s.split(":")[0], 10);
        if (!isNaN(ts) && Date.now() - ts <= 12 * 60 * 60 * 1000) { setT(s); return; }
      }
    } catch { /* */ }
    setT(null);
  }, []);
  return t;
}

export default function RoadmapPage() {
  const token = useToken();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTo, setAddTo] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await fetch("/api/admin/roadmap", { headers: { "x-admin-token": token } });
    setItems(await r.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const patch = useCallback(async (id: string, body: Partial<Item>) => {
    if (!token) return;
    setItems((xs) => xs.map((x) => x.id === id ? { ...x, ...body } : x)); // optimistic
    const r = await fetch(`/api/admin/roadmap/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(body),
    });
    if (r.ok) { const u = await r.json(); setItems((xs) => xs.map((x) => x.id === id ? u : x)); }
  }, [token]);

  const remove = useCallback(async (id: string) => {
    if (!token || !confirm("Remove this item?")) return;
    await fetch(`/api/admin/roadmap/${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, [token]);

  const add = useCallback(async (phase: string) => {
    if (!token || !draft.trim()) return;
    const r = await fetch("/api/admin/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ phase, title: draft.trim() }),
    });
    if (r.ok) { const created = await r.json(); setItems((xs) => [...xs, created]); setDraft(""); setAddTo(null); }
  }, [token, draft]);

  if (token === undefined || (loading && token)) return <Centered>Loading…</Centered>;
  if (token === null) return <Centered><a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a></Centered>;

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;

  return (
    <AdminShell
      title="Roadmap"
      actions={<span style={{ fontSize: 12, color: muted }}>{doneCount}/{total} done</span>}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
        <div style={{ background: navy, borderRadius: 12, padding: "16px 18px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "#CBD5E1", margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: "#fff" }}>The strategy:</strong> position as the non-Amazon channel team —
            Spreetail-lite services model (brand keeps title, rev-share on incremental revenue) plus the
            excess-inventory wedge. Solo for now; Amazon 3P on hold. The build serves the business —
            don&apos;t build ahead of having brands.
          </p>
        </div>

        {PHASE_ORDER.map((phase) => {
          const rows = items.filter((i) => i.phase === phase).sort((a, b) => a.order - b.order);
          const pd = rows.filter((r) => r.done).length;
          return (
            <div key={phase} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: navy, margin: 0 }}>{PHASE_LABEL[phase] ?? phase}</h2>
                <span style={{ fontSize: 11, color: muted }}>{pd}/{rows.length}</span>
              </div>
              <div style={{ height: 4, background: "#E5E7EB", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: rows.length ? `${(pd / rows.length) * 100}%` : "0%", height: "100%", background: green }} />
              </div>

              {rows.map((it) => (
                <div key={it.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}` }}>
                  <button onClick={() => patch(it.id, { done: !it.done })}
                    style={{
                      flexShrink: 0, width: 18, height: 18, marginTop: 1, borderRadius: 5, cursor: "pointer",
                      border: `1.5px solid ${it.done ? green : "#CBD5E1"}`,
                      background: it.done ? green : "#fff", color: "#fff", fontSize: 12, lineHeight: "15px",
                    }}>
                    {it.done ? "✓" : ""}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: it.done ? muted : navy,
                      textDecoration: it.done ? "line-through" : "none" }}>
                      {it.title}
                    </p>
                    {it.detail && (
                      <p style={{ fontSize: 12, color: muted, margin: "3px 0 0", lineHeight: 1.6 }}>{it.detail}</p>
                    )}
                  </div>
                  <button onClick={() => remove(it.id)}
                    style={{ flexShrink: 0, background: "none", border: "none", color: "#CBD5E1", cursor: "pointer", fontSize: 14, alignSelf: "flex-start" }}
                    title="Remove">×</button>
                </div>
              ))}

              {addTo === phase ? (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
                    placeholder="New item…" onKeyDown={(e) => { if (e.key === "Enter") add(phase); if (e.key === "Escape") { setAddTo(null); setDraft(""); } }}
                    style={{ flex: 1, padding: "7px 10px", fontSize: 13, border: `1px solid ${border}`, borderRadius: 6, fontFamily: "inherit" }} />
                  <button onClick={() => add(phase)} style={{ background: navy, color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add</button>
                </div>
              ) : (
                <button onClick={() => { setAddTo(phase); setDraft(""); }}
                  style={{ marginTop: 10, background: "none", border: "none", color: orange, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  + Add item
                </button>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 8, padding: "16px 18px", background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: red, margin: "0 0 8px" }}>
            Not now
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: muted, fontSize: 13, lineHeight: 1.8 }}>
            {NOT_NOW.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontFamily: "system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
