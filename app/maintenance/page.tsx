import type { Metadata } from "next";
import { redirect } from "next/navigation";

import MaintenanceScreen from "@/src/shared/components/MaintenanceScreen";
import { getSiteAccessPolicy } from "@/src/modules/access/server/siteAccessPolicy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "সাময়িক রক্ষণাবেক্ষণ | LandBD",
  description: "LandBD বর্তমানে সাময়িক রক্ষণাবেক্ষণে রয়েছে।",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MaintenancePage() {
  const policy = await getSiteAccessPolicy();

  if (!policy.maintenanceMode) {
    redirect("/");
  }

  return <MaintenanceScreen />;
}
