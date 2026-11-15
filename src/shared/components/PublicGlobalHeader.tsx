"use client";

import { usePathname } from "next/navigation";
import MobileAppHeader from "@/src/shared/components/MobileAppHeader";
import Navbar from "@/src/shared/components/Navbar";

/** Home keeps its approved app-style mobile header; every other public page uses Navbar. */
export default function PublicGlobalHeader() {
  const pathname = usePathname() || "/";
  if (pathname === "/") {
    return (
      <>
        <div className="hidden md:block"><Navbar /></div>
        <MobileAppHeader />
      </>
    );
  }
  return <Navbar />;
}
