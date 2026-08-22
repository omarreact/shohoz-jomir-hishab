"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const PlotMap = dynamic(() => import("@/src/shared/components/PlotMap"), {
  ssr: false,
});

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

function envelopeFromRings(
  rings: number[][][] | undefined,
  pad = 0.00015,
): { xmin: number; ymin: number; xmax: number; ymax: number } | null {
  if (!rings?.length) return null;
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
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

/** Ray-casting: is (lng,lat) inside polygon ring (lng/lat order)? */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, rings: number[][][]): boolean {
  const outer = rings[0];
  if (!outer?.length || !pointInRing(lng, lat, outer)) return false;
  for (let h = 1; h < rings.length; h++) {
    if (rings[h]?.length && pointInRing(lng, lat, rings[h])) return false;
  }
  return true;
}

function isMsFeature(f: RajukPlotFeature): boolean {
  const a = f.attributes as Record<string, unknown>;
  return (
    a._layer_source === "ms" ||
    a.plot_kind === "ms" ||
    Boolean(a.ms_plot_no && !a.rs_plot_no)
  );
}

/**
 * Loads every MS plot whose centroid falls inside the selected RS polygon
 * (extent query + client-side point-in-polygon filter).
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

    const rsRings = feature.geometry.rings;
    let cancelled = false;
    setLoadingMs(true);

    const q = new URLSearchParams({
      action: "extent",
      kind: "ms",
      xmin: String(env.xmin),
      ymin: String(env.ymin),
      xmax: String(env.xmax),
      ymax: String(env.ymax),
      limit: "400",
    });

    void fetch(`/api/rajuk/query?${q}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "MS extent query failed");
        return d;
      })
      .then((d) => {
        if (cancelled) return;
        const all = (d.features ?? []) as RajukPlotFeature[];
        const inside = all.filter((f) => {
          if (!isMsFeature(f) || !f.geometry?.rings?.length) return false;
          const c = ringCentroid(f.geometry.rings);
          if (!c) return false;
          return pointInPolygon(c.lng, c.lat, rsRings);
        });
        setMsFeatures(inside);
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
            {msFeatures.length}টি MS প্লট (এই RS এর ভিতরে)
          </span>
        ) : (
          <span className="text-xs text-slate-400">এই RS এর ভিতরে MS পাওয়া যায়নি</span>
        )}
      </div>
      <PlotMap feature={feature} features={[feature, ...msFeatures]} />
    </div>
  );
}
