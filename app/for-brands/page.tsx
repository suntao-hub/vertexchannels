import type { Metadata } from "next";
import ChannelMesh from "../ChannelMesh";

const navy = "#0A2333";
const orange = "#F97316";
const cream = "#FDF8F3";
const border = "#E5E7EB";
const muted = "#6B7280";

export const metadata: Metadata = {
  title: "For Brands — Vertex Channels",
  description: "How Vertex Channels runs your marketplace channels — Amazon Seller Central operated for you, Walmart, eBay and Newegg as your authorized reseller, and excess inventory cleared — on a share of the revenue we add.",
};

const STEPS = [
  { n: "01", t: "We open the account", b: "We set up as your authorized reseller, build listings for each marketplace, and wire in fulfillment — WFS, our 3PL, or yours." },
  { n: "02", t: "We run the channels", b: "Pricing, advertising, inventory flow, compliance, customer messages. You approve the channels and the pricing floor; we own the day-to-day." },
  { n: "03", t: "You get one report", b: "One dashboard, one point of contact, one monthly summary — sales and payouts by SKU by channel." },
];

const FIT = [
  "An established brand with real volume on Amazon and little or nothing on Walmart, eBay, or Newegg",
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

      <section style={{ background: navy, padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <ChannelMesh opacity={0.8} />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-block", background: orange, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 24 }}>
            For Brands
          </span>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 20px" }}>
            You own the brand.<br /><span style={{ color: orange }}>We run the channels.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>
            Vertex Channels runs Walmart, eBay, and Newegg as your authorized reseller, operates your Amazon
            Seller Central on your behalf, and moves the excess inventory that&apos;s costing you storage fees.
            You keep control of your brand; we work on a share of the revenue we add.
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
          We work on a share of the incremental revenue we generate on the channels we run for you —
          no retainer, no long lock-in. If a channel isn&apos;t earning its margin, we tell you and we
          shut it off. Exact terms depend on the channels and the scope; we&apos;ll put a number in
          front of you after the first call.
        </p>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: 0 }}>
          For excess inventory, we&apos;ll buy the lot outright at a fair price and sell it through
          across our channels — you get cash now instead of paying to store it.
        </p>
      </Section>

      <Section bg={cream}>
        <Kicker>Already on Amazon</Kicker>
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, margin: "0 0 20px" }}>
          We run your Seller Central account for you
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px" }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: navy }}>Day-to-day management</p>
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.6, margin: 0 }}>
              Advertising, catalog and A+ content, pricing, inventory, cases, and buy-box defense — operated on
              your behalf. Your account and data stay yours.
            </p>
          </div>
          <div style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px" }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: navy }}>FBA reimbursement recovery</p>
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.6, margin: 0 }}>
              Amazon owes sellers money constantly — units lost or damaged in FBA, overcharged dimensions and
              fees, returns never restocked. We audit the account, file the claims, and recover it. Paid as a
              share of what comes back.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <Kicker>Track record</Kicker>
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, margin: "0 0 16px" }}>
          $1.3M+ driven, built and run
        </h2>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: "0 0 14px" }}>
          We scaled Brightworks to $1.3M in revenue in 2025 and built their Shopify storefront from scratch.
          Current engagements span consumer products, tools, and sporting goods.
        </p>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: 0 }}>
          For the full build — manufacturing, operations, regulatory, traditional retail — we work alongside{" "}
          <a href="https://www.lyventurestudio.com/" target="_blank" rel="noreferrer" style={{ color: navy, fontWeight: 700 }}>LY Venture Studio</a>.
          Concept to shelf to marketplace, one team.
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

      <section style={{ background: navy, padding: "72px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <ChannelMesh opacity={0.4} />
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative", zIndex: 1 }}>
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
