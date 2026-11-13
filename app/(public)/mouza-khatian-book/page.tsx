import ServicePaywallGate from "@/src/components/services/ServicePaywallGate";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";
import MouzaPorchaReportBuilder from "@/src/features/land-records/components/MouzaPorchaReportBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "মৌজা ভিত্তিক খতিয়ান বই | LandBD",
  description:
    "একটি মৌজার উপলভ্য খতিয়ান, মালিক, অভিভাবক, দাগ ও জমির পরিমাণ একত্র করে A4 খতিয়ান বই তৈরি করুন।",
};

export default function MouzaKhatianBookPage() {
  return (
    <DynamicPageGate pageId="/mouza-khatian-book" featureName="মৌজা ভিত্তিক খতিয়ান বই">
      <ServicePaywallGate serviceId="mouza-porcha">
        <MouzaPorchaReportBuilder />
      </ServicePaywallGate>
    </DynamicPageGate>
  );
}
