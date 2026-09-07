import {
  WEB_MERCATOR_MAX,
  LOD0_RESOLUTION,
  lngLatTo3857,
  resolutionForZoom,
  tileRangeForBbox,
  chooseZoomForBudget,
} from "./webMercatorTiles";

describe("Web Mercator tile math (EPSG:3857)", () => {
  it("projects Dhaka approximate center into valid 3857 range", () => {
    const [x, y] = lngLatTo3857(90.4125, 23.8103);
    expect(x).toBeGreaterThan(-WEB_MERCATOR_MAX);
    expect(x).toBeLessThan(WEB_MERCATOR_MAX);
    expect(y).toBeGreaterThan(-WEB_MERCATOR_MAX);
    expect(y).toBeLessThan(WEB_MERCATOR_MAX);
  });

  it("resolution halves each zoom step from LOD0", () => {
    expect(resolutionForZoom(0)).toBeCloseTo(LOD0_RESOLUTION, 6);
    expect(resolutionForZoom(1)).toBeCloseTo(LOD0_RESOLUTION / 2, 6);
    expect(resolutionForZoom(2)).toBeCloseTo(LOD0_RESOLUTION / 4, 6);
  });

  it("tile range covers bbox without inverted indices", () => {
    const [x, y] = lngLatTo3857(90.4, 23.8);
    const pad = 500;
    const bbox = { xmin: x - pad, ymin: y - pad, xmax: x + pad, ymax: y + pad };
    const range = tileRangeForBbox(bbox, 15);
    expect(range.maxX).toBeGreaterThanOrEqual(range.minX);
    expect(range.maxY).toBeGreaterThanOrEqual(range.minY);
  });

  it("chooseZoomForBudget stays within maxDim budget", () => {
    const [x, y] = lngLatTo3857(90.4, 23.8);
    const bbox = { xmin: x - 2000, ymin: y - 2000, xmax: x + 2000, ymax: y + 2000 };
    const maxDim = 2048;
    const zoom = chooseZoomForBudget(bbox, maxDim, 18);
    const res = resolutionForZoom(zoom);
    const width = Math.ceil((bbox.xmax - bbox.xmin) / res);
    const height = Math.ceil((bbox.ymax - bbox.ymin) / res);
    expect(Math.max(width, height)).toBeLessThanOrEqual(maxDim + 256);
  });
});
