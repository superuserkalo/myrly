import type { Metadata } from "next";
import { Fraunces, Instrument_Serif, Inter } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const fraunces = Fraunces({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["900"],
  style: ["italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Mooody",
  description: "The Mooody is a vision and mood board generator for your next reality.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${fraunces.variable} antialiased`}
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
