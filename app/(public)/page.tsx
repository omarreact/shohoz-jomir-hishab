import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import HeroSection from "@/src/features/home/components/HeroSection";
import EasyToolsHub from "@/src/features/home/components/EasyToolsHub";
import FaqSection from "@/src/features/home/components/FaqSection";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col">
      <AnnouncementBanner />
      <HeroSection />
      <EasyToolsHub />
      <FaqSection />
    </div>
  );
}
