"use client";
import { useState, useRef } from "react";

// ── constants ─────────────────────────────────────────────────────────────────

const navy   = "#0A2333";
const orange = "#F97316";
const cream  = "#FDF8F3";
const border = "#E5E7EB";
const muted  = "#6B7280";

// ── SVG icon component ────────────────────────────────────────────────────────

function Icon({ d, size = 24, color = orange }: { d: string | string[]; size?: number; color?: string }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── service & problem data ────────────────────────────────────────────────────

const SERVICES = [
  {
    d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Amazon PPC Management",
    body: "We build and manage Sponsored Products, Brands, and Display campaigns that protect your ranking and profitably grow sales — not just spend.",
  },
  {
    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Listing & Content Optimization",
    body: "Titles, bullets, A+ content, and backend keywords written to convert. We audit what's hurting you and fix it.",
  },
  {
    d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Brand Protection",
    body: "Unauthorized sellers, MAP violators, and IP threats. We monitor, document, and act — so your brand doesn't get undercut on its own listing.",
  },
  {
    d: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Product Launch Strategy",
    body: "From keyword research to review velocity to launch PPC — we run launches that build organic rank, not just paid velocity that disappears.",
  },
  {
    d: ["M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
    title: "Multi-Channel Expansion",
    body: "Once Amazon is dialed in, we grow you to Walmart, Wayfair, DTC, and off-price retail. Same products, more channels, more revenue.",
  },
  {
    d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    title: "Excess Inventory Brokerage",
    body: "Overproduction, returns, or discontinued stock? We connect you to the right liquidation channel — Woot, B-Stock, or off-price retail — and negotiate on your behalf.",
  },
];

const PROBLEMS = [
  { d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", text: "Ad spend with no clear ROI" },
  { d: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6", text: "Ranking that drops and never recovers" },
  { d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", text: "Unauthorized sellers on your listings" },
  { d: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", text: "Excess inventory costing storage fees" },
  { d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9", text: "Sales stuck on a single channel" },
  { d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", text: "No time to manage any of it" },
];

const HOW = [
  {
    step: "01",
    title: "Amazon first",
    body: "Amazon is the hardest channel to get right. We start there — auditing your presence, fixing the fundamentals, and building a profitable base before expanding anywhere else.",
  },
  {
    step: "02",
    title: "Then we expand",
    body: "With a strong Amazon foundation, we open new channels systematically — Walmart, DTC, wholesale, off-price — each one adding revenue without cannibalising the others.",
  },
  {
    step: "03",
    title: "We handle the complexity",
    body: "Channel management, compliance, pricing, inventory flow — we own the operational work so you can focus on your product and your customers.",
  },
];

const SERVICES_LIST = SERVICES.map(s => s.title);

// ── shared styles ─────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", fontSize: 14, border: `1px solid ${border}`,
  borderRadius: 8, fontFamily: "inherit", color: navy, background: "#fff",
  outline: "none", boxSizing: "border-box",
};

// ── components ────────────────────────────────────────────────────────────────

function Nav({ onContact }: { onContact: () => void }) {
  return (
    <>
      {/* Mobile-responsive nav styles */}
      <style>{`
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
          .nav-cta { font-size: 13px !important; padding: 8px 16px !important; }
        }
        @media (max-width: 768px) {
          .differentiator-grid { grid-template-columns: 1fr !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
          .hero-buttons a, .hero-buttons button { text-align: center !important; }
        }
      `}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff",
        borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: navy }}>Vertex</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: orange }}>Channels</span>
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div className="nav-links" style={{ display: "flex", gap: 28 }}>
              <a href="#services" style={{ fontSize: 14, fontWeight: 500, color: muted }}>Services</a>
              <a href="#how" style={{ fontSize: 14, fontWeight: 500, color: muted }}>How it works</a>
              <a href="#about" style={{ fontSize: 14, fontWeight: 500, color: muted }}>About</a>
            </div>
            <button className="nav-cta" onClick={onContact}
              style={{ background: orange, color: "#fff", border: "none", padding: "9px 22px",
                fontSize: 14, fontWeight: 700, borderRadius: 8, cursor: "pointer" }}>
              Get in touch
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}

function ContactForm({ formRef }: { formRef: React.RefObject<HTMLDivElement | null> }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", service: "", message: "" });
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error); }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" ref={formRef} style={{ background: cream, padding: "80px 24px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>GET IN TOUCH</p>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
          Let&apos;s talk about your brand
        </h2>
        <p style={{ fontSize: 16, color: muted, margin: "0 0 40px", lineHeight: 1.6 }}>
          Tell us where you are and where you want to go. We&apos;ll respond within one business day.
        </p>

        {sent ? (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12,
            padding: "40px", textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={48} color="#16A34A" />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Message received</p>
            <p style={{ fontSize: 14, color: muted }}>We&apos;ll be in touch within one business day.</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                padding: "12px 16px", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Name <span style={{ color: orange }}>*</span>
                </label>
                <input style={inp} value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Jane Smith" required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Email <span style={{ color: orange }}>*</span>
                </label>
                <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="jane@brand.com" required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Company / brand name
              </label>
              <input style={inp} value={form.company} onChange={e => set("company", e.target.value)}
                placeholder="Your brand or company" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                What are you interested in?
              </label>
              <select style={inp} value={form.service} onChange={e => set("service", e.target.value)}>
                <option value="">Select a service…</option>
                {SERVICES_LIST.map(s => <option key={s}>{s}</option>)}
                <option>General inquiry</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Tell us about your situation <span style={{ color: orange }}>*</span>
              </label>
              <textarea style={{ ...inp, resize: "vertical" }} rows={5}
                value={form.message} onChange={e => set("message", e.target.value)}
                placeholder="Where is your brand today? What&#39;s the biggest challenge you&#39;re facing?" required />
            </div>
            <button type="submit" disabled={sending}
              style={{ width: "100%", background: sending ? "#9CA3AF" : orange,
                color: "#fff", border: "none", padding: "14px", fontSize: 16,
                fontWeight: 700, borderRadius: 10, cursor: sending ? "not-allowed" : "pointer" }}>
              {sending ? "Sending…" : "Send message →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToContact() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Nav onContact={scrollToContact} />

      {/* Hero */}
      <section style={{ background: navy, padding: "96px 24px 88px", textAlign: "center" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <span style={{ display: "inline-block", background: orange, color: "#fff",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "4px 14px", borderRadius: 20, marginBottom: 28 }}>
            Multi-Channel Brand Management
          </span>
          <h1 style={{ fontSize: "clamp(32px, 5.5vw, 56px)", fontWeight: 800, color: "#fff",
            lineHeight: 1.15, margin: "0 0 24px" }}>
            Amazon is where we start.<br />
            <span style={{ color: orange }}>Every channel</span> is where we take you.
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#CBD5E1",
            lineHeight: 1.7, margin: "0 0 40px", maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
            We take the complexity out of selling online — managing your Amazon presence,
            protecting your brand, and expanding to every channel your customers shop on.
          </p>
          <div className="hero-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={scrollToContact}
              style={{ background: orange, color: "#fff", border: "none", padding: "14px 36px",
                fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
              Get in touch →
            </button>
            <a href="#services"
              style={{ display: "inline-block", background: "transparent", color: "#fff",
                border: "1px solid #475569", padding: "14px 36px", fontSize: 16,
                fontWeight: 600, borderRadius: 10, cursor: "pointer" }}>
              See our services
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "72px 24px", background: cream }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 700,
            margin: "0 0 20px", lineHeight: 1.3 }}>
            Selling online keeps getting harder.<br />Most brands are leaving money on the table.
          </h2>
          <p style={{ fontSize: 17, color: muted, lineHeight: 1.7, maxWidth: 600,
            margin: "0 auto 48px" }}>
            Suppressed listings, runaway ad spend, MAP violators undercutting your price,
            excess inventory piling up — these problems compound fast and are costly to ignore.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
            gap: 16, textAlign: "left" }}>
            {PROBLEMS.map(p => (
              <div key={p.text} style={{ background: "#fff", border: `1px solid ${border}`,
                borderRadius: 10, padding: "16px 18px", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ flexShrink: 0, background: "#FFF7ED", borderRadius: 8, padding: 8 }}>
                  <Icon d={p.d} size={18} color={orange} />
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>WHAT WE DO</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
              margin: 0, lineHeight: 1.25, maxWidth: 420 }}>
              Full-service brand management, start to finish
            </h2>
            <button onClick={scrollToContact}
              style={{ background: "none", border: `1px solid ${orange}`, color: orange,
                padding: "10px 22px", fontSize: 14, fontWeight: 700, borderRadius: 8,
                cursor: "pointer", flexShrink: 0 }}>
              Talk to us →
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
            {SERVICES.map(s => (
              <div key={s.title} style={{ border: `1px solid ${border}`, borderRadius: 14,
                padding: "28px", background: "#fff" }}>
                <div style={{ background: "#FFF7ED", borderRadius: 10, padding: 10,
                  display: "inline-flex", marginBottom: 18 }}>
                  <Icon d={s.d} size={22} color={orange} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "80px 24px", background: navy }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#fff",
            margin: "0 0 56px", lineHeight: 1.2, maxWidth: 500 }}>
            Amazon first. Then every channel that matters.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 40 }}>
            {HOW.map(h => (
              <div key={h.step}>
                <p style={{ fontSize: 52, fontWeight: 900, color: orange, opacity: 0.25,
                  margin: "0 0 16px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {h.step}
                </p>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
                  {h.title}
                </h3>
                <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, margin: 0 }}>{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section style={{ padding: "80px 24px", background: cream }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="differentiator-grid" style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 56, alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>WHY VERTEX CHANNELS</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800,
                margin: "0 0 20px", lineHeight: 1.3 }}>
                We&apos;ve been on both sides of the table
              </h2>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.75, margin: "0 0 20px" }}>
                We&apos;ve run Amazon operations in-house at scale — managing ad spend,
                fighting suppressed listings, dealing with unauthorized sellers, and moving
                excess inventory under real business pressure.
              </p>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.75 }}>
                We know what actually moves the needle, what&apos;s a distraction, and when to
                push back on a channel that isn&apos;t worth your margin. That experience is
                what you get when you work with us.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  d: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
                  title: "No fluff, no retainer for retainer's sake",
                  body: "We work on what actually drives revenue. If something isn't working, we tell you.",
                },
                {
                  d: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
                  title: "Operator mindset, not agency mindset",
                  body: "We think like brand owners. Margin matters. Ranking matters. Channel conflict matters.",
                },
                {
                  d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
                  title: "Full lifecycle coverage",
                  body: "Launch, grow, protect, and recover — including moving inventory that isn't selling.",
                },
              ].map(d => (
                <div key={d.title} style={{ background: "#fff", border: `1px solid ${border}`,
                  borderRadius: 12, padding: "20px 22px", display: "flex", gap: 16 }}>
                  <div style={{ flexShrink: 0, background: "#FFF7ED", borderRadius: 8,
                    padding: 8, height: "fit-content" }}>
                    <Icon d={d.d} size={18} color={orange} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{d.title}</p>
                    <p style={{ fontSize: 13, color: muted, lineHeight: 1.6, margin: 0 }}>{d.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>ABOUT US</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 800,
            margin: "0 0 20px", lineHeight: 1.3 }}>
            Built for brands who are serious about winning online
          </h2>
          <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: "0 0 16px" }}>
            Vertex Channels is a multi-channel brand management firm. We work with
            e-commerce brands, wholesalers, and product companies who want a real operator
            in their corner — not a vendor running reports.
          </p>
          <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: "0 0 36px" }}>
            We start with Amazon because it&apos;s where the bar is highest and the stakes are real.
            Once that foundation is right, every other channel becomes easier to win.
          </p>
          <button onClick={scrollToContact}
            style={{ background: orange, color: "#fff", border: "none", padding: "14px 36px",
              fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
            Get a free brand analysis →
          </button>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: navy, padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 800, color: "#fff",
            margin: "0 0 16px", lineHeight: 1.3 }}>
            Ready to take control of your channels?
          </h2>
          <p style={{ fontSize: 16, color: "#94A3B8", margin: "0 0 32px", lineHeight: 1.6 }}>
            Tell us about your brand. We&apos;ll review your current presence and come back with
            an honest read of where you stand and where the real opportunity is.
          </p>
          <button onClick={scrollToContact}
            style={{ background: orange, color: "#fff", border: "none", padding: "14px 36px",
              fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
            Get in touch →
          </button>
        </div>
      </section>

      {/* Contact form */}
      <ContactForm formRef={formRef} />

      {/* Footer */}
      <footer style={{ background: navy, padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex",
          justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Vertex</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: orange }}>Channels</span>
          </div>
          <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
            © {new Date().getFullYear()} Vertex Channels · All rights reserved
          </p>
          <a href="mailto:hello@vertexchannels.com"
            style={{ fontSize: 13, color: "#94A3B8" }}>
            hello@vertexchannels.com
          </a>
        </div>
      </footer>
    </>
  );
}
