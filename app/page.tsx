"use client";

/**
 * app/page.tsx — Homepage orchestrator
 *
 * This file is intentionally kept thin. All section components live in
 * components/features/home/ and are imported here.
 *
 * The only client-side logic remaining here is:
 *   - Fetching the announcement (non-critical, fire-and-forget)
 *   - Rendering the dismissible banner
 *
 * All heavy section components (Hero, FeaturesGrid, WhyUs) are server-renderable
 * but imported here inside a client boundary because of the announcement state.
 * TODO: When the announcement is moved to a dedicated API route, the "use client"
 *       directive can be removed and the page becomes a full server component.
 */

import { Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import HeroSection from "@/components/features/home/HeroSection";
import FeaturesGrid from "@/components/features/home/FeaturesGrid";
import WhyUsSection from "@/components/features/home/WhyUsSection";
import AnnouncementBanner from "@/components/features/home/AnnouncementBanner";
import { useAnnouncement } from "@/lib/hooks/useAnnouncement";

// Lazy-load the blog section — it makes a Firestore call and is below the fold
const LatestBlogs = dynamic(() => import("@/components/shared/LatestBlogs"), {
  loading: () => <LoadingSpinner label="সর্বশেষ ব্লগ লোড হচ্ছে..." />,
  ssr: false,
});

export default function HomePage() {
  const announcement = useAnnouncement();

  return (
    <div className="fade-in">
      {/* Announcement Banner — dismissible, fetched from Firebase */}
      <AnnouncementBanner message={announcement} />

      {/* Hero — above the fold */}
      <HeroSection />

      {/* Feature Cards Grid */}
      <FeaturesGrid />

      {/* Why Choose Us */}
      <WhyUsSection />

      {/* Latest Blog Posts — lazy loaded */}
      <div className="container pb-5">
        <Suspense fallback={<LoadingSpinner label="সর্বশেষ ব্লগ লোড হচ্ছে..." />}>
          <LatestBlogs />
        </Suspense>
      </div>
    </div>
  );
}
