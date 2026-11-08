"use client";

import { setWorkerUrl } from "maplibre-gl";

let configured = false;

/**
 * Register the v6 ESM worker once for both GIS map clients.
 * Webpack emits the worker asset from this static URL reference.
 */
export function configureMapLibreWorker(): void {
  if (configured) return;
  setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
  configured = true;
}
