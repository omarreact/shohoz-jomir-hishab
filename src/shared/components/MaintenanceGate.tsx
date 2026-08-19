"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MaintenanceAuthGate = dynamic(() => import("./MaintenanceAuthGate"), {
  ssr: false,
  loading: () => null,
});

export default function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/public/maintenance", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.maintenanceMode === true) setMaintenance(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return maintenance ? <MaintenanceAuthGate /> : <>{children}</>;
}
