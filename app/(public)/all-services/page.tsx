import type { Metadata } from "next";
import AllServicesWorkspace from "@/src/features/all-services/components/AllServicesWorkspace";

export const metadata: Metadata = {
  title: "সকল সেবা | LandBD",
  description: "LandBD-এর হিস্যা, জমি পরিমাপ, ফরায়েজ, খতিয়ান এবং মানচিত্র সেবা এক জায়গা থেকে ব্যবহার করুন।",
};

export default function AllServicesPage() {
  return <AllServicesWorkspace />;
}
