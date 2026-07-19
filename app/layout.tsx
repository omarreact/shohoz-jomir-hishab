import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Bengali,
  Hind_Siliguri,
} from "next/font/google";

import "./globals.css";
import ConditionalShell from "@/components/shared/ConditionalShell";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoBengali = Noto_Sans_Bengali({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali"],
  variable: "--font-noto-bengali",
});

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali"],
  variable: "--font-hind-siliguri",
});

export const metadata: Metadata = {
  title: "LandBD - বাংলাদেশ ভূমি তথ্য প্ল্যাটফর্ম",
  description:
    "বাংলাদেশের সবচেয়ে আধুনিক ন্যাশনাল ল্যান্ড ইন্টেলিজেন্স প্ল্যাটফর্ম। খতিয়ান অনুসন্ধান, ম্যাপ বিশ্লেষণ, উত্তরাধিকার বণ্টন এবং ভূমি রেকর্ড সংক্রান্ত সকল সেবা দ্রুত ও নিরাপদে।",
  keywords: [
    "খতিয়ান ক্যালকুলেটর",
    "ফারায়েজ ক্যালকুলেটর",
    "জমি মাপার ক্যালকুলেটর",
    "উত্তরাধিকার আইন",
    "khatiyan calculator",
    "faraez calculator bangladesh",
    "vumi jorip",
    "LandBD",
  ],
  authors: [{ name: "Md. Omar Faruk Khan" }],
  openGraph: {
    title: "LandBD - বাংলাদেশ ভূমি তথ্য প্ল্যাটফর্ম",
    description:
      "বাংলাদেশের সবচেয়ে আধুনিক ন্যাশনাল ল্যান্ড ইন্টেলিজেন্স প্ল্যাটফর্ম। খতিয়ান অনুসন্ধান, ম্যাপ বিশ্লেষণ, উত্তরাধিকার বণ্টন এবং ভূমি রেকর্ড সংক্রান্ত সকল সেবা দ্রুত ও নিরাপদে।",
    url: "https://shohoz-jomir-hishab.vercel.app/", // আপনার আসল ডোমেইন দিন
    siteName: "LandBD",
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
    <html
      lang="bn"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} ${hindSiliguri.variable} font-sans`}
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ConditionalShell>{children}</ConditionalShell>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
