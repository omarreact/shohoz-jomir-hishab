import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import HeroSection from "@/src/features/home/components/HeroSection";
import EasyToolsHub from "@/src/features/home/components/EasyToolsHub";
import FaqSection from "@/src/features/home/components/FaqSection";
import LiveHomeContent from "@/src/components/cms/LiveHomeContent";
import LandBDStructuredData from "@/src/components/seo/LandBDStructuredData";
import { cmsMetadata } from "@/src/lib/cms-store";
export const dynamic="force-dynamic";
export async function generateMetadata(){return cmsMetadata("homepage");}

export default function HomePage() {
  return (
    <div className="flex w-full flex-col">
      <LandBDStructuredData />
      <LiveHomeContent />
      <AnnouncementBanner />
      <HeroSection />
      <EasyToolsHub />
      <FaqSection />
    </div>
  );
}
