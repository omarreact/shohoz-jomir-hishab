import MobilePageIntro from "@/src/shared/components/MobilePageIntro";
import ServicePaywallGate from "@/src/components/services/ServicePaywallGate";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import LandMeasurementCalculator from "@/src/features/land-measurement/components/LandMeasurementCalculator";

export default function LandMeasurementPage() {
  return (
    <ServicePaywallGate serviceId="land-area">
      <MobilePageIntro eyebrow="জমির হিসাব" title="জমি পরিমাপ" description="জমির আকৃতি ও পরিমাপ দিন। ফলাফল শতাংশ, কাঠা, একর এবং বর্গফুটে দেখুন।" />
      <div className="hidden md:block"><HeroBanner
        align="center"
        badge="ভূমি পরিমাপ"
        title={
          <>
            সহজ ও নির্ভুল <span className="accent-text">জমি পরিমাপ</span>
          </></div>
        }
        description="জমির আকৃতি বেছে নিয়ে বাহু ও কর্ণের মাপ লিখুন। ক্ষেত্রফল, শতাংশ, কাঠা, একর ও বর্গফুটের ফলাফল একই জায়গায় দেখুন।"
        pattern="none"
      />
      <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-10">
        <LandMeasurementCalculator />
        <div className="mt-10 hidden md:block">
          <LatestBlogs />
        </div>
      </div>
    </ServicePaywallGate>
  );
}
