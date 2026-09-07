"use client";

import { useMemo, type ComponentProps, type RefObject } from "react";
import type { Map as MapLibreInstance } from "maplibre-gl";
import MapLibreMapViewV2 from "./MapLibreMapViewV2";
import { getBoundMap } from "./mapViewport";

type V2Props = ComponentProps<typeof MapLibreMapViewV2>;
type Props = Omit<V2Props, "mapRef">;

/**
 * Compatibility adapter: the existing map controller still owns the MapLibre
 * instance and all RS/MS/API behaviour. The refreshed UI reads that already-
 * bound instance only for independent drawing, zoom, pitch and scale controls.
 */
export default function MapLibreMapView(props: Props) {
  const mapRef = useMemo<RefObject<MapLibreInstance | null>>(
    () => ({ current: getBoundMap(props.containerRef.current) ?? null }),
    [props.containerRef, props.mapReady],
  );

  return <MapLibreMapViewV2 {...props} mapRef={mapRef} />;
}
