"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const PlotMap = dynamic(() => import("@/src/shared/components/PlotMap"), {
  ssr: false,
});

/** Centroid of the first ring (lng/lat order from ArcGIS rings). */
function ringCentroid(
  rings: number[][][] | undefined,
): { lat: number; lng: number } | null {
  const ring = rings?.[0];
  if (!ring?.length) return null;
  let sumLng = 0;
  let sumLat = 0;
  let n = 0;
  for (const pt of ring) {
    if (pt.length < 2) continue;
    sumLng += pt[0];
    sumLat += pt[1];
    n += 1;
  }
  return n ? { lng: sumLng / n, lat: sumLat / n } : null;
}

/**
 * Only MS plots that cover the selected RS plot (point-in-polygon at RS centroid).
 * Does not load all nearby MS parcels in a bounding box.
 */
export default function MsAwarePlotMap({
  feature,
}: {
  feature: RajukPlotFeature;
  features?: RajukPlotFeature[];
}) {
  const [msFeatures, setMsFeatures] = useState<RajukPlotFeature[]>([]);
  const [loadingMs, setLoadingMs] = useState(false);

  useEffect(() => {
    if (!feature?.geometry?.rings?.length) {
      setMsFeatures([]);
      return;
    }

    const c = ringCentroid(feature.geometry.rings);
    if (!c) {
      setMsFeatures([]);
      return;
    }

    let cancelled = false;
    setLoadingMs(true);

    // Identify at RS centroid → only MS polygons that contain this RS plot location
    const q = new URLSearchParams({
      action: "identify",
      lat: String(c.lat),
      lng: String(c.lng),
    });

    void fetch(`/api/rajuk/query?${q}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "MS identify failed");
        return d;
      })
      .then((d) => {
        if (cancelled) return;
        const all = (d.features ?? []) as RajukPlotFeature[];
        // Keep only MS-layer rows (RS row is already shown as selected)
        const msOnly = all.filter((f) => {
          const a = f.attributes as Record<string, unknown>;
          return (
            a._layer_source === "ms" ||
            a.plot_kind === "ms" ||
            (a.ms_plot_no && !a.rs_plot_no)
          );
        });
        setMsFeatures(msOnly);
      })
      .catch(() => {
        if (!cancelled) setMsFeatures([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [feature]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2">
        {loadingMs ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-violet-700">
            <Loader2 size={13} className="animate-spin" />
            MS প্লট খোঁজা হচ্ছে…
          </span>
        ) : msFeatures.length > 0 ? (
          <span className="text-xs font-medium text-violet-700">
            {msFeatures.length}টি MS প্লট (এই RS এর)
          </span>
        ) : null}
      </div>
      <PlotMap feature={feature} features={[feature, ...msFeatures]} />
    </div>
  );
}
