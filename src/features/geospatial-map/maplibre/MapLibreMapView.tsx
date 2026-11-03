"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import type { Map as MapLibreInstance } from "maplibre-gl";
import MapLibreMapViewV3 from "./MapLibreMapViewV3";
import { getBoundMap } from "./mapViewport";

type V3Props = ComponentProps<typeof MapLibreMapViewV3>;
type Props = Omit<V3Props, "mapRef">;

/**
 * Compatibility adapter: the existing map controller still owns the MapLibre
 * instance and all RS/MS/API behaviour. The refreshed UI resolves that already-
 * bound instance after render only for independent drawing, zoom, pitch and
 * scale controls. No cadastral source or API contract is changed here.
 */
export default function MapLibreMapView(props: Props) {
  const mapRef = useRef<MapLibreInstance | null>(null);

  useEffect(() => {
    mapRef.current = getBoundMap(props.containerRef.current) ?? null;
  }, [props.containerRef, props.mapReady]);

  return <MapLibreMapViewV3 {...props} mapRef={mapRef} />;
}
