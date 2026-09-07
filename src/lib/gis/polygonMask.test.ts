import { rasterizePolygonMask } from "./polygonMask";
import { lngLatTo3857 } from "./webMercatorTiles";

describe("polygon raster mask (exact Mouza clip invariant)", () => {
  it("fills interior of a simple square ring and leaves exterior empty", () => {
    const cx = 90.4;
    const cy = 23.8;
    const d = 0.0005;
    const ring = [
      [cx - d, cy - d],
      [cx + d, cy - d],
      [cx + d, cy + d],
      [cx - d, cy + d],
      [cx - d, cy - d],
    ];

    // EPSG:3857 Y grows northward while raster row Y grows downward. The
    // rasterizer therefore expects originY to be the northern/top-left edge,
    // matching tileOrigin3857() used by the production Mouza exporter.
    const [x0, originY] = lngLatTo3857(cx - d * 2, cy + d * 2);
    const [x1] = lngLatTo3857(cx + d * 2, cy - d * 2);
    const resolution = (x1 - x0) / 64;
    const width = 64;
    const height = 64;
    const originX = x0;

    const mask = rasterizePolygonMask({
      rings: [ring],
      width,
      height,
      originX,
      originY,
      resolution,
    });

    expect(mask.length).toBe(width * height);
    const filled = mask.reduce((n, v) => n + (v ? 1 : 0), 0);
    expect(filled).toBeGreaterThan(10);
    expect(filled).toBeLessThan(width * height);
    expect(mask[0]).toBe(0);
  });

  it("returns empty mask when rings are invalid", () => {
    const mask = rasterizePolygonMask({
      rings: [[[0, 0], [1, 1]]],
      width: 16,
      height: 16,
      originX: 0,
      originY: 0,
      resolution: 1,
    });
    expect(mask.every((v) => v === 0)).toBe(true);
  });
});
