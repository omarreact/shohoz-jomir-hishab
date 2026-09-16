import type { Metadata } from "next";
import MouzaPorchaReportBuilder from "@/src/features/land-records/components/MouzaPorchaReportBuilder";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";

export const metadata: Metadata = {
  title: "মৌজা পর্চা রিপোর্ট | LandBD",
  description:
    "নির্বাচিত মৌজার খতিয়ান, মালিক, অভিভাবক, দাগ, জমির পরিমাণ এবং পাওয়া গেলে সাবেক/হাল দাগসহ প্রিন্টযোগ্য রিপোর্ট তৈরি করুন।",
};

export default function MouzaPorchaReportPage() {
  return (
    <DynamicPageGate pageId="/mouza-porcha-report" featureName="মৌজা পর্চা রিপোর্ট">
      <MouzaPorchaReportBuilder />
    </DynamicPageGate>
  );
}
