import type { Metadata } from "next";
import ChannelMesh from "../ChannelMesh";

const navy = "#0A2333";
const orange = "#F97316";
const cream = "#FDF8F3";
const border = "#E5E7EB";
const muted = "#6B7280";

export const metadata: Metadata = {
  title: "For Brands — Vertex Channels",
  description:
    "Vertex Channels works with hard-goods brands two ways: we fix and run your marketplace accounts, or we list your products on Walmart as an authorized reseller while you ship the orders. Start with a free read of your listings.",
};

const PATHS = [
  {
    tag: "Already selling on marketplaces",
    title: "We fix and run your marketplace accounts",
    body: "Start with a free one-page read of your listings, sellers, and channel gaps. If it shows money on the table, we can run it for you.",
    points: [
      "Catalog and listing cleanup, advertising, pricing, and buy-box defense",
      "Seller monitoring: we flag and report unauthorized sellers, MAP violations, and wrong brand or category on a listing",
      "FBA reimbursement recovery, paid as a share of what comes back",
      "Your account, your data, your customers. You approve the channels and the pricing floor.",
    ],
    cta: "Get your free read",
  },
  {
    tag: "Not on Walmart yet",
    title: "Sell on Walmart with no cost to you",
    body: "We list your products as an authorized reseller, at or above your MAP. You keep shipping the way you do today, one order at a time.",
    points: [
      "We handle the listings, pricing, customer messages, and returns",
      "You ship each order direct, blind packed, and send tracking the same day",
      "You are paid after the marketplace pays us, under a short written agreement",
      "We are starting with Walmart and adding channels as the program grows",
    ],
    cta: "Become a Walmart partner brand",
  },
];

const STEPS = [
  { n: "01", t: "You send the products", b: "The items you want listed, with your wholesale price and your MAP. We confirm what's workable and agree the terms in writing before anything goes live." },
  { n: "02", t: "We list and run it", b: "Listings, pricing at or above MAP, customer messages, and returns are ours. You approve the channel and the pricing floor." },
  { n: "03", t: "You ship each order", b: "Orders come to you with the customer's details. You ship within 2 business days, blind packed, and tell us the tracking number the same day." },
];

const ASKS = [
  "Product in US stock that you can ship as single orders",
  "Shipping within 2 business days, with tracking",
  "Stock levels updated at least daily",
  "A MAP policy you want respected, or willingness to set one",
  "An authorization letter so we can list your brand on each channel",
];

const KEEP = [
  "Your brand, your pricing floor, and the channels you approve",
  "Your customer experience: blind packing, no pricing or invoices in the box",
  "The right to pause or end the program on 30 days' notice, with open orders fulfilled",
];

const FIT = [
  "Hard goods: tools, automotive, garage and shop equipment, material handling, home improvement hardware",
  "A US warehouse and the ability to ship single orders",
  "Little or no presence on Walmart, or listings and sellers that have gotten messy",
  "Products that don't need certifications you don't already hold",
];

function Section({ id, bg, children }: { id?: string; bg?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ background: bg ?? "#fff", padding: "72px 24px" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>{children}</div>
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

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, margin: "0 0 20px", lineHeight: 1.25, maxWidth: 640 }}>
      {children}
    </h2>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((f) => (
        <div key={f} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "13px 16px" }}>
          <span style={{ color: orange, fontWeight: 800, flexShrink: 0 }}>→</span>
          <span style={{ fontSize: 14, lineHeight: 1.6 }}>{f}</span>
        </div>
      ))}
    </div>
  );
}

export default function ForBrands() {
  return (
    <>
      <header style={{ background: "#fff", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        <div style={{ maxWidth: 740, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-block", background: orange, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 14px", borderRadius: 20, marginBottom: 24 }}>
            For hard-goods brands
          </span>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 20px" }}>
            More sales on the marketplaces,<br /><span style={{ color: orange }}>without adding to your team.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#CBD5E1", lineHeight: 1.7, margin: "0 0 30px" }}>
            Vertex Channels works with brands two ways. We fix and run your marketplace accounts, or we list your
            products on Walmart as an authorized reseller while you ship the orders.
          </p>
          <a href="/#contact" style={{ display: "inline-block", background: orange, color: "#fff", padding: "14px 34px", fontSize: 16, fontWeight: 700, borderRadius: 10, textDecoration: "none" }}>
            Get your free marketplace read →
          </a>
        </div>
      </section>

      <Section bg={cream}>
        <Kicker>Two ways to work together</Kicker>
        <H2>Pick the one that matches where you are</H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
          {PATHS.map((p) => (
            <div key={p.title} style={{ background: "#fff", border: `1px solid ${border}`, borderRadius: 12, padding: "24px 24px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: muted, margin: 0 }}>{p.tag}</p>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: navy, margin: 0, lineHeight: 1.25 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, margin: 0 }}>{p.body}</p>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.6 }}>
                {p.points.map((x) => <li key={x}>{x}</li>)}
              </ul>
              <a href="/#contact" style={{ marginTop: "auto", alignSelf: "flex-start", background: navy, color: "#fff", padding: "10px 20px", fontSize: 14, fontWeight: 700, borderRadius: 8, textDecoration: "none" }}>
                {p.cta} →
              </a>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Kicker>How the Walmart program works</Kicker>
        <H2>Three steps, and you stay in control</H2>
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

      <Section bg={cream}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 40 }}>
          <div>
            <Kicker>What we ask of you</Kicker>
            <H2>A short list</H2>
            <List items={ASKS} />
          </div>
          <div>
            <Kicker>What you keep</Kicker>
            <H2>Control stays with you</H2>
            <List items={KEEP} />
          </div>
        </div>
      </Section>

      <Section>
        <Kicker>Excess or aged stock</Kicker>
        <H2>Need to move inventory this quarter?</H2>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: "0 0 14px", maxWidth: 680 }}>
          Drop ship brings in sales steadily. When you have stock that has to move faster, we can propose a
          time-limited Woot event. You approve the price in writing, you ship each order as it sells, and we
          handle the listing and the buyer.
        </p>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: 0, maxWidth: 680 }}>
          Tell us what you have and where it sits when you get in touch.
        </p>
      </Section>

      <Section bg={cream}>
        <Kicker>Who it&apos;s for</Kicker>
        <H2>A good fit if you&hellip;</H2>
        <List items={FIT} />
        <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, margin: "20px 0 0", maxWidth: 680 }}>
          Not a fit yet: no US stock, orders that can&apos;t ship within 2 business days, or products that need
          certifications you don&apos;t hold.
        </p>
      </Section>

      <Section>
        <Kicker>Track record</Kicker>
        <H2>Real results, built and run</H2>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: "0 0 14px", maxWidth: 680 }}>
          We scaled Brightworks to $1.3M in revenue in 2025 and built their Shopify storefront from scratch.
          Current work spans tools, automotive, and sporting-goods brands.
        </p>
        <p style={{ fontSize: 16, color: muted, lineHeight: 1.8, margin: 0, maxWidth: 680 }}>
          For the full build, including manufacturing, operations, and regulatory work, we work alongside{" "}
          <a href="https://www.lyventurestudio.com/" target="_blank" rel="noreferrer" style={{ color: navy, fontWeight: 700 }}>LY Venture Studio</a>.
        </p>
      </Section>

      <section style={{ background: navy, padding: "72px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <ChannelMesh opacity={0.4} />
        <div style={{ maxWidth: 580, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 14px", lineHeight: 1.25 }}>
            Want a free read of your marketplace listings?
          </h2>
          <p style={{ fontSize: 16, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 28px" }}>
            Tell us who you are and where you sell. We&apos;ll send a one-page read of your listings, sellers, and
            channel gaps, or talk through the Walmart program if that fits better.
          </p>
          <a href="/#contact" style={{ display: "inline-block", background: orange, color: "#fff", padding: "14px 34px", fontSize: 16, fontWeight: 700, borderRadius: 10, textDecoration: "none" }}>
            Get in touch →
          </a>
        </div>
      </section>

      <footer style={{ background: navy, padding: "28px 24px", borderTop: "1px solid #1E3A4C" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div>
            <a href="/" style={{ display: "flex", gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Vertex</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: orange }}>Channels</span>
            </a>
            <p style={{ fontSize: 12, color: "#64748B", margin: "6px 0 0" }}>Vertex Deal LLC · 105 Mall Way, Marysville, WA 98270</p>
          </div>
          <a href="mailto:hello@vertexchannels.com" style={{ fontSize: 13, color: "#94A3B8" }}>hello@vertexchannels.com</a>
        </div>
      </footer>
    </>
  );
}
