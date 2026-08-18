"use client";

import { useEffect, useState } from "react";

/**
 * RAJUK-only public data workspace.
 *
 * The RAJUK/LIOS map is intentionally isolated here. This route does not
 * expose RAJUK controls on the land-measurement or khatiyan calculators.
 * The embedded map is the project's existing index-6.html implementation.
 */
export default function RajukTestPage() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(
      "https://raw.githubusercontent.com/omarreact/LandBD-AGIS-CHECKED/main/index-6.html",
    );
  }, []);

  return (
    <main className="fixed inset-0 z-[2000] bg-white">
      {src ? (
        <iframe
          title="LandBD RAJUK Public Data Map"
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
