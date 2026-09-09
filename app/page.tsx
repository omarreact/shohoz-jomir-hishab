import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import EasyToolsHub from "@/src/features/home/components/EasyToolsHub";
import FaqSection from "@/src/features/home/components/FaqSection";
export default function HomePage() {
  return (
    <div className="flex w-full flex-col">
      <AnnouncementBanner />
      {/* সব সুবিধা সরাসরি — তরুণ থেকে বৃদ্ধ সবার জন্য সহজ */}
      <EasyToolsHub />
      <FaqSection />
    </div>
  );
}
