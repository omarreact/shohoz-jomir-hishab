import type { Metadata } from "next";
import KhatianVerificationLookup from "@/src/features/land-records/components/KhatianVerificationLookup";
import SurveyKhatianSearch from "@/src/features/land-records/components/SurveyKhatianSearch";

export const metadata: Metadata = {
  title: "DLRMS খতিয়ান অনুসন্ধান | LandBD",
  description:
    "সরকারি DLRMS public data থেকে খতিয়ান, মালিক ও দাগের তথ্য অনুসন্ধান করুন।",
};

export default function DlrmsKhatianPage() {
  return (
    <>
      <KhatianVerificationLookup />
      <SurveyKhatianSearch />
    </>
  );
}
