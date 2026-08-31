import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex Channels — Wholesale & Multi-Channel Partner",
  description: "We run your marketplace presence — your Amazon account (Seller or Vendor Central) operated on your behalf, Walmart, eBay, and Newegg run as your authorized reseller, and excess inventory cleared across all of it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
