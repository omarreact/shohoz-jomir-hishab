import type { Metadata } from "next";
import SurveyKhatianSearch from "@/src/features/land-records/components/SurveyKhatianSearch";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";

export const metadata: Metadata = {
  title: "DLRMS খতিয়ান অনুসন্ধান | LandBD",
  description:
    "সরকারি DLRMS public data থেকে খতিয়ান, মালিক, দাগ অনুসন্ধান ও যাচাই করুন।",
};

export default function DlrmsKhatianPage() {
  return (
    <DynamicPageGate pageId="/dlrms-khatian" featureName="DLRMS খতিয়ান অনুসন্ধান">
      <SurveyKhatianSearch />
    </DynamicPageGate>
  );
}
