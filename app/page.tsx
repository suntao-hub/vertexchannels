"use client";
import { useState, useRef } from "react";
import ChannelMesh from "./ChannelMesh";

// ── constants ─────────────────────────────────────────────────────────────────

const navy   = "#0A2333";
const orange = "#F97316";
const cream  = "#FDF8F3";
const border = "#E5E7EB";
const muted  = "#6B7280";

// ── SVG icon ──────────────────────────────────────────────────────────────────

function Icon({ d, size = 24, color = orange }: { d: string | string[]; size?: number; color?: string }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── content ───────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    d: ["M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
    title: "Multi-Channel Selling",
    body: "We become your authorized reseller and run Walmart, eBay, Newegg, Amazon, and Woot — listings, pricing, ads, and fulfillment. You approve the channels; we operate them.",
  },
  {
    d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Managed Marketplace Accounts",
    body: "Prefer to keep your own Seller Central? We run it for you — same operational work, your account, your data, your customer relationships.",
  },
  {
    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    title: "Marketplace Relaunch",
    body: "Stepped back from Amazon or never got Walmart off the ground? We rebuild the listings, re-establish the accounts, and get the catalog live again.",
  },
  {
    d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    title: "Excess Inventory Recovery",
    body: "We buy overstock, returns, and discontinued lines outright and sell them through our channels — cash to you now, kept off the channels that matter to your brand.",
  },
  {
    d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Brand Protection & MAP",
    body: "Unauthorized sellers and MAP violators fragment your pricing and your brand. As your authorized channel partner, we consolidate control and enforce your policy.",
  },
  {
    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Listing & Content",
    body: "Every channel renders your product differently. We build listings — titles, images, A+, attributes — that convert on each one, not a copy-paste from your Amazon page.",
  },
];

const PHASES = [
  { n: "01", t: "Map", b: "We look at where you sell today, where demand is going unserved, and what inventory is stuck. You get a channel plan and a revenue number." },
  { n: "02", t: "Onboard", b: "Authorized-reseller setup or account access, listings built for each marketplace, fulfillment wired in — WFS, our 3PL, or yours." },
  { n: "03", t: "Launch", b: "We go live on the channels you've approved, priced to your floor, with advertising running from day one." },
  { n: "04", t: "Run", b: "Pricing, ads, inventory flow, compliance, customer issues — ongoing. One report, one point of contact." },
];

const WORK = [
  {
    name: "Brightworks",
    href: "https://brightworksproducts.com/",
    period: "2024–2025",
    body: "Scaled to $1.3M in revenue in 2025 and built their Shopify storefront from the ground up.",
  },
  {
    name: "Reloading Basic",
    href: "",
    period: "Current",
    body: "Marketplace management for reloading and sporting-goods supplies.",
  },
  {
    name: "Orazen",
    href: "https://www.orazeninc.com/",
    period: "Current",
    body: "Rebuilding their Amazon and marketplace presence from the ground up.",
  },
];

const WHY = [
  {
    d: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
    t: "Rev-share, not retainer",
    b: "We mostly work on a share of the revenue we add. If a channel isn't earning its margin, we say so.",
  },
  {
    d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    t: "We'll take the inventory",
    b: "When it makes sense, we buy the lot and carry the risk — so stuck stock becomes cash instead of a line item.",
  },
  {
    d: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9",
    t: "Operator, not agency",
    b: "We think like brand owners. Margin matters. Channel conflict matters. Cash tied up in stock matters.",
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
      <style>{`
        @media (max-width: 700px) {
          .nav-links { display: none !important; }
          .nav-cta { font-size: 13px !important; padding: 8px 16px !important; }
        }
        @media (max-width: 768px) {
          .why-grid { grid-template-columns: 1fr !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
          .hero-buttons a, .hero-buttons button { text-align: center !important; }
        }
      `}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: navy }}>Vertex</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: orange }}>Channels</span>
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div className="nav-links" style={{ display: "flex", gap: 28 }}>
              <a href="#services" style={{ fontSize: 14, fontWeight: 500, color: muted }}>Services</a>
              <a href="#how" style={{ fontSize: 14, fontWeight: 500, color: muted }}>How we work</a>
              <a href="#work" style={{ fontSize: 14, fontWeight: 500, color: muted }}>Work</a>
              <a href="/for-brands" style={{ fontSize: 14, fontWeight: 500, color: muted }}>For brands</a>
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

function Kicker({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
      color: light ? "#F97316" : orange, margin: "0 0 12px" }}>{children}</p>
  );
}

function ContactForm({ formRef }: { formRef: React.RefObject<HTMLDivElement | null> }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", service: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSending(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
        <Kicker>Get in touch</Kicker>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
          Let&apos;s talk about your channels
        </h2>
        <p style={{ fontSize: 16, color: muted, margin: "0 0 40px", lineHeight: 1.6 }}>
          Tell us where you sell today and where you want to go. We&apos;ll respond within one business day.
        </p>

        {sent ? (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: 40, textAlign: "center" }}>
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
                padding: "12px 16px", color: "#DC2626", fontSize: 14, marginBottom: 20 }}>{error}</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Name <span style={{ color: orange }}>*</span>
                </label>
                <input style={inp} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Email <span style={{ color: orange }}>*</span>
                </label>
                <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@brand.com" required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Company / brand name</label>
              <input style={inp} value={form.company} onChange={e => set("company", e.target.value)} placeholder="Your brand or company" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>What are you interested in?</label>
              <select style={inp} value={form.service} onChange={e => set("service", e.target.value)}>
                <option value="">Select a service…</option>
                {SERVICES_LIST.map(s => <option key={s}>{s}</option>)}
                <option>Excess inventory</option>
                <option>General inquiry</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Tell us about your situation <span style={{ color: orange }}>*</span>
              </label>
              <textarea style={{ ...inp, resize: "vertical" }} rows={5}
                value={form.message} onChange={e => set("message", e.target.value)}
                placeholder="Where do you sell today? What&#39;s the biggest gap or the biggest headache?" required />
            </div>
            <button type="submit" disabled={sending}
              style={{ width: "100%", background: sending ? "#9CA3AF" : orange, color: "#fff", border: "none",
                padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: sending ? "not-allowed" : "pointer" }}>
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
  const scrollToContact = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Nav onContact={scrollToContact} />

      {/* Hero */}
      <section style={{ background: navy, padding: "96px 24px 88px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <ChannelMesh opacity={0.85} />
        <div style={{ maxWidth: 780, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-block", background: orange, color: "#fff", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 28 }}>
            Wholesale &amp; Multi-Channel Partner
          </span>
          <h1 style={{ fontSize: "clamp(32px, 5.5vw, 56px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 24px" }}>
            Amazon is one channel.<br /><span style={{ color: orange }}>We run the rest.</span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#CBD5E1", lineHeight: 1.7,
            margin: "0 auto 40px", maxWidth: 640 }}>
            Vertex Channels is your wholesale and multi-channel partner — putting your catalog on Walmart, eBay,
            and Newegg, and clearing excess inventory across all of them. You keep control of your brand;
            we own the operational grind.
          </p>
          <div className="hero-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={scrollToContact}
              style={{ background: orange, color: "#fff", border: "none", padding: "14px 36px",
                fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
              Get in touch →
            </button>
            <a href="#services"
              style={{ display: "inline-block", background: "transparent", color: "#fff", border: "1px solid #475569",
                padding: "14px 36px", fontSize: 16, fontWeight: 600, borderRadius: 10 }}>
              See our services
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Kicker>What we do</Kicker>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, margin: "0 0 48px", lineHeight: 1.25, maxWidth: 460 }}>
            One partner for every channel Amazon isn&apos;t
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 4 }}>
            {SERVICES.map((s, i) => (
              <div key={s.title} style={{ padding: "26px 24px", borderTop: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: orange, fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon d={s.d} size={20} color={orange} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section id="how" style={{ padding: "80px 24px", background: navy, position: "relative", overflow: "hidden" }}>
        <ChannelMesh opacity={0.5} />
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Kicker light>How we work</Kicker>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#fff", margin: "0 0 56px", lineHeight: 1.2, maxWidth: 520 }}>
            You approve the channels. We do everything after that.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 36 }}>
            {PHASES.map(p => (
              <div key={p.n}>
                <p style={{ fontSize: 46, fontWeight: 900, color: orange, opacity: 0.28, margin: "0 0 14px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{p.n}</p>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>{p.t}</h3>
                <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, margin: 0 }}>{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section id="work" style={{ padding: "80px 24px", background: cream }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Kicker>Selected work</Kicker>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.25 }}>
            Real revenue, built and run
          </h2>
          <p style={{ fontSize: 16, color: muted, lineHeight: 1.7, margin: "0 0 40px", maxWidth: 560 }}>
            $1.3M+ in client revenue driven, Shopify and marketplace builds from scratch, and active
            engagements across consumer products, tools, and sporting goods.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {WORK.map(w => (
              <div key={w.name} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: navy }}>
                    {w.href
                      ? <a href={w.href} target="_blank" rel="noreferrer" style={{ color: navy }}>{w.name} ↗</a>
                      : w.name}
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    color: w.period === "Current" ? "#15803D" : muted }}>{w.period}</span>
                </div>
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.6, margin: 0 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Vertex Channels */}
      <section id="why" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 56, alignItems: "start" }}>
            <div>
              <Kicker>Why Vertex Channels</Kicker>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, margin: "0 0 20px", lineHeight: 1.3 }}>
                We operate. We don&apos;t send reports.
              </h2>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.75, margin: "0 0 18px" }}>
                Most brands pour everything into Amazon and let Walmart, eBay, and Newegg sit idle — while excess
                inventory racks up storage fees and unauthorized sellers fragment the price.
              </p>
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.75 }}>
                We&apos;ve run marketplace operations in-house, built the software for it, and carried real P&amp;L.
                We know what moves the needle, what&apos;s a distraction, and when a channel isn&apos;t worth your margin.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {WHY.map(w => (
                <div key={w.t} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: "20px 22px", display: "flex", gap: 16 }}>
                  <div style={{ flexShrink: 0, background: "#FFF7ED", borderRadius: 8, padding: 8, height: "fit-content" }}>
                    <Icon d={w.d} size={18} color={orange} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{w.t}</p>
                    <p style={{ fontSize: 13, color: muted, lineHeight: 1.6, margin: 0 }}>{w.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partner network */}
      <section style={{ padding: "72px 24px", background: cream }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <Kicker>Partner network</Kicker>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.3 }}>
            Need the full build, not just the channels?
          </h2>
          <p style={{ fontSize: 16, color: muted, lineHeight: 1.75, margin: "0 0 12px" }}>
            For manufacturing, operations, regulatory, and traditional retail, we work alongside{" "}
            <a href="https://www.lyventurestudio.com/" target="_blank" rel="noreferrer" style={{ color: navy, fontWeight: 700 }}>
              LY Venture Studio
            </a>. Between us — concept to shelf to marketplace, run by one team.
          </p>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: navy, padding: "72px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <ChannelMesh opacity={0.4} />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.3 }}>
            Ready to take control of your channels?
          </h2>
          <p style={{ fontSize: 16, color: "#94A3B8", margin: "0 0 32px", lineHeight: 1.6 }}>
            Tell us where you sell today. We&apos;ll come back with which channels are worth opening and what
            your excess inventory is really costing you.
          </p>
          <button onClick={scrollToContact}
            style={{ background: orange, color: "#fff", border: "none", padding: "14px 36px", fontSize: 16, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
            Get in touch →
          </button>
        </div>
      </section>

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
          <a href="mailto:hello@vertexchannels.com" style={{ fontSize: 13, color: "#94A3B8" }}>hello@vertexchannels.com</a>
        </div>
      </footer>
    </>
  );
}
