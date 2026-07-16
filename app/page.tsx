"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import HeroSection from "@/components/features/home/HeroSection";
import ServicesSection from "@/components/features/home/ServicesSection";
import MapPreviewSection from "@/components/features/home/MapPreviewSection";
import StatisticsSection from "@/components/features/home/StatisticsSection";
import FeatureHighlightsSection from "@/components/features/home/FeatureHighlightsSection";
import FaqSection from "@/components/features/home/FaqSection";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import AnnouncementBanner from "@/components/features/home/AnnouncementBanner";
import { useAnnouncement } from "@/lib/hooks/useAnnouncement";

// Lazy-load the blog section
const LatestBlogs = dynamic(() => import("@/components/shared/LatestBlogs"), {
  loading: () => <LoadingSpinner label="লোড হচ্ছে..." />,
  ssr: false,
});

export default function HomePage() {
  const announcement = useAnnouncement();

  return (
    <div className="fade-in">
      <AnnouncementBanner message={announcement} />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Service Cards */}
      <ServicesSection />

      {/* 3. Interactive Map Preview */}
      <MapPreviewSection />

      {/* 4. Statistics */}
      <StatisticsSection />

      {/* 5. Feature Highlights */}
      <FeatureHighlightsSection />

      {/* 6. Latest Blog Posts */}
      <div className="container py-5">
        <Suspense fallback={<LoadingSpinner label="লোড হচ্ছে..." />}>
          <LatestBlogs />
        </Suspense>
      </div>

      {/* 7. FAQ */}
      <FaqSection />

      {/* 8. Newsletter */}
      <div className="container py-5">
        <NewsletterCta />
      </div>

      {/* 9. Footer Layout is handled in layout.tsx via ConditionalShell -> AppHeader / Footer */}
    </div>
  );
}
