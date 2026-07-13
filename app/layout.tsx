import type { Metadata } from "next";
import { Geist, Geist_Mono, Tiro_Bangla } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import ConditionalShell from "@/components/shared/ConditionalShell";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tiroBangla = Tiro_Bangla({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["bengali", "latin"],
  variable: "--font-tiro-bangla",
});

export const metadata: Metadata = {
  title: "সহজ জমির হিসাব | Shohoz Jomir Hishab",
  description:
    "বাংলাদেশের সবচেয়ে নির্ভুল ডিজিটাল ভূমি পরিমাপ, খতিয়ানের আনা-গন্ডা হিসাব এবং মুসলিম ও হিন্দু ফারায়েজ (উত্তরাধিকার) ক্যালকুলেটর।",
  keywords: [
    "খতিয়ান ক্যালকুলেটর",
    "ফারায়েজ ক্যালকুলেটর",
    "জমি মাপার ক্যালকুলেটর",
    "উত্তরাধিকার আইন",
    "khatiyan calculator",
    "faraez calculator bangladesh",
    "vumi jorip",
    "shohoz jomir hishab",
  ],
  authors: [{ name: "Md. Omar Faruk Khan" }],
  openGraph: {
    title: "সহজ জমির হিসাব - ডিজিটাল ভূমি পরিমাপ ও ফারায়েজ",
    description:
      "খতিয়ানের হিসাব, জমির পরিমাপ এবং আইনি উত্তরাধিকার বন্টনের সবচেয়ে স্মার্ট সমাধান।",
    url: "https://shohoz-jomir-hishab.vercel.app/", // আপনার আসল ডোমেইন দিন
    siteName: "Shohoz Jomir Hishab",
    locale: "bn_BD",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" data-scroll-behavior="smooth">
      <body
        className={tiroBangla.variable}
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh", overflowX: "hidden" }}
      >
        <ConditionalShell>{children}</ConditionalShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
