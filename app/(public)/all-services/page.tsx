import type { Metadata } from "next";
import MobileOnlyAllServicesRoute from "@/src/features/all-services/components/MobileOnlyAllServicesRoute";

export const metadata: Metadata = {
  title: "সকল সেবা | LandBD",
  description: "LandBD-এর হিস্যা, জমি পরিমাপ, ফরায়েজ, খতিয়ান এবং মানচিত্র সেবা এক জায়গা থেকে ব্যবহার করুন।",
  robots: { index: false, follow: true },
};

export default function AllServicesPage() {
  return <MobileOnlyAllServicesRoute />;
}
