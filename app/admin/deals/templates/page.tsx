"use client";
import { useState, useEffect, useCallback } from "react";
import AdminShell from "../../AdminShell";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";

interface Template {
  id: string; key: string; name: string; subject: string; body: string;
  step: number; waitDays: number; active: boolean;
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

const MERGE_FIELDS = ["{{brand}}", "{{contact}}", "{{category}}", "{{website}}", "{{yourName}}", "{{company}}", "{{title}}", "{{site}}"];

export default function TemplatesPage() {
  const token = useToken();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await fetch("/api/admin/deals/templates", { headers: { "x-admin-token": token } });
    setTemplates(await r.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const save = useCallback(async (id: string, patch: Partial<Template>) => {
    if (!token) return;
    const r = await fetch(`/api/admin/deals/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(patch),
    });
    if (r.ok) {
      const updated: Template = await r.json();
      setTemplates((ts) => ts.map((t) => t.id === id ? updated : t));
    }
  }, [token]);

  if (token === undefined || (loading && token)) return <Centered>Loading…</Centered>;
  if (token === null) return <Centered><a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a></Centered>;

  const seq = templates.filter((t) => t.step > 0).sort((a, b) => a.step - b.step);
  const situ = templates.filter((t) => t.step === 0);

  return (
    <AdminShell
      title="Outreach templates"
      actions={<a href="/admin/deals" style={{ fontSize: 13, color: muted }}>← Back to Deal Desk</a>}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
        <div style={{ background: "#F0F9FF", border: `1px solid #BAE6FD`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: navy, margin: "0 0 4px" }}>Merge fields</p>
          <p style={{ fontSize: 12, color: muted, margin: 0, lineHeight: 1.7 }}>
            {MERGE_FIELDS.map((f) => (
              <code key={f} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 4, padding: "1px 5px", marginRight: 6, fontSize: 11 }}>{f}</code>
            ))}
          </p>
          <p style={{ fontSize: 11, color: muted, margin: "6px 0 0" }}>
            {"{{brand}} {{contact}} {{category}} {{website}}"} come from the prospect. The rest are set via env vars (OUTREACH_SENDER_NAME, OUTREACH_COMPANY, …).
          </p>
        </div>

        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "0 0 8px" }}>Sequence</p>
        {seq.map((t) => <Row key={t.id} t={t} open={openId === t.id} onToggle={() => setOpenId(openId === t.id ? null : t.id)} onSave={save} />)}

        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: "20px 0 8px" }}>Situational replies</p>
        {situ.map((t) => <Row key={t.id} t={t} open={openId === t.id} onToggle={() => setOpenId(openId === t.id ? null : t.id)} onSave={save} />)}
      </div>
    </AdminShell>
  );
}

function Row({ t, open, onToggle, onSave }: {
  t: Template; open: boolean; onToggle: () => void;
  onSave: (id: string, patch: Partial<Template>) => void;
}) {
  const [name, setName] = useState(t.name);
  const [subject, setSubject] = useState(t.subject);
  const [body, setBody] = useState(t.body);
  const [step, setStep] = useState(String(t.step));
  const [waitDays, setWaitDays] = useState(String(t.waitDays));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(t.name); setSubject(t.subject); setBody(t.body);
    setStep(String(t.step)); setWaitDays(String(t.waitDays));
  }, [t]);

  function commit() {
    onSave(t.id, { name, subject, body, step: Number(step) || 0, waitDays: Number(waitDays) || 0 });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 8, marginBottom: 8, background: "#fff" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }}>
        <span style={{ fontSize: 11, color: muted }}>{open ? "▾" : "▸"}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: navy, flex: 1 }}>{t.name}</span>
        {t.step > 0 && <span style={{ fontSize: 11, color: muted }}>step {t.step} · wait {t.waitDays}d</span>}
      </div>
      {open && (
        <div style={{ padding: 14, borderTop: `1px solid ${border}`, background: "#FAFAFA" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <label style={{ flex: 1, fontSize: 12 }}>
              <span style={{ color: muted, fontWeight: 600 }}>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} style={inp} />
            </label>
            {t.step > 0 && (
              <>
                <label style={{ width: 70, fontSize: 12 }}>
                  <span style={{ color: muted, fontWeight: 600 }}>Step</span>
                  <input value={step} onChange={(e) => setStep(e.target.value)} style={inp} />
                </label>
                <label style={{ width: 90, fontSize: 12 }}>
                  <span style={{ color: muted, fontWeight: 600 }}>Wait days</span>
                  <input value={waitDays} onChange={(e) => setWaitDays(e.target.value)} style={inp} />
                </label>
              </>
            )}
          </div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: muted, fontWeight: 600 }}>Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inp} />
          </label>
          <label style={{ display: "block", fontSize: 12 }}>
            <span style={{ color: muted, fontWeight: 600 }}>Body</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14}
              style={{ ...inp, resize: "vertical", lineHeight: 1.5, fontFamily: "ui-monospace, monospace" }} />
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <button onClick={commit} style={{ background: navy, color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
            {saved && <span style={{ fontSize: 12, color: green, fontWeight: 600 }}>Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${border}`,
  borderRadius: 6, marginTop: 3, boxSizing: "border-box", fontFamily: "inherit",
};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontFamily: "system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
