/**
 * Rasterize WGS84 rings onto an EPSG:3857 pixel grid (even-odd fill).
 * Rings are [lng, lat][]; grid origin is top-left in 3857.
 */

import { lngLatTo3857 } from "./webMercatorTiles";

export function rasterizePolygonMask(opts: {
  rings: number[][][];
  width: number;
  height: number;
  originX: number;
  originY: number;
  resolution: number;
}): Uint8Array {
  const { rings, width, height, originX, originY, resolution } = opts;
  const mask = new Uint8Array(width * height);

  const pixelRings: number[][][] = [];
  for (const ring of rings) {
    const pr: number[][] = [];
    for (const c of ring) {
      const lng = Number(c[0]);
      const lat = Number(c[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      const [x, y] = lngLatTo3857(lng, lat);
      const px = (x - originX) / resolution;
      const py = (originY - y) / resolution;
      pr.push([px, py]);
    }
    if (pr.length >= 3) pixelRings.push(pr);
  }
  if (!pixelRings.length) return mask;

  let minY = height;
  let maxY = 0;
  for (const ring of pixelRings) {
    for (const [, py] of ring) {
      minY = Math.min(minY, Math.floor(py));
      maxY = Math.max(maxY, Math.ceil(py));
    }
  }
  minY = Math.max(0, minY);
  maxY = Math.min(height - 1, maxY);

  for (let y = minY; y <= maxY; y++) {
    const ys = y + 0.5;
    const nodes: number[] = [];
    for (const ring of pixelRings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const yi = ring[i][1];
        const yj = ring[j][1];
        if ((yi > ys) !== (yj > ys)) {
          const xi = ring[i][0];
          const xj = ring[j][0];
          const x = xi + ((ys - yi) * (xj - xi)) / (yj - yi);
          nodes.push(x);
        }
      }
    }
    nodes.sort((a, b) => a - b);
    for (let n = 0; n + 1 < nodes.length; n += 2) {
      let x0 = Math.ceil(nodes[n]);
      let x1 = Math.floor(nodes[n + 1]);
      if (x1 < 0 || x0 >= width) continue;
      x0 = Math.max(0, x0);
      x1 = Math.min(width - 1, x1);
      const row = y * width;
      for (let x = x0; x <= x1; x++) mask[row + x] = 1;
    }
  }
  return mask;
}
