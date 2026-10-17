import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import HeroSection from "@/src/features/home/components/HeroSection";
import MobileHomeScreen from "@/src/shared/components/MobileHomeScreen";
import EasyToolsHub from "@/src/features/home/components/EasyToolsHub";
import FaqSection from "@/src/features/home/components/FaqSection";
import LiveHomeContent from "@/src/components/cms/LiveHomeContent";
import LandBDStructuredData from "@/src/components/seo/LandBDStructuredData";
import { cmsMetadata,getCmsPage } from "@/src/lib/cms-store";
export const dynamic="force-dynamic";
export async function generateMetadata(){return cmsMetadata("homepage");}

export default async function HomePage() {
  const faq=await getCmsPage("faq");
  const items=faq.published&&faq.revision>0&&faq.sections.length
    ?faq.sections.map(section=>({question:section.heading,answer:section.body})):undefined;
  return (
    <div className="flex w-full flex-col">
      <LandBDStructuredData />
      <div className="md:hidden"><MobileHomeScreen /></div>
      <LiveHomeContent />
      <AnnouncementBanner />
      <div className="hidden md:block">
        <HeroSection />
        <EasyToolsHub />
        <FaqSection items={items}/>
      </div>
    </div>
  );
}
