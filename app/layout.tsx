import type { Metadata } from "next";
import { Hind_Siliguri, Noto_Sans_Bengali } from "next/font/google";

import "./globals.css";
import ConditionalShell from "@/src/shared/components/ConditionalShell";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/src/shared/providers/ThemeProvider";
import { SITE_CONFIG } from "@/src/shared/config";

/** Primary UI Bangla — clear at small sizes, common on BD web apps */
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

/** Secondary / fallback Bangla coverage */
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "সহজ জমির হিসাব | Shohoz Jomir Hishab",
  description:
    "বাংলাদেশের ভূমি পরিমাপ, খতিয়ান এবং উত্তরাধিকার হিসাবের আধুনিক ডিজিটাল প্ল্যাটফর্ম।",
  keywords: [
    "খতিয়ান ক্যালকুলেটর",
    "ফারায়েজ ক্যালকুলেটর",
    "জমি মাপার ক্যালকুলেটর",
    "উত্তরাধিকার আইন",
    "বাংলাদেশ ভূমি",
  ],
  authors: [{ name: "Admin" }],
  openGraph: {
    title: "সহজ জমির হিসাব - ডিজিটাল ভূমি পরিমাপ ও ফারায়েজ",
    description:
      "খতিয়ানের হিসাব, জমির পরিমাপ এবং উত্তরাধিকার বন্টনের স্মার্ট সমাধান।",
    url: "https://landbd.pincodeit.com/",
    siteName: SITE_CONFIG.name,
    locale: "bn_BD",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="bn"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${hindSiliguri.variable} ${notoSansBengali.variable}`}
    >
      <body
        suppressHydrationWarning
        className={`${hindSiliguri.className} font-sans antialiased`}
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme={SITE_CONFIG.theme.default}
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
