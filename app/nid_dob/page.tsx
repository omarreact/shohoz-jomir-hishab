import type { Metadata } from "next";
import { NidDobClient } from "@/src/features/nid-dob/NidDobClient";

export const metadata: Metadata = {
  title: "NID Verification | LandBD",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function NidDobPage() {
  return <NidDobClient />;
}
