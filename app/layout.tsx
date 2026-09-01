import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex Channels — Walmart, eBay & Newegg, run for your brand",
  description: "Vertex Channels is your authorized reseller on the marketplaces beyond Amazon — listings, pricing, ads, and fulfillment operated for you. We work with tools, automotive, and hardware brands, on a share of the revenue we add.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
