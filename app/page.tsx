import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import HeroSection from "@/src/features/home/components/HeroSection";
import ServicesSection from "@/src/features/home/components/ServicesSection";
import MapPreviewSection from "@/src/features/home/components/MapPreviewSection";
import StatisticsSection from "@/src/features/home/components/StatisticsSection";
import HowItWorksSection from "@/src/features/home/components/HowItWorksSection";
import BlogPreviewSection from "@/src/features/home/components/BlogPreviewSection";
import FaqSection from "@/src/features/home/components/FaqSection";
import ContactSection from "@/src/features/home/components/ContactSection";

// The public homepage is intentionally independent of RAJUK authentication.
// GIS authentication is performed by the GIS/API routes only when those
// features are actually used. A temporary RAJUK outage or bad credential must
// never make the public homepage unavailable.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="flex w-full flex-col">
      <AnnouncementBanner />
      <HeroSection />
      <ServicesSection />
      <MapPreviewSection />
      <StatisticsSection />
      <HowItWorksSection />
      <BlogPreviewSection />
      <FaqSection />
      <ContactSection />
    </div>
  );
}
