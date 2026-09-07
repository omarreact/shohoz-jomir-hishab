import LatestBlogs from "@/src/shared/components/LatestBlogs";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import LandMeasurementCalculator from "@/src/features/land-measurement/components/LandMeasurementCalculator";

export default function LandMeasurementPage() {
  return (
    <>
      <HeroBanner
        align="center"
        badge="ভূমি পরিমাপ"
        title={
          <>
            সহজ ও নির্ভুল <span className="accent-text">জমি পরিমাপ</span>
          </>
        }
        description="দৈর্ঘ্য, প্রস্থ, বাহু ও কর্ণের মাপ দিয়ে জমির ক্ষেত্রফল হিসাব করুন। রাজউক-সংক্রান্ত অনুসন্ধান এখন আলাদা RAJUK পেজে রয়েছে।"
        pattern="none"
      />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <LandMeasurementCalculator />
        <div className="mt-16">
          <LatestBlogs />
        </div>
      </div>
    </>
  );
}
