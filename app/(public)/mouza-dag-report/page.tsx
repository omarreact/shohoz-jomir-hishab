import ServicePaywallGate from "@/src/components/services/ServicePaywallGate";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";
import MouzaDagReportBuilder from "@/src/features/land-records/components/MouzaDagReportBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "মৌজা ভিত্তিক দাগ বই | LandBD",
  description:
    "নির্বাচিত মৌজার উপলভ্য দাগ নম্বর এবং সংশ্লিষ্ট খতিয়ান নম্বর group করে A4 দাগ বই তৈরি করুন।",
};

export default function MouzaDagReportPage() {
  return (
    <DynamicPageGate pageId="/mouza-dag-report" featureName="মৌজা ভিত্তিক দাগ বই">
      <ServicePaywallGate serviceId="mouza-dag-book">
        <MouzaDagReportBuilder />
      </ServicePaywallGate>
    </DynamicPageGate>
  );
}
