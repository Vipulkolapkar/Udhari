import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Udhari",
  description: "Retail credit & ledger tracking system for stationery and kirana shops with FIFO payment allocation and WhatsApp reminders.",
  keywords: ["khata", "udhaar", "stationery ledger", "vyapar", "credit tracker"],
  authors: [{ name: "Udhari" }],
  icons: {
    icon: "/favicon.ico",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b0f19",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr">
      <body>{children}</body>
    </html>
  );
}
