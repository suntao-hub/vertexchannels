"use client";
import { useState, useCallback } from "react";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";
const red = "#B91C1C";

export interface EmailTemplate {
  id: string;
  key: string;
  context: string;
  name: string;
  subject: string;
  body: string;
  step: number;
  waitDays: number;
  active: boolean;
}

export interface OutreachEmail {
  id: string;
  prospectId: string | null;
  leadId: string | null;
  templateKey: string;
  step: number;
  toEmail: string;
  subject: string;
  body: string;
  status: string; // draft | sent | logged | skipped
  sentAt: string | null;
  outcome: string;
  createdAt: string;
}

export const OUTCOMES = ["", "replied", "interested", "denied", "no_sellers", "bounced"];
export const OUTCOME_LABEL: Record<string, string> = {
  "": "no reply yet", replied: "replied", interested: "interested",
  denied: "denied", no_sellers: "not accepting sellers", bounced: "bounced",
};

function miniBtn(bg: string): React.CSSProperties {
  return { background: bg, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" };
}

export function OutreachSection({
  ownerKind, ownerId, contactEmail, emails, templates, token,
  onEmailsChange, onOwnerRefetch,
}: {
  ownerKind: "prospect" | "lead";
  ownerId: string;
  contactEmail: string;
  emails: OutreachEmail[];
  templates: EmailTemplate[];
  token: string;
  onEmailsChange: (emails: OutreachEmail[]) => void;
  onOwnerRefetch: () => Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [situ, setSitu] = useState("");

  const seq = templates.filter((t) => t.step > 0 && t.active).sort((a, b) => a.step - b.step);
  const situational = templates.filter((t) => t.step === 0 && t.active);
  const emailFor = (key: string) => emails.find((e) => e.templateKey === key);
  const sent = (e?: OutreachEmail) => !!e && (e.status === "sent" || e.status === "logged");

  const draft = useCallback(async (templateKey: string) => {
    setBusy(true);
    const body = ownerKind === "prospect" ? { prospectId: ownerId } : { leadId: ownerId };
    const r = await fetch("/api/admin/deals/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ ...body, templateKey }),
    });
    setBusy(false);
    if (r.ok) {
      const e: OutreachEmail = await r.json();
      onEmailsChange([...emails, e]);
      setOpenId(e.id);
    } else alert((await r.json()).error ?? "Failed.");
  }, [ownerKind, ownerId, emails, token, onEmailsChange]);

  const patchEmail = useCallback(async (id: string, payload: Record<string, unknown>, refetch = false) => {
    setBusy(true);
    const r = await fetch(`/api/admin/deals/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!r.ok) { alert((await r.json()).error ?? "Failed."); return; }
    const updated: OutreachEmail = await r.json();
    onEmailsChange(emails.map((e) => e.id === id ? updated : e));
    if (refetch) await onOwnerRefetch();
  }, [token, emails, onEmailsChange, onOwnerRefetch]);

  const removeDraft = useCallback(async (id: string) => {
    await fetch(`/api/admin/deals/outreach/${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
    onEmailsChange(emails.filter((e) => e.id !== id));
    setOpenId(null);
  }, [token, emails, onEmailsChange]);

  function dueLabel(prev: OutreachEmail | undefined, waitDays: number): string {
    if (!prev?.sentAt) return "";
    const due = new Date(prev.sentAt).getTime() + waitDays * 86400000;
    const days = Math.round((due - Date.now()) / 86400000);
    return days <= 0 ? "due now" : `due in ${days}d`;
  }

  const noEmail = !contactEmail;

  function composerFor(e: OutreachEmail) {
    return (
      <Composer
        email={e} noEmail={noEmail} busy={busy}
        onField={(f, v) => patchEmail(e.id, { [f]: v })}
        onSend={() => patchEmail(e.id, { action: "send" }, true).then(() => setOpenId(null))}
        onLog={() => patchEmail(e.id, { action: "log" }, true).then(() => setOpenId(null))}
        onDiscard={() => removeDraft(e.id)}
      />
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: muted, margin: 0 }}>
          Outreach sequence
        </p>
        <a href="/admin/deals/templates" style={{ fontSize: 11, color: orange, fontWeight: 600 }}>Edit templates ↗</a>
      </div>

      {noEmail && (
        <p style={{ fontSize: 11, color: "#B45309", margin: "0 0 8px" }}>
          No contact email set — you can still draft &amp; log emails, but not send.
        </p>
      )}

      {seq.map((t, i) => {
        const e = emailFor(t.key);
        const prev = i > 0 ? emailFor(seq[i - 1].key) : undefined;
        const unlocked = i === 0 || sent(prev);
        const isOpen = e && openId === e.id;
        return (
          <div key={t.key} style={{ border: `1px solid ${border}`, borderRadius: 8, marginBottom: 6, opacity: unlocked || e ? 1 : 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: muted, minWidth: 44 }}>Step {t.step}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: navy, flex: 1 }}>{t.name}</span>
              {sent(e) ? (
                <>
                  <span style={{ fontSize: 11, color: green }}>
                    {e!.status === "logged" ? "logged" : "sent"} {e!.sentAt ? new Date(e!.sentAt).toLocaleDateString() : ""}
                  </span>
                  <select value={e!.outcome}
                    onChange={(ev) => patchEmail(e!.id, { outcome: ev.target.value }, ev.target.value === "replied" || ev.target.value === "interested")}
                    style={{ fontSize: 11, border: `1px solid ${border}`, borderRadius: 6, padding: "2px 4px" }}>
                    {OUTCOMES.map((o) => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}
                  </select>
                </>
              ) : e ? (
                <button onClick={() => setOpenId(isOpen ? null : e.id)} style={miniBtn(navy)}>{isOpen ? "Close" : "Continue draft"}</button>
              ) : unlocked ? (
                <>
                  {prev?.sentAt && <span style={{ fontSize: 11, color: muted }}>{dueLabel(prev, t.waitDays)}</span>}
                  <button onClick={() => draft(t.key)} disabled={busy} style={miniBtn(navy)}>Draft</button>
                </>
              ) : (
                <span style={{ fontSize: 11, color: muted }}>locked</span>
              )}
            </div>
            {isOpen && e && composerFor(e)}
          </div>
        );
      })}

      {situational.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: muted, fontWeight: 600 }}>
            {ownerKind === "lead" ? "One-off:" : "Situational:"}
          </span>
          <select value={situ} onChange={(e) => setSitu(e.target.value)}
            style={{ flex: 1, fontSize: 12, border: `1px solid ${border}`, borderRadius: 6, padding: "5px 6px" }}>
            <option value="">Choose a template…</option>
            {situational.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
          <button disabled={!situ || busy} onClick={() => { draft(situ); setSitu(""); }} style={miniBtn(navy)}>Draft</button>
        </div>
      )}

      {emails.filter((e) => e.step === 0).map((e) => {
        const t = templates.find((x) => x.key === e.templateKey);
        const isOpen = openId === e.id;
        return (
          <div key={e.id} style={{ border: `1px solid ${border}`, borderRadius: 8, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: navy, flex: 1 }}>{t?.name ?? e.templateKey}</span>
              {sent(e) ? (
                <span style={{ fontSize: 11, color: green }}>{e.status === "logged" ? "logged" : "sent"} {e.sentAt ? new Date(e.sentAt).toLocaleDateString() : ""}</span>
              ) : (
                <button onClick={() => setOpenId(isOpen ? null : e.id)} style={miniBtn(navy)}>{isOpen ? "Close" : "Continue draft"}</button>
              )}
            </div>
            {isOpen && !sent(e) && composerFor(e)}
          </div>
        );
      })}
    </div>
  );
}

function Composer({ email, noEmail, busy, onField, onSend, onLog, onDiscard }: {
  email: OutreachEmail; noEmail: boolean; busy: boolean;
  onField: (f: "subject" | "body" | "toEmail", v: string) => void;
  onSend: () => void; onLog: () => void; onDiscard: () => void;
}) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [to, setTo] = useState(email.toEmail);

  return (
    <div style={{ borderTop: `1px solid ${border}`, padding: 12, background: "#FAFAFA" }}>
      <input value={to} onChange={(e) => setTo(e.target.value)} onBlur={() => to !== email.toEmail && onField("toEmail", to)}
        placeholder="recipient@example.com"
        style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${border}`, borderRadius: 6, marginBottom: 6, boxSizing: "border-box", fontFamily: "inherit" }} />
      <input value={subject} onChange={(e) => setSubject(e.target.value)} onBlur={() => subject !== email.subject && onField("subject", subject)}
        style={{ width: "100%", padding: "6px 8px", fontSize: 12, fontWeight: 600, border: `1px solid ${border}`, borderRadius: 6, marginBottom: 6, boxSizing: "border-box", fontFamily: "inherit" }} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} onBlur={() => body !== email.body && onField("body", body)}
        rows={10}
        style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: `1px solid ${border}`, borderRadius: 6, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={onSend} disabled={busy || noEmail} title={noEmail ? "Set a contact email first" : undefined}
          style={{ ...miniBtn(noEmail ? "#9CA3AF" : green), padding: "6px 14px", fontSize: 12 }}>
          {busy ? "…" : "Send email"}
        </button>
        <button onClick={onLog} disabled={busy} style={{ ...miniBtn(navy), padding: "6px 14px", fontSize: 12 }}>Log as sent</button>
        <button onClick={onDiscard} disabled={busy} style={{ background: "none", border: `1px solid ${border}`, color: red, borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Discard</button>
      </div>
    </div>
  );
}
