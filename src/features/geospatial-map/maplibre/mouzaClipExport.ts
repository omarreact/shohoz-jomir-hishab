import type { Map as MapLibreMap } from "maplibre-gl";
import type { Position } from "geojson";

export type Ring = Position[];

export interface MouzaClipExportOptions {
  width?: number;
  height?: number;
  filename?: string;
  /** Exterior rings in [lng, lat] order (WGS84). Only these pixels are kept. */
  clipRings: Ring[];
  paddingPx?: number;
}

function waitForMapIdle(map: MapLibreMap, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    map.once("idle", finish);
    map.triggerRepaint();
    window.setTimeout(finish, timeoutMs);
  });
}

function ringBounds(rings: Ring[]): { west: number; south: number; east: number; north: number } | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  let any = false;
  for (const ring of rings) {
    for (const coord of ring) {
      const lng = Number(coord[0]);
      const lat = Number(coord[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      any = true;
      west = Math.min(west, lng);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      north = Math.max(north, lat);
    }
  }
  if (!any) return null;
  return { west, south, east, north };
}

/**
 * High-resolution MapLibre export clipped to exact Mouza polygon rings.
 * Does not use html2canvas. Uses native WebGL canvas + destination-in mask.
 * Geographic correctness requires that map sources already contain only the selected Mouza.
 */
export async function exportMouzaClippedPng(
  map: MapLibreMap,
  options: MouzaClipExportOptions,
): Promise<void> {
  const width = Math.max(1024, Math.min(options.width ?? 3840, 7680));
  const height = Math.max(576, Math.min(options.height ?? 2160, 4320));
  const filename = options.filename ?? "landbd-mouza.png";
  const rings = options.clipRings.filter((r) => Array.isArray(r) && r.length >= 3);
  if (!rings.length) {
    throw new Error("মৌজার সীমানা পাওয়া যায়নি — ডাউনলোড করা যায়নি");
  }

  const bounds = ringBounds(rings);
  if (!bounds) throw new Error("মৌজার সীমানা অবৈধ");

  const container = map.getContainer();
  const canvas = map.getCanvas();
  const previousWidth = container.style.width;
  const previousHeight = container.style.height;
  const previousPixelRatio = map.getPixelRatio();

  try {
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    map.setPixelRatio(1);
    map.resize();

    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      { padding: options.paddingPx ?? 48, duration: 0, maxZoom: 19 },
    );
    await waitForMapIdle(map);

    const src = canvas;
    const out = document.createElement("canvas");
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    ctx.drawImage(src, 0, 0);

    // Build exact polygon mask in CSS pixel space (MapLibre canvas may be DPR-scaled).
    const dpr = src.width / Math.max(1, container.clientWidth);
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    for (const ring of rings) {
      let started = false;
      for (const coord of ring) {
        const lng = Number(coord[0]);
        const lat = Number(coord[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
        const pt = map.project([lng, lat]);
        const x = pt.x * dpr;
        const y = pt.y * dpr;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (started) ctx.closePath();
    }
    ctx.fillStyle = "#000";
    ctx.fill("evenodd");
    ctx.restore();

    const dataUrl = out.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
  } finally {
    container.style.width = previousWidth;
    container.style.height = previousHeight;
    map.setPixelRatio(previousPixelRatio);
    map.resize();
  }
}
