"use client";

import type { ComponentProps } from "react";
import MapLibreMapViewV3 from "./MapLibreMapViewV3";

type Props = ComponentProps<typeof MapLibreMapViewV3>;

/** The controller supplies the actual MapLibre ref; no deferred ref lookup. */
export default function MapLibreMapView(props: Props) {
  return <MapLibreMapViewV3 {...props} />;
}
