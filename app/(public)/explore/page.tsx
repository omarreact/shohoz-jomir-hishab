import type { Metadata } from "next";
import MobileExplore from "@/src/shared/components/MobileExplore";

export const metadata: Metadata = {
  title: "সব ভূমি সেবা | LandBD",
  description: "LandBD-এর খতিয়ান, জমি পরিমাপ, মানচিত্র, ওয়ারিশ ও ভূমি তথ্যের সকল সেবা।",
};

export default function ExplorePage() {
  return <MobileExplore />;
}
