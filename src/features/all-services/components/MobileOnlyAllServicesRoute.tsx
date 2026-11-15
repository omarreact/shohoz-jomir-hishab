"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AllServicesWorkspace from "./AllServicesWorkspace";

/** Keep the legacy service-hub URL mobile-only without server UA/cache branching. */
export default function MobileOnlyAllServicesRoute() {
  const router = useRouter();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const redirectDesktop = () => {
      if (desktop.matches) router.replace("/");
    };
    redirectDesktop();
    desktop.addEventListener("change", redirectDesktop);
    return () => desktop.removeEventListener("change", redirectDesktop);
  }, [router]);

  return (
    <div className="md:hidden">
      <AllServicesWorkspace />
    </div>
  );
}
