import type { Metadata } from "next";
import KhatianVerificationLookup from "@/src/features/land-records/components/KhatianVerificationLookup";
import SurveyKhatianSearch from "@/src/features/land-records/components/SurveyKhatianSearch";

export const metadata: Metadata = {
  title: "DLRMS খতিয়ান অনুসন্ধান ও QR যাচাইকরণ | LandBD",
  description:
    "সরকারি DLRMS public data থেকে খতিয়ান, মালিক, দাগ এবং QR verification record অনুসন্ধান ও যাচাই করুন।",
};

export default function DlrmsKhatianPage() {
  return (
    <>
      <KhatianVerificationLookup />
      <SurveyKhatianSearch />
    </>
  );
}
