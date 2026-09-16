import type { Metadata } from "next";
import { Hind_Siliguri, Inter, Noto_Sans_Bengali } from "next/font/google";

import "./globals.css";
import "./landbd-theme.css";
import "./font-system.css";
import "./result-export-policy.css";
import BanglaUiEnforcer from "@/src/shared/components/BanglaUiEnforcer";
import ConditionalShell from "@/src/shared/components/ConditionalShell";
import VisitTracker from "@/src/shared/components/VisitTracker";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/src/shared/providers/ThemeProvider";
import { SITE_CONFIG } from "@/src/shared/config";

/** English/Latin UI — used first so English labels, IDs and numbers render cleanly. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

/** Primary Bangla UI — clear at small sizes, common on BD web apps. */
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

/** Stable Bangla fallback/export font, especially useful for printable records. */
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-bengali",
  display: "swap",
});

const siteUrl = new URL("https://landbd.pincodeit.com");
const socialImage = "/brand/og-default.svg";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "LandBD",
  title: "সহজ জমির হিসাব | LandBD",
  description:
    "বাংলাদেশের ভূমি পরিমাপ, খতিয়ান, মানচিত্র এবং উত্তরাধিকার হিসাবের আধুনিক ডিজিটাল প্ল্যাটফর্ম।",
  keywords: [
    "খতিয়ান ক্যালকুলেটর",
    "ফারায়েজ ক্যালকুলেটর",
    "জমি মাপার ক্যালকুলেটর",
    "উত্তরাধিকার আইন",
    "বাংলাদেশ ভূমি",
    "LandBD",
  ],
  authors: [{ name: "LandBD" }],
  creator: "LandBD",
  publisher: "LandBD",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "সহজ জমির হিসাব | LandBD",
    description:
      "খতিয়ান, জমির পরিমাপ, উত্তরাধিকার, GIS ও মৌজা তথ্যের স্মার্ট ডিজিটাল প্ল্যাটফর্ম।",
    url: siteUrl,
    siteName: "LandBD — সহজ জমির হিসাব",
    locale: "bn_BD",
    type: "website",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "LandBD — সহজ জমির হিসাব",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "সহজ জমির হিসাব | LandBD",
    description: "বাংলাদেশের ডিজিটাল ভূমি তথ্য, হিসাব ও মানচিত্র প্ল্যাটফর্ম।",
    images: [socialImage],
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
      className={`${inter.variable} ${hindSiliguri.variable} ${notoSansBengali.variable}`}
    >
      <body
        suppressHydrationWarning
        className="font-sans antialiased"
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={SITE_CONFIG.theme.default}
          forcedTheme="light"
          enableSystem={false}
          enableColorScheme={false}
          disableTransitionOnChange
        >
          <ConditionalShell>{children}</ConditionalShell>
          <BanglaUiEnforcer />
          <VisitTracker />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
