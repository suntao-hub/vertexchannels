import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertex Channels — Amazon & Multi-Channel Brand Management",
  description: "We start with Amazon — the hardest channel to get right — then grow your brand across every channel from there. PPC, listings, inventory, and beyond.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
