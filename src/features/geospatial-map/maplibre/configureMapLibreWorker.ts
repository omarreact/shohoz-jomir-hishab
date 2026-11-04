"use client";

import { setWorkerUrl } from "maplibre-gl";

let configured = false;

/**
 * MapLibre GL JS v6 needs its ESM worker URL registered by bundlers.
 * Next.js (Webpack/Turbopack) resolves this URL to its emitted, hashed asset.
 * Configure both GIS views identically before constructing either map.
 */
export function configureMapLibreWorker(): void {
  if (configured) return;
  setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
  configured = true;
}
