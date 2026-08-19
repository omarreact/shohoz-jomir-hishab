import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import HeroSection from "@/src/features/home/components/HeroSection";
import ServicesSection from "@/src/features/home/components/ServicesSection";
import MapPreviewSection from "@/src/features/home/components/MapPreviewSection";
import StatisticsSection from "@/src/features/home/components/StatisticsSection";
import HowItWorksSection from "@/src/features/home/components/HowItWorksSection";
import BlogPreviewSection from "@/src/features/home/components/BlogPreviewSection";
import FaqSection from "@/src/features/home/components/FaqSection";
import ContactSection from "@/src/features/home/components/ContactSection";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
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
