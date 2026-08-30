/** Web Mercator (EPSG:3857) / XYZ tile math matching ArcGIS tileInfo origin. */

export const WEB_MERCATOR_MAX = 20037508.342789244;
/** ArcGIS RS tileInfo LOD level 0 resolution (matches RAJUK service metadata). */
export const LOD0_RESOLUTION = 156543.033928;

export type BBox3857 = { xmin: number; ymin: number; xmax: number; ymax: number };
export type TileCoord = { z: number; x: number; y: number };

export function lngLatTo3857(lng: number, lat: number): [number, number] {
  const x = (lng * WEB_MERCATOR_MAX) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * WEB_MERCATOR_MAX) / 180;
  return [x, y];
}

export function resolutionForZoom(z: number): number {
  return LOD0_RESOLUTION / 2 ** z;
}

export function tileRangeForBbox(
  bbox: BBox3857,
  z: number,
  tileSize = 256,
): { minX: number; minY: number; maxX: number; maxY: number; resolution: number } {
  const res = resolutionForZoom(z);
  const n = 2 ** z;
  const minX = Math.floor((bbox.xmin + WEB_MERCATOR_MAX) / (res * tileSize));
  const maxX = Math.floor((bbox.xmax + WEB_MERCATOR_MAX) / (res * tileSize));
  const minY = Math.floor((WEB_MERCATOR_MAX - bbox.ymax) / (res * tileSize));
  const maxY = Math.floor((WEB_MERCATOR_MAX - bbox.ymin) / (res * tileSize));
  return {
    minX: Math.max(0, minX),
    maxX: Math.min(n - 1, maxX),
    minY: Math.max(0, minY),
    maxY: Math.min(n - 1, maxY),
    resolution: res,
  };
}

export function tileOrigin3857(z: number, x: number, y: number, tileSize = 256): { originX: number; originY: number; resolution: number } {
  const res = resolutionForZoom(z);
  const originX = -WEB_MERCATOR_MAX + x * tileSize * res;
  const originY = WEB_MERCATOR_MAX - y * tileSize * res;
  return { originX, originY, resolution: res };
}

export function chooseZoomForBudget(
  bbox: BBox3857,
  maxDim: number,
  maxZoom: number,
  minZoom = 12,
  tileSize = 256,
): number {
  for (let z = maxZoom; z >= minZoom; z--) {
    const res = resolutionForZoom(z);
    const w = Math.ceil((bbox.xmax - bbox.xmin) / res);
    const h = Math.ceil((bbox.ymax - bbox.ymin) / res);
    if (w <= maxDim && h <= maxDim) return z;
  }
  return minZoom;
}

export function ringsToBbox3857(rings: number[][][]): BBox3857 | null {
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  let any = false;
  for (const ring of rings) {
    for (const c of ring) {
      const lng = Number(c[0]);
      const lat = Number(c[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      const [x, y] = lngLatTo3857(lng, lat);
      any = true;
      xmin = Math.min(xmin, x);
      ymin = Math.min(ymin, y);
      xmax = Math.max(xmax, x);
      ymax = Math.max(ymax, y);
    }
  }
  if (!any) return null;
  const pad = Math.max((xmax - xmin) * 0.002, (ymax - ymin) * 0.002, 2);
  return { xmin: xmin - pad, ymin: ymin - pad, xmax: xmax + pad, ymax: ymax + pad };
}
