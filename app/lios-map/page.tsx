"use client";

import { useEffect, useState } from "react";

/**
 * LIOS / RAJUK GIS map page.
 *
 * The authoritative map implementation is index-6.html from
 * LandBD-AGIS-CHECKED. It is intentionally isolated on this new route so
 * the existing LandBD map remains untouched while the LIOS map is migrated.
 */
export default function LiosMapPage() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc("https://raw.githubusercontent.com/omarreact/LandBD-AGIS-CHECKED/main/index-6.html");
  }, []);

  return (
    <main className="fixed inset-0 z-[2000] bg-white">
      {src ? (
        <iframe
          title="LandBD RAJUK Geospatial Intelligence Map"
          src={src}
          className="h-full w-full border-0"
          allow="geolocation"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-slate-600">
          RAJUK map loading…
        </div>
      )}
    </main>
  );
}
