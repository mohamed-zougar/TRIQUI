import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "TriQI+ — Smarter freight matching",
    template: "%s · TriQI+",
  },
  description:
    "TriQI+ connects shippers and clients across Algeria. Post a shipment, find a trip going your way, and complete deliveries with confidence.",
  applicationName: "TriQI+",
  authors: [{ name: "TriQI+" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e8172c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
