"use client";

import MobileAppHeader from "@/src/shared/components/MobileAppHeader";
import Navbar from "@/src/shared/components/Navbar";

/** Desktop/tablet use the full navigation bar; mobile uses the compact app header. */
export default function PublicGlobalHeader() {
  return (
    <>
      <div className="hidden md:block"><Navbar /></div>
      <MobileAppHeader />
    </>
  );
}
