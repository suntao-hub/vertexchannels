import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex Channels — Wholesale & Multi-Channel Partner",
  description: "Amazon is one channel. We run the rest — putting your catalog on Walmart, eBay, and Newegg as your authorized reseller, and clearing excess inventory across all of them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
