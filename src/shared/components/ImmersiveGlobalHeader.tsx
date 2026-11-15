"use client";

import { usePathname } from "next/navigation";
import MobileAppHeader from "@/src/shared/components/MobileAppHeader";
import Navbar from "@/src/shared/components/Navbar";

const HEADER_ROUTES = ["/geospatial-map", "/mouza-map", "/rajuk-test"] as const;

/** Map service pages share the public header; certificate editors remain print-isolated. */
export default function ImmersiveGlobalHeader() {
  const pathname = usePathname() || "";
  return HEADER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
    ? <><div className="hidden md:block"><Navbar /></div><MobileAppHeader /></>
    : null;
}
