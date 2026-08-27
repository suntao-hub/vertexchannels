"use client";
import { useState, useRef } from "react";

// ── constants ─────────────────────────────────────────────────────────────────

const navy   = "#0A2333";
const orange = "#F97316";
const cream  = "#FDF8F3";
const border = "#E5E7EB";
const muted  = "#6B7280";

const SERVICES = [
  {
    icon: "📈",
    title: "Amazon PPC Management",
    body: "We build and manage Sponsored Products, Brands, and Display campaigns that protect your ranking and profitably grow sales — not just spend.",
  },
  {
    icon: "🏷️",
    title: "Listing & Content Optimization",
    body: "Titles, bullets, A+ content, and backend keywords written to convert. We audit what's hurting you and fix it.",
  },
  {
    icon: "🛡️",
    title: "Brand Protection",
    body: "Unauthorized sellers, MAP violators, and IP threats. We monitor, document, and act — so your brand doesn't get undercut on its own listing.",
  },
  {
    icon: "🚀",
    title: "Product Launch Strategy",
    body: "From keyword research to review velocity to launch PPC — we run launches that build organic rank, not just paid velocity that disappears.",
  },
  {
    icon: "🌐",
    title: "Multi-Channel Expansion",
    body: "Once Amazon is dialed in, we grow you to Walmart, Wayfair, DTC, and off-price retail. Same products, more channels, more revenue.",
  },
  {
    icon: "📦",
    title: "Excess Inventory Brokerage",
    body: "Overproduction, returns, or discontinued stock? We connect you to the right liquidation channel — Woot, B-Stock, or off-price retail — and negotiate on your behalf.",
  },
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
    body: "With a strong Amazon foundation, we open new channels systematically — Walmart, DTC, wholesale, off-price — each one adding revenue without cannibalizing the others.",
  },
  {
    step: "03",
    title: "We handle the complexity",
    body: "Channel management, compliance, pricing, inventory flow — we own the operational work so you can focus on your product and your customers.",
  },
];

const SERVICES_LIST = SERVICES.map(s => s.title);

// ── components ────────────────────────────────────────────────────────────────

function Nav({ onContact }: { onContact: () => void }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff",
      borderBottom: `1px solid ${border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: navy }}>Vertex</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: orange }}>Channels</span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#services" style={{ fontSize: 14, fontWeight: 500, color: muted }}>Services</a>
          <a href="#how" style={{ fontSize: 14, fontWeight: 500, color: muted }}>How it works</a>
          <a href="#about" style={{ fontSize: 14, fontWeight: 500, color: muted }}>About</a>
          <button onClick={onContact}
            style={{ background: orange, color: "#fff", border: "none", padding: "9px 22px",
              fontSize: 14, fontWeight: 700, borderRadius: 8, cursor: "pointer" }}>
            Get in touch
          </button>
        </nav>
      </div>
    </header>
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

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", fontSize: 14, border: `1px solid ${border}`,
    borderRadius: 8, fontFamily: "inherit", color: navy, background: "#fff",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <section id="contact" ref={formRef} style={{ background: cream, padding: "80px 24px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>GET IN TOUCH</p>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
          Let's talk about your brand
        </h2>
        <p style={{ fontSize: 16, color: muted, margin: "0 0 40px", lineHeight: 1.6 }}>
          Tell us where you are and where you want to go. We'll respond within one business day.
        </p>

        {sent ? (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12,
            padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: 24, margin: "0 0 12px" }}>✅</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Message received</p>
            <p style={{ fontSize: 14, color: muted }}>We'll be in touch within one business day.</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                padding: "12px 16px", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>
                {error}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
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
                placeholder="Where is your brand today? What's the biggest challenge you're facing?" required />
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
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={scrollToContact}
              style={{ background: orange, color: "#fff", border: "none", padding: "14px 36px",
                fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
              Get in touch →
            </button>
            <a href="#services"
              style={{ background: "transparent", color: "#fff", border: "1px solid #475569",
                padding: "14px 36px", fontSize: 16, fontWeight: 600, borderRadius: 10,
                cursor: "pointer" }}>
              See our services
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section style={{ padding: "72px 24px", background: cream }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 700,
            margin: "0 0 20px", lineHeight: 1.3 }}>
            Selling online keeps getting harder.<br />Most brands are leaving money on the table.
          </h2>
          <p style={{ fontSize: 17, color: muted, lineHeight: 1.7, maxWidth: 620,
            margin: "0 auto 48px" }}>
            Suppressed listings, runaway ad spend, MAP violators undercutting your price,
            excess inventory piling up in the warehouse — these problems compound fast.
            Most brands try to manage it themselves. Most don't win that way.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 20, textAlign: "left" }}>
            {[
              { icon: "🔥", text: "Ad spend with no clear ROI" },
              { icon: "📉", text: "Ranking that drops and never comes back" },
              { icon: "🏴‍☠️", text: "Unauthorized sellers on your listings" },
              { icon: "📦", text: "Excess inventory costing you storage fees" },
              { icon: "🌐", text: "Sales stuck on one channel" },
              { icon: "🤷", text: "No time to manage any of it" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ background: "#fff", border: `1px solid ${border}`,
                borderRadius: 10, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>{text}</span>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
              margin: 0, lineHeight: 1.2, maxWidth: 480 }}>
              Full-service brand management, start to finish
            </h2>
            <button onClick={scrollToContact}
              style={{ background: "none", border: `1px solid ${orange}`, color: orange,
                padding: "10px 22px", fontSize: 14, fontWeight: 700, borderRadius: 8, cursor: "pointer" }}>
              Talk to us →
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {SERVICES.map(s => (
              <div key={s.title} style={{ border: `1px solid ${border}`, borderRadius: 14,
                padding: "28px", background: "#fff", transition: "box-shadow 0.2s" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>{s.title}</h3>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 40 }}>
            {HOW.map(h => (
              <div key={h.step}>
                <p style={{ fontSize: 48, fontWeight: 900, color: orange, opacity: 0.3,
                  margin: "0 0 16px", lineHeight: 1 }}>{h.step}</p>
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
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>WHY VERTEX CHANNELS</p>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800,
                margin: "0 0 20px", lineHeight: 1.3 }}>
                We've been on both sides of the table
              </h2>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.7, margin: "0 0 20px" }}>
                We've run Amazon operations in-house at scale — managing ad spend,
                fighting suppressed listings, dealing with unauthorized sellers, and moving
                excess inventory under real business pressure.
              </p>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.7 }}>
                We know what actually moves the needle, what's a distraction, and when to
                push back on a channel that isn't worth your margin. That experience is
                what you get when you work with us.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { title: "No fluff, no retainer for retainer's sake", body: "We work on what actually drives revenue. If something isn't working, we tell you — not hide it in a report." },
                { title: "Operator mindset, not agency mindset", body: "We think like brand owners because we've been brand operators. Margin matters. Ranking matters. Channel conflict matters." },
                { title: "Full lifecycle coverage", body: "Launch, grow, protect, and recover. Including the part most agencies skip: moving inventory that isn't selling." },
              ].map(d => (
                <div key={d.title} style={{ background: "#fff", border: `1px solid ${border}`,
                  borderRadius: 12, padding: "20px 22px" }}>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{d.title}</p>
                  <p style={{ fontSize: 13, color: muted, lineHeight: 1.6, margin: 0 }}>{d.body}</p>
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
            We start with Amazon because it's where the bar is highest and the stakes are
            real. Once that foundation is right, every other channel becomes easier to win.
          </p>
          <button onClick={scrollToContact}
            style={{ background: orange, color: "#fff", border: "none", padding: "14px 36px",
              fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
            Get a free analysis of your Amazon presence →
          </button>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: navy, padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 800, color: "#fff",
            margin: "0 0 16px", lineHeight: 1.3 }}>
            Ready to take control of your channels?
          </h2>
          <p style={{ fontSize: 16, color: "#94A3B8", margin: "0 0 32px", lineHeight: 1.6 }}>
            Tell us about your brand. We'll review your Amazon presence and come back with
            an honest read of where you stand and where the opportunity is.
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
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
