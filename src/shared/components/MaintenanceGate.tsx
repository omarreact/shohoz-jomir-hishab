"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

function MaintenanceStatusLoading() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3faf6] px-4"
      role="status"
      aria-live="polite"
      aria-label="LandBD status checking"
    >
      <div className="absolute inset-0 opacity-[0.07] [background-image:url('/brand/brand-pattern.svg')] [background-size:420px]" />
      <div className="relative flex flex-col items-center gap-5 text-center">
        <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-5 shadow-xl shadow-emerald-950/10 backdrop-blur">
          <Image
            src="/brand/landbd-symbol.svg"
            alt="LandBD"
            width={72}
            height={72}
            priority
            className="h-16 w-16 motion-safe:animate-[maintenanceFloat_3s_ease-in-out_infinite]"
          />
        </div>

        <div className="w-44 overflow-hidden rounded-full bg-emerald-950/10">
          <div className="h-1.5 w-1/3 animate-[maintenanceSlide_1.6s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#006A3D] via-[#22A35A] to-[#E10600]" />
        </div>

        <p className="text-sm font-semibold text-slate-600">LandBD প্রস্তুত হচ্ছে…</p>
      </div>

      <style jsx global>{`
        @keyframes maintenanceFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes maintenanceSlide {
          0% {
            transform: translateX(-140%);
          }
          100% {
            transform: translateX(420%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [class*="maintenanceFloat"],
          [class*="maintenanceSlide"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const MaintenanceAuthGate = dynamic(() => import("./MaintenanceAuthGate"), {
  ssr: false,
  loading: () => <MaintenanceStatusLoading />,
});

export default function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [maintenance, setMaintenance] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/public/maintenance", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setMaintenance(data?.maintenanceMode === true);
      })
      .catch(() => {
        if (active) setMaintenance(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Never render the normal application until maintenance status is known.
  // This prevents the main UI from flashing briefly during reload/navigation.
  if (maintenance === null) return <MaintenanceStatusLoading />;

  return maintenance ? (
    <MaintenanceAuthGate>{children}</MaintenanceAuthGate>
  ) : (
    <>{children}</>
  );
}
