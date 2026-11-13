import ServicePaywallGate from "@/src/components/services/ServicePaywallGate";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";
import SurveyKhatianSearch from "@/src/features/land-records/components/SurveyKhatianSearch";
import KhatianVerificationLookup from "@/src/features/land-records/components/KhatianVerificationLookup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "নামজারি খতিয়ান অনুসন্ধান | LandBD",
  description:
    "নামজারি খতিয়ান মৌজাভিত্তিক ব্রাউজ, অনুসন্ধান, বিস্তারিত দেখা ও উপলভ্য হলে PDF তৈরি করুন।",
};

export default function NamjariKhatianPage() {
  return (
    <DynamicPageGate pageId="/namjari-khatian" featureName="নামজারি খতিয়ান">
      <ServicePaywallGate serviceId="dlrms-khatian">
        <>
          <SurveyKhatianSearch variant="mutation" />
          <div className="border-t border-[var(--border-color)] bg-[var(--canvas)] pb-10 pt-4">
            <KhatianVerificationLookup />
          </div>
        </>
      </ServicePaywallGate>
    </DynamicPageGate>
  );
}
