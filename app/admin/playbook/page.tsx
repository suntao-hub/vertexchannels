"use client";
import { useState, useEffect } from "react";
import AdminShell from "../AdminShell";
import { readSession } from "@/lib/admin/session";
import type { Playbook, Block } from "@/lib/playbook";

const navy = "#0A2333";
const orange = "#F97316";
const border = "#E5E7EB";
const muted = "#6B7280";
const LEVEL: Record<string, { bg: string; fg: string }> = {
  Critical: { bg: "#FEE2E2", fg: "#B91C1C" },
  High: { bg: "#FEF3C7", fg: "#92400E" },
  Medium: { bg: "#DBEAFE", fg: "#1D4ED8" },
};

const card: React.CSSProperties = { background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px" };

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${border}`, borderRadius: 10, background: "#fff" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {head.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontSize: 11, color: muted, fontWeight: 700, borderBottom: `1px solid ${border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: "9px 12px", verticalAlign: "top", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${border}`, fontWeight: j === 0 ? 700 : 400, color: j === 0 ? navy : "#111827", lineHeight: 1.5 }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return <p key={i} style={{ fontSize: 14, fontWeight: 700, color: navy, margin: "6px 0 0" }}>{b.text}</p>;
          case "note":
            return <p key={i} style={{ fontSize: 13, color: muted, lineHeight: 1.6, margin: 0, maxWidth: 780 }}>{b.text}</p>;
          case "list":
            return <ul key={i} style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>{b.items.map((x) => <li key={x}>{x}</li>)}</ul>;
          case "steps":
            return <ol key={i} style={{ margin: 0, paddingLeft: 22, fontSize: 14, lineHeight: 1.7 }}>{b.items.map((x) => <li key={x}>{x}</li>)}</ol>;
          case "checks":
            return (
              <div key={i} style={{ display: "grid", gap: 6 }}>
                {b.items.map((x) => (
                  <div key={x} style={{ display: "flex", gap: 10, fontSize: 14, alignItems: "flex-start" }}>
                    <span style={{ width: 14, height: 14, border: `2px solid ${muted}`, borderRadius: 3, marginTop: 3, flexShrink: 0 }} />
                    <span>{x}</span>
                  </div>
                ))}
              </div>
            );
          case "table":
            return <Table key={i} head={b.head} rows={b.rows} />;
          case "cols":
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
                {b.boxes.map((x) => (
                  <div key={x.title} style={card}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: navy, margin: "0 0 6px" }}>{x.title}</p>
                    {x.text && <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{x.text}</p>}
                    {x.items && <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.65 }}>{x.items.map((y) => <li key={y}>{y}</li>)}</ul>}
                  </div>
                ))}
              </div>
            );
          case "flow":
            return (
              <div key={i} style={{ overflowX: "auto", paddingBottom: 4 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "stretch", minWidth: 880 }}>
                  {b.columns.map((c, ci) => (
                    <div key={c.title} style={{ display: "flex", alignItems: "stretch", gap: 8, flex: 1 }}>
                      <div style={{ ...card, flex: 1, background: ci === 0 ? "#fff" : "#fff" }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: orange, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>{ci + 1}. {c.title}</p>
                        <div style={{ display: "grid", gap: 6 }}>
                          {c.items.map((x) => (
                            <div key={x} style={{ fontSize: 12.5, lineHeight: 1.45, background: "#F9FAFB", border: `1px solid ${border}`, borderRadius: 6, padding: "6px 8px" }}>{x}</div>
                          ))}
                        </div>
                      </div>
                      {ci < b.columns.length - 1 && <span style={{ alignSelf: "center", color: muted, fontSize: 18 }}>→</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          case "issues":
            return (
              <div key={i} style={{ display: "grid", gap: 10 }}>
                {b.items.map((x) => (
                  <div key={x.title} style={card}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: LEVEL[x.level].bg, color: LEVEL[x.level].fg }}>{x.level}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: navy }}>{x.title}</span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 4px", maxWidth: 800 }}>{x.why}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: muted, maxWidth: 800 }}><b style={{ color: "#111827" }}>Control:</b> {x.fix}</p>
                  </div>
                ))}
              </div>
            );
          case "log":
            return (
              <div key={i} style={{ border: `1px solid ${border}`, borderRadius: 10, background: "#fff", overflow: "hidden" }}>
                {b.items.map((x, li) => (
                  <div key={li} style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 14, padding: "10px 14px", borderBottom: li === b.items.length - 1 ? "none" : `1px solid ${border}`, fontSize: 13.5 }}>
                    <span style={{ color: muted, fontWeight: 600 }}>{x.date}</span>
                    <span>{x.text}</span>
                  </div>
                ))}
              </div>
            );
        }
      })}
    </>
  );
}

export default function PlaybookPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [pb, setPb] = useState<Playbook | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { setToken(readSession()); }, []);
  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/playbook", { headers: { "x-admin-token": token } })
      .then(async (r) => { if (!r.ok) throw new Error("Couldn't load the playbook."); setPb(await r.json()); })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load."));
  }, [token]);

  if (token === null) {
    return (
      <AdminShell title="Playbook">
        <div style={{ padding: 36, textAlign: "center" }}>
          <a href="/admin" style={{ color: orange, fontWeight: 700 }}>Sign in to continue →</a>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Playbook">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, display: "grid", gap: 32 }}>
        {err && <p style={{ color: "#DC2626", fontSize: 13 }}>{err}</p>}
        {!pb && !err && <p style={{ color: muted, fontSize: 14 }}>Loading…</p>}
        {pb && (
          <>
            <div>
              <p style={{ fontSize: 12, color: muted, margin: "0 0 10px" }}>Operating playbook · updated {pb.updated}. Edit <code>lib/playbook.ts</code> when a decision changes.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {pb.sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} style={{ fontSize: 12, color: muted, border: `1px solid ${border}`, background: "#fff", borderRadius: 999, padding: "3px 10px", textDecoration: "none" }}>{s.title}</a>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", border: `1px solid ${border}`, borderLeft: `6px solid ${orange}`, borderRadius: 10, padding: "16px 20px" }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: navy, margin: "0 0 8px" }}>{pb.verdict.title}</p>
              {pb.verdict.paragraphs.map((t) => (
                <p key={t} style={{ fontSize: 14, lineHeight: 1.65, margin: "0 0 6px", maxWidth: 800 }}>{t}</p>
              ))}
            </div>

            {pb.sections.map((s) => (
              <section key={s.id} id={s.id} style={{ display: "grid", gap: 12, scrollMarginTop: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: navy, margin: 0 }}>{s.title}</h2>
                <Blocks blocks={s.blocks} />
              </section>
            ))}
          </>
        )}
      </div>
    </AdminShell>
  );
}
