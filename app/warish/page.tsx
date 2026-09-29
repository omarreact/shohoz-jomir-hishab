import type { Metadata } from "next";
import WarishEditor from "./WarishEditor";

export const metadata: Metadata = {
  title: "ওয়ারিশ সনদপত্র এডিটর | LandBD",
  description: "DNCC ওয়ার্ড/অঞ্চল রেফারেন্সসহ সম্পাদনাযোগ্য নমুনা ওয়ারিশ সনদপত্র।",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WarishPage() {
  return <WarishEditor />;
}
