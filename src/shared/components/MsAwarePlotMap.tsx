"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const PlotMap = dynamic(() => import("@/src/shared/components/PlotMap"), {
  ssr: false,
});

function envelopeFromRings(
  rings: number[][][] | undefined,
  pad = 0.0008,
): { xmin: number; ymin: number; xmax: number; ymax: number } | null {
  if (!rings?.length) return null;
  let xmin = Infinity,
    ymin = Infinity,
    xmax = -Infinity,
    ymax = -Infinity;
  for (const ring of rings) {
    for (const pt of ring) {
      if (pt.length < 2) continue;
      const [lng, lat] = pt;
      if (lng < xmin) xmin = lng;
      if (lng > xmax) xmax = lng;
      if (lat < ymin) ymin = lat;
      if (lat > ymax) ymax = lat;
    }
  }
  if (!Number.isFinite(xmin)) return null;
  return {
    xmin: xmin - pad,
    ymin: ymin - pad,
    xmax: xmax + pad,
    ymax: ymax + pad,
  };
}

/**
 * Wraps PlotMap: when an RS feature is selected, loads nearby MS plots
 * via FeatureServer/5 extent query and overlays them (purple) on the map.
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
    const env = envelopeFromRings(feature.geometry.rings);
    if (!env) {
      setMsFeatures([]);
      return;
    }

    let cancelled = false;
    setLoadingMs(true);
    const q = new URLSearchParams({
      action: "extent",
      kind: "ms",
      xmin: String(env.xmin),
      ymin: String(env.ymin),
      xmax: String(env.xmax),
      ymax: String(env.ymax),
      limit: "80",
    });

    void fetch(`/api/rajuk/query?${q}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "MS extent query failed");
        return d;
      })
      .then((d) => {
        if (cancelled) return;
        setMsFeatures((d.features ?? []) as RajukPlotFeature[]);
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
            Loading MS plots…
          </span>
        ) : msFeatures.length > 0 ? (
          <span className="text-xs font-medium text-violet-700">
            {msFeatures.length} MS plot{msFeatures.length === 1 ? "" : "s"} nearby
          </span>
        ) : null}
      </div>
      <PlotMap feature={feature} features={[feature, ...msFeatures]} />
    </div>
  );
}
