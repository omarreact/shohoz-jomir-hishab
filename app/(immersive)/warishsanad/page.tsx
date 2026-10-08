import type { Metadata } from "next";
import WarishSanadClient from "@/src/features/warishsanad/components/WarishSanadClient";

export const metadata: Metadata = {
  title: "ওয়ারিশান সনদপত্র | LandBD",
  description: "DNCC v8 A4 pixel-calibrated succession certificate development workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WarishSanadPage() {
  return <WarishSanadClient />;
}
