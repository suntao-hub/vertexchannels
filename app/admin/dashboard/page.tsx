"use client";
import { useState, useEffect, useMemo } from "react";
import AdminShell from "../AdminShell";
import { readSession } from "@/lib/admin/session";
import { MILESTONES, ASSUMED_FEE, usd } from "@/lib/numbers";
import { AREAS, FIRST_SEND } from "@/lib/tasks";
import { SEGMENTS } from "@/lib/deals/tracks";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const green = "#15803D";
const red = "#B91C1C";

interface Task {
  id: string; title: string; area: string; dueDate: string | null; status: string;
  blocker: boolean; doneAt: string | null; repeat: string;
}
interface Client { monthlyFee: number; status: string; business: string }
interface Week {
  weekStart: string; sends: number; replies: number; positives: number; reads: number;
  calls: number; newClients: number; spend: number;
}
interface Numbers {
  clients: Client[]; weeks: Week[];
  pipeline: {
    prospects: Record<string, number>; leads: Record<string, number>; newLeads7d: number;
    segments: Record<string, number>; emails: Record<string, number>; outcomes: Record<string, number>;
  };
}

const ymd = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const localYmd = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);
const pretty = (s: string) =>
  new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%` : "—");

const AREAS_TILES: { href: string; title: string; text: string }[] = [
  { href: "/admin", title: "Leads", text: "Site enquiries and applications, sortable by ad spend" },
  { href: "/admin/deals", title: "Deal Desk", text: "Brand prospects: screening, contacts, outreach drafts" },
  { href: "/admin/sequences", title: "Sequences", text: "Email sequences per offer, copy and export for Instantly" },
  { href: "/admin/numbers", title: "Numbers", text: "Clients, MRR, milestones and the weekly funnel" },
  { href: "/admin/tasks", title: "Tasks", text: "The dated plan and the daily routine" },
  { href: "/admin/playbook", title: "Playbook", text: "The model, offers, rules and decision log" },
  { href: "/admin/roadmap", title: "Roadmap", text: "The earlier build roadmap" },
];

const SITE_TILES: { href: string; title: string; text: string }[] = [
  { href: "/", title: "Home page", text: "vertexchannels.com, with the contact form" },
  { href: "/for-brands", title: "Brand page", text: "The page to send brands and referrers to" },
  { href: "/apply", title: "Apply form", text: "Accepts every application and tags priority by ad spend" },
];

export default function DashboardPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [nums, setNums] = useState<Numbers | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => { setToken(readSession()); }, []);
  useEffect(() => {
    if (!token) return;
    const h = { "x-admin-token": token };
    fetch("/api/admin/numbers", { headers: h }).then((r) => (r.ok ? r.json() : null)).then(setNums);
    fetch("/api/admin/tasks", { headers: h }).then((r) => (r.ok ? r.json() : null)).then(setTasks);
  }, [token]);

  const today = localYmd(new Date());

  const m = useMemo(() => {
    const active = (nums?.clients ?? []).filter((c) => c.status === "active");
    const mrr = active.reduce((s, c) => s + c.monthlyFee, 0);
    const paying = active.filter((c) => c.monthlyFee > 0);
    const avgFee = paying.length ? mrr / paying.length : ASSUMED_FEE;
    const idx = MILESTONES.findIndex((x) => mrr < x.mrr);
    const next = idx === -1 ? null : MILESTONES[idx];
    const prev = idx > 0 ? MILESTONES[idx - 1].mrr : 0;
    return {
      mrr, active: active.length, next,
      progress: next ? Math.max(0, Math.min(100, ((mrr - prev) / (next.mrr - prev)) * 100)) : 100,
      need: next ? Math.ceil((next.mrr - mrr) / avgFee) : 0,
    };
  }, [nums]);

  const t = useMemo(() => {
    const all = tasks ?? [];
    const plan = all.filter((x) => !x.repeat);
    const open = plan.filter((x) => x.status !== "done");
    const doneToday = (x: Task) => !!x.repeat && !!x.doneAt && localYmd(new Date(x.doneAt)) === today && ymd(x.dueDate) > today;
    const routine = all.filter((x) => x.repeat && (ymd(x.dueDate) <= today || doneToday(x)));
    return {
      blockersLeft: open.filter((x) => x.blocker).length,
      blockersTotal: plan.filter((x) => x.blocker).length,
      planDone: plan.length - open.length, planTotal: plan.length,
      routineDone: routine.filter(doneToday).length, routineTotal: routine.length,
      nextUp: open.filter((x) => x.dueDate).sort((a, b) => ymd(a.dueDate).localeCompare(ymd(b.dueDate))).slice(0, 7),
    };
  }, [tasks, today]);

  const w = useMemo(() => {
    const weeks = nums?.weeks ?? [];
    const totals = weeks.reduce(
      (a, x) => ({ sends: a.sends + x.sends, replies: a.replies + x.replies, positives: a.positives + x.positives,
        newClients: a.newClients + x.newClients, spend: a.spend + x.spend }),
      { sends: 0, replies: 0, positives: 0, newClients: 0, spend: 0 },
    );
    return { last: weeks[0], totals };
  }, [nums]);

  if (token === null) {
    return (
      <AdminShell title="Dashboard">
        <div style={{ padding: 36, textAlign: "center" }}>
          <a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a>
        </div>
      </AdminShell>
    );
  }

  const card: React.CSSProperties = { background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px" };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: muted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: ".04em" };
  const big: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: navy, margin: 0 };
  const small: React.CSSProperties = { fontSize: 12.5, color: muted, margin: "4px 0 0", lineHeight: 1.5 };
  const daysToSend = daysBetween(FIRST_SEND, today);
  const loading = !nums || !tasks;
  const p = nums?.pipeline;
  const sent = (p?.emails.sent ?? 0) + (p?.emails.logged ?? 0);
  const replied = Object.values(p?.outcomes ?? {}).reduce((s, n) => s + n, 0) - (p?.outcomes.bounced ?? 0);

  return (
    <AdminShell title="Dashboard">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
        {loading && <p style={{ color: muted, fontSize: 14 }}>Loading…</p>}

        {!loading && (
          <>
            {/* Headline numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <a href="/admin/numbers" style={{ ...card, textDecoration: "none", borderTop: `4px solid ${orange}` }}>
                <p style={label}>Monthly revenue</p>
                <p style={big}>{usd(m.mrr)}</p>
                <div style={{ height: 6, background: "#E5E7EB", borderRadius: 4, margin: "8px 0 2px", overflow: "hidden" }}>
                  <div style={{ width: `${m.progress}%`, height: "100%", background: m.next ? orange : green }} />
                </div>
                <p style={small}>
                  {m.next ? `Next ${m.next.label}: ${usd(m.next.mrr - m.mrr)} to go, about ${m.need} more client${m.need === 1 ? "" : "s"}` : "Every milestone reached"}
                  {m.active === 0 ? ". Add your clients in Numbers." : ""}
                </p>
              </a>

              <a href="/admin/tasks" style={{ ...card, textDecoration: "none", borderTop: `4px solid ${t.blockersLeft === 0 ? green : red}` }}>
                <p style={label}>First send · Nov 10</p>
                <p style={big}>{daysToSend > 0 ? `${daysToSend} days` : daysToSend === 0 ? "Today" : "Passed"}</p>
                <p style={{ ...small, color: t.blockersLeft === 0 ? green : red, fontWeight: 700 }}>
                  {t.blockersLeft === 0 ? "All blockers done" : `${t.blockersLeft} of ${t.blockersTotal} blockers left`}
                </p>
                <p style={small}>{t.planDone} of {t.planTotal} plan tasks done</p>
              </a>

              <a href="/admin/tasks" style={{ ...card, textDecoration: "none", borderTop: `4px solid ${t.routineDone === t.routineTotal && t.routineTotal > 0 ? green : navy}` }}>
                <p style={label}>Today's routine</p>
                <p style={big}>{t.routineDone} of {t.routineTotal}</p>
                <p style={small}>Sales, delivery, build, close the day</p>
              </a>

              <a href="/admin" style={{ ...card, textDecoration: "none", borderTop: `4px solid ${navy}` }}>
                <p style={label}>New site leads</p>
                <p style={big}>{p?.newLeads7d ?? 0}</p>
                <p style={small}>in the last 7 days · {Object.values(p?.leads ?? {}).reduce((s, n) => s + n, 0)} total</p>
              </a>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: 16 }}>
              {/* Next up */}
              <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                <p style={{ ...label, padding: "14px 16px 8px", margin: 0 }}>Next up</p>
                {t.nextUp.length === 0 && <p style={{ ...small, padding: "0 16px 14px" }}>Nothing open.</p>}
                {t.nextUp.map((x) => {
                  const n = daysBetween(ymd(x.dueDate), today);
                  const a = AREAS[x.area] ?? AREAS.admin;
                  return (
                    <a key={x.id} href="/admin/tasks" style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 16px", borderTop: `1px solid ${border}`, textDecoration: "none" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, minWidth: 58, color: n < 0 ? red : n === 0 ? orange : muted }}>
                        {n < 0 ? `${-n}d late` : n === 0 ? "Today" : pretty(ymd(x.dueDate))}
                      </span>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: navy, minWidth: 0 }}>{x.title}</span>
                      {x.blocker && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#FEE2E2", color: red }}>Blocker</span>}
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: a.bg, color: a.fg }}>{a.label}</span>
                    </a>
                  );
                })}
              </div>

              {/* Pipeline */}
              <div style={{ ...card, display: "grid", gap: 12, alignContent: "start" }}>
                <p style={{ ...label, margin: 0 }}>Pipeline</p>
                <div>
                  <p style={{ ...small, margin: "0 0 4px", fontWeight: 700, color: navy }}>Deal Desk brands by offer</p>
                  <p style={{ ...small, margin: 0 }}>
                    {SEGMENTS.map((s) => `${s.label} ${p?.segments[s.key] ?? 0}`).join(" · ")}
                  </p>
                </div>
                <div>
                  <p style={{ ...small, margin: "0 0 4px", fontWeight: 700, color: navy }}>Deal Desk brands by stage</p>
                  <p style={{ ...small, margin: 0 }}>
                    {Object.keys(p?.prospects ?? {}).length === 0 ? "none" : Object.entries(p?.prospects ?? {}).map(([s, n]) => `${s} ${n}`).join(" · ")}
                  </p>
                </div>
                <div>
                  <p style={{ ...small, margin: "0 0 4px", fontWeight: 700, color: navy }}>Outreach</p>
                  <p style={{ ...small, margin: 0 }}>
                    {sent} sent · {p?.emails.draft ?? 0} drafts · {Math.max(replied, 0)} replies logged
                  </p>
                </div>
                <div>
                  <p style={{ ...small, margin: "0 0 4px", fontWeight: 700, color: navy }}>Site leads by status</p>
                  <p style={{ ...small, margin: 0 }}>
                    {Object.keys(p?.leads ?? {}).length === 0 ? "none" : Object.entries(p?.leads ?? {}).map(([s, n]) => `${s} ${n}`).join(" · ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Funnel */}
            <a href="/admin/numbers" style={{ ...card, textDecoration: "none", display: "grid", gap: 8 }}>
              <p style={{ ...label, margin: 0 }}>Outreach funnel</p>
              {!w.last ? (
                <p style={{ ...small, margin: 0 }}>No weeks logged yet. First send is Nov 10; log the week in Numbers each Friday.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 28px", fontSize: 13.5, color: muted }}>
                  <span>Last week ({pretty(w.last.weekStart)}): <b style={{ color: navy }}>{w.last.sends}</b> sent, <b style={{ color: navy }}>{w.last.replies}</b> replies, <b style={{ color: navy }}>{w.last.positives}</b> positive, <b style={{ color: navy }}>{w.last.newClients}</b> new clients</span>
                  <span>All time: <b style={{ color: navy }}>{w.totals.sends}</b> sent · reply rate <b style={{ color: navy }}>{pct(w.totals.replies, w.totals.sends)}</b> · spend <b style={{ color: navy }}>{usd(w.totals.spend)}</b></span>
                </div>
              )}
            </a>

            {/* Everything in the admin */}
            <div>
              <p style={{ ...label, margin: "4px 0 8px" }}>Everything in the admin</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
                {AREAS_TILES.map((x) => (
                  <a key={x.href} href={x.href} style={{ ...card, textDecoration: "none" }}>
                    <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: navy }}>{x.title} →</p>
                    <p style={small}>{x.text}</p>
                  </a>
                ))}
              </div>
              <p style={{ ...label, margin: "16px 0 8px" }}>Public site</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
                {SITE_TILES.map((x) => (
                  <a key={x.href} href={x.href} target="_blank" rel="noreferrer" style={{ ...card, textDecoration: "none" }}>
                    <p style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: navy }}>{x.title} ↗</p>
                    <p style={small}>{x.text}</p>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
