import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { LiveBridge } from "@/components/live-bridge";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Aether Network",
  description:
    "Self-funding stealth-agent marketplace. Hunt Solana, bid the work, settle in USDC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${instrument.variable} antialiased`}>
        <LiveBridge />
        {children}
      </body>
    </html>
  );
}
