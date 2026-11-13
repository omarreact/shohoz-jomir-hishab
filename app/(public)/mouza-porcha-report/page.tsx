import ServicePaywallGate from "@/src/components/services/ServicePaywallGate";
import type { Metadata } from "next";
import MouzaPorchaReportBuilder from "@/src/features/land-records/components/MouzaPorchaReportBuilder";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";

export const metadata: Metadata = {
  title: "মৌজা ভিত্তিক খতিয়ান বই | LandBD",
  description:
    "নির্বাচিত মৌজার সব উপলভ্য খতিয়ানকে normalized record model থেকে মালিক, অভিভাবক, দাগ, জমির পরিমাণ ও row-level source status সহ A4 খতিয়ান বই হিসেবে তৈরি করুন।",
};

export default function MouzaPorchaReportPage() {
  return (
    <DynamicPageGate pageId="/mouza-porcha-report" featureName="মৌজা ভিত্তিক খতিয়ান বই">
      <ServicePaywallGate serviceId="mouza-porcha">
      <MouzaPorchaReportBuilder />
          </ServicePaywallGate>
    </DynamicPageGate>
  );
}
