import type { Metadata } from "next";
import { NidDobClient } from "@/src/features/nid-dob/NidDobClient";

export const metadata: Metadata = {
  title: "জাতীয় পরিচয়পত্র যাচাই | LandBD",
  robots: { index: false, follow: false, nocache: true },
};

export default function NidVerificationPage() {
  return <NidDobClient />;
}
