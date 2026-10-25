"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import AdminShell from "../AdminShell";
import { readSession } from "@/lib/admin/session";
import { AREAS, FIRST_SEND } from "@/lib/tasks";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";
const red = "#B91C1C";

interface Task {
  id: string; key: string | null; title: string; detail: string; area: string;
  dueDate: string | null; status: string; blocker: boolean; doneAt: string | null;
}

const ymd = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const todayYmd = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) =>
  Math.round((Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) - Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10))) / 86400000);
const pretty = (s: string) =>
  new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function TasksPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState("all");
  const [blockersOnly, setBlockersOnly] = useState(false);
  const [draft, setDraft] = useState({ title: "", area: "outreach", dueDate: "", blocker: false });
  const [note, setNote] = useState("");

  useEffect(() => { setToken(readSession()); }, []);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await fetch("/api/admin/tasks", { headers: { "x-admin-token": token } });
    if (r.ok) setTasks(await r.json());
    setLoading(false);
  }, [token]);
  useEffect(() => { if (token) load(); }, [token, load]);

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    if (!token) return;
    const r = await fetch(`/api/admin/tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(body),
    });
    if (r.ok) { const u = await r.json(); setTasks((ts) => ts.map((t) => (t.id === id ? u : t))); }
  }, [token]);

  const remove = useCallback(async (t: Task) => {
    if (!token || !confirm(`Delete "${t.title}"?`)) return;
    await fetch(`/api/admin/tasks/${t.id}`, { method: "DELETE", headers: { "x-admin-token": token } });
    setTasks((ts) => ts.filter((x) => x.id !== t.id));
  }, [token]);

  async function add() {
    if (!token || !draft.title.trim()) return;
    const r = await fetch("/api/admin/tasks", {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(draft),
    });
    if (r.ok) {
      const t = await r.json();
      setTasks((ts) => [...ts, t].sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9")));
      setDraft({ title: "", area: draft.area, dueDate: "", blocker: false });
    }
  }

  async function restore() {
    if (!token || !confirm("Add any plan tasks that are missing? Tasks you deleted will come back.")) return;
    const r = await fetch("/api/admin/tasks", {
      method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ restorePlan: true }),
    });
    const j = await r.json();
    setNote(`${j.added} plan task${j.added === 1 ? "" : "s"} added.`);
    load();
  }

  const today = todayYmd();
  const open = tasks.filter((t) => t.status !== "done");
  const blockersLeft = open.filter((t) => t.blocker).length;
  const blockersTotal = tasks.filter((t) => t.blocker).length;
  const daysToSend = daysBetween(FIRST_SEND, today);
  const pct = tasks.length ? Math.round(((tasks.length - open.length) / tasks.length) * 100) : 0;

  const visible = useMemo(
    () => tasks.filter((t) => (area === "all" || t.area === area) && (!blockersOnly || t.blocker)),
    [tasks, area, blockersOnly],
  );

  const groups = useMemo(() => {
    const g: { title: string; items: Task[]; tone?: string }[] = [
      { title: "Overdue", items: [], tone: red },
      { title: "This week", items: [] },
      { title: "Next two weeks", items: [] },
      { title: "Later", items: [] },
      { title: "No date", items: [] },
    ];
    for (const t of visible.filter((x) => x.status !== "done")) {
      const d = ymd(t.dueDate);
      if (!d) g[4].items.push(t);
      else {
        const n = daysBetween(d, today);
        (n < 0 ? g[0] : n <= 7 ? g[1] : n <= 21 ? g[2] : g[3]).items.push(t);
      }
    }
    return g.filter((x) => x.items.length > 0);
  }, [visible, today]);

  const done = visible.filter((t) => t.status === "done");

  if (token === null) {
    return (
      <AdminShell title="Tasks">
        <div style={{ padding: 36, textAlign: "center" }}>
          <a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a>
        </div>
      </AdminShell>
    );
  }

  const row = (t: Task) => {
    const d = ymd(t.dueDate);
    const n = d ? daysBetween(d, today) : null;
    const isDone = t.status === "done";
    const a = AREAS[t.area] ?? AREAS.admin;
    return (
      <div key={t.id} style={{ display: "grid", gridTemplateColumns: "26px 1fr auto", gap: 12, padding: "11px 14px", borderTop: `1px solid ${border}`, alignItems: "start", opacity: isDone ? 0.6 : 1 }}>
        <button onClick={() => patch(t.id, { status: isDone ? "todo" : "done" })} aria-label={isDone ? "Mark not done" : "Mark done"}
          style={{ width: 20, height: 20, marginTop: 2, borderRadius: 5, border: `2px solid ${isDone ? green : muted}`, background: isDone ? green : "#fff", color: "#fff", fontSize: 12, lineHeight: 1, cursor: "pointer", padding: 0 }}>
          {isDone ? "✓" : ""}
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <input key={`${t.id}-${t.title}`} defaultValue={t.title}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== t.title) patch(t.id, { title: v }); }}
              style={{ fontSize: 14, fontWeight: 700, color: navy, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", textDecoration: isDone ? "line-through" : "none", flex: "1 1 260px", minWidth: 0, padding: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: a.bg, color: a.fg }}>{a.label}</span>
            {t.blocker && !isDone && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#FEE2E2", color: red }}>Blocks Nov 10</span>}
          </div>
          {t.detail && <p style={{ fontSize: 12.5, color: muted, lineHeight: 1.55, margin: "4px 0 0", maxWidth: 720 }}>{t.detail}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <input type="date" key={`${t.id}-${d}`} defaultValue={d}
              onBlur={(e) => { if (e.target.value !== d) patch(t.id, { dueDate: e.target.value || null }); }}
              style={{ fontSize: 12, border: `1px solid ${border}`, borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", color: navy }} />
            {n != null && !isDone && (
              <div style={{ fontSize: 11, marginTop: 2, color: n < 0 ? red : n === 0 ? orange : muted, fontWeight: n <= 0 ? 700 : 400 }}>
                {n < 0 ? `${-n}d overdue` : n === 0 ? "Due today" : `in ${n}d`}
              </div>
            )}
          </div>
          <button onClick={() => remove(t)} aria-label="Delete task" style={{ background: "none", border: "none", color: muted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      </div>
    );
  };

  const field: React.CSSProperties = { fontSize: 13, border: `1px solid ${border}`, borderRadius: 8, padding: "7px 9px", fontFamily: "inherit", background: "#fff" };

  return (
    <AdminShell title="Tasks">
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
        {!loading && <div style={{ background: "#fff", border: `1px solid ${border}`, borderLeft: `6px solid ${blockersLeft === 0 ? green : orange}`, borderRadius: 10, padding: "14px 18px", display: "grid", gap: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px", alignItems: "baseline" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: navy }}>
              {daysToSend > 0 ? `${daysToSend} days to the first send (Nov 10)` : daysToSend === 0 ? "First send is today" : "First send date has passed"}
            </span>
            <span style={{ fontSize: 14, color: blockersLeft === 0 ? green : red, fontWeight: 700 }}>
              {blockersLeft === 0 ? "All send blockers done" : `${blockersLeft} of ${blockersTotal} blockers left`}
            </span>
          </div>
          <div style={{ height: 8, background: "#E5E7EB", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: orange }} />
          </div>
          <p style={{ fontSize: 12, color: muted, margin: 0 }}>{tasks.length - open.length} of {tasks.length} tasks done. The plan comes from the Playbook timeline.</p>
        </div>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {[["all", "All"], ...Object.entries(AREAS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button key={k} onClick={() => setArea(k)}
              style={{ background: area === k ? navy : "#fff", color: area === k ? "#fff" : navy, border: `1px solid ${area === k ? navy : border}`, borderRadius: 16, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {label}
            </button>
          ))}
          <label style={{ marginLeft: "auto", fontSize: 12, color: muted, display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={blockersOnly} onChange={(e) => setBlockersOnly(e.target.checked)} /> Blockers only
          </label>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Add a task" style={{ ...field, flex: "1 1 240px" }} />
          <select value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} style={field}>
            {Object.entries(AREAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} style={field} />
          <label style={{ fontSize: 12, color: muted, display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={draft.blocker} onChange={(e) => setDraft({ ...draft, blocker: e.target.checked })} /> Blocks first send
          </label>
          <button onClick={add} style={{ background: orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
        </div>

        {loading && <p style={{ color: muted, fontSize: 14 }}>Loading…</p>}

        {groups.map((g) => (
          <div key={g.title} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, overflow: "hidden" }}>
            <p style={{ margin: 0, padding: "10px 14px", fontSize: 13, fontWeight: 800, color: g.tone ?? navy }}>{g.title} · {g.items.length}</p>
            {g.items.map(row)}
          </div>
        ))}

        {!loading && groups.length === 0 && <p style={{ color: muted, fontSize: 14 }}>Nothing open{area !== "all" || blockersOnly ? " with these filters" : ""}.</p>}

        {done.length > 0 && (
          <details style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, overflow: "hidden" }}>
            <summary style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: muted, cursor: "pointer" }}>Done · {done.length}</summary>
            {done.map(row)}
          </details>
        )}

        <p style={{ fontSize: 12, color: muted, margin: 0 }}>
          <button onClick={restore} style={{ background: "none", border: "none", color: orange, fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12 }}>Restore plan tasks</button>
          {" "}adds any plan tasks that are missing. {note}
        </p>
      </div>
    </AdminShell>
  );
}
