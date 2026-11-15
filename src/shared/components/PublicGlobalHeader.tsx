"use client";

import MobileAppHeader from "@/src/shared/components/MobileAppHeader";
import Navbar from "@/src/shared/components/Navbar";

/** Wide desktop uses the full navigation bar; smaller screens use the compact header. */
export default function PublicGlobalHeader() {
  return (
    <>
      <div className="hidden min-[1180px]:block"><Navbar /></div>
      <MobileAppHeader />
    </>
  );
}
