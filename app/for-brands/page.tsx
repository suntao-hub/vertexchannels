import type { Metadata } from "next";

const navy = "#0A2333";
const orange = "#F97316";
const cream = "#FDF8F3";
const border = "#E5E7EB";
const muted = "#6B7280";

export const metadata: Metadata = {
  title: "For Brands — Vertex Channels",
  description: "How Vertex Channels runs Walmart, eBay, and Newegg for tools, automotive, and garage-equipment brands as an authorized reseller — on a share of the revenue we add.",
};

const STEPS = [
  { n: "01", t: "We open the account", b: "We set up as your authorized reseller, build listings for each marketplace, and wire in fulfillment — WFS, our 3PL, or yours." },
  { n: "02", t: "We run the channels", b: "Pricing, advertising, inventory flow, compliance, customer messages. You approve the channels and the pricing floor; we own the day-to-day." },
  { n: "03", t: "You get one report", b: "One dashboard, one point of contact, one monthly summary — sales and payouts by SKU by channel." },
];

const FIT = [
  "$1.5M–15M/yr on Amazon, thin or no presence on Walmart / eBay / Newegg",
  "Tools, hardware, automotive accessories, garage & shop equipment, material handling",
  "MAP policy you want enforced, or unauthorized sellers you want cleaned up",
  "Excess, aged, or discontinued inventory you'd rather turn into cash than storage fees",
];

function Section({ id, bg, children }: { id?: string; bg?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ background: bg ?? "#fff", padding: "72px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: orange, margin: "0 0 10px" }}>
      {children}
    </p>
  );
}

export default function ForBrands() {
  return (
    <>
      <header style={{ background: "#fff", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: navy }}>Vertex</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: orange }}>Channels</span>
          </a>
          <a href="/#contact" style={{ background: orange, color: "#fff", padding: "9px 22px", fontSize: 14, fontWeight: 700, borderRadius: 8, textDecoration: "none" }}>
            Get in touch
          </a>
        </div>
      </header>

      <section style={{ background: navy, padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <span style={{ display: "inline-block", background: orange, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 24 }}>
            For Brands
          </span>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 20px" }}>
            You handle Amazon.<br /><span style={{ color: orange }}>We run everything else.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>
            Vertex Channels becomes your authorized reseller on Walmart, eBay, Newegg, and other
            marketplaces — and moves the excess inventory that's costing you storage fees. You keep
            control of your brand. We work on a share of the revenue we add.
          </p>
        </div>
      </section>

      <Section bg={cream}>
        <Kicker>What we do</Kicker>
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, margin: "0 0 28px" }}>
          A full channel operation, run for you
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 32 }}>
          {STEPS.map((s) => (
            <div key={s.n}>
              <p style={{ fontSize: 44, fontWeight: 900, color: orange, opacity: 0.25, margin: "0 0 10px", lineHeight: 1 }}>{s.n}</p>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: navy }}>{s.t}</h3>
              <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, margin: 0 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Kicker>The model</Kicker>
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, margin: "0 0 16px" }}>
          Rev-share, not a retainer
        </h2>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: "0 0 14px" }}>
          We take a share of the incremental revenue we generate on the channels we run for you —
          typically 15–25% of net, plus a small per-channel setup fee. If a channel isn&apos;t earning
          its margin, we tell you and we shut it off.
        </p>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: 0 }}>
          For excess inventory, we&apos;ll buy the lot outright at a fair price and sell it through
          across our channels — you get cash now instead of paying to store it.
        </p>
      </Section>

      <Section bg={cream}>
        <Kicker>Who it&apos;s for</Kicker>
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, margin: "0 0 24px" }}>
          A good fit if you&apos;re a brand with&hellip;
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FIT.map((f) => (
            <div key={f} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px" }}>
              <span style={{ color: orange, fontWeight: 800, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{f}</span>
            </div>
          ))}
        </div>
      </Section>

      <section style={{ background: navy, padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 14px" }}>
            Worth a 20-minute call?
          </h2>
          <p style={{ fontSize: 16, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 28px" }}>
            Tell us where you sell today. We&apos;ll come back with which channels are worth opening
            and what your excess inventory is really costing you.
          </p>
          <a href="/#contact" style={{ display: "inline-block", background: orange, color: "#fff", padding: "14px 34px", fontSize: 16, fontWeight: 700, borderRadius: 10, textDecoration: "none" }}>
            Get in touch →
          </a>
        </div>
      </section>

      <footer style={{ background: navy, padding: "28px 24px", borderTop: "1px solid #1E3A4C" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <a href="/" style={{ display: "flex", gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Vertex</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: orange }}>Channels</span>
          </a>
          <a href="mailto:hello@vertexchannels.com" style={{ fontSize: 13, color: "#94A3B8" }}>hello@vertexchannels.com</a>
        </div>
      </footer>
    </>
  );
}
