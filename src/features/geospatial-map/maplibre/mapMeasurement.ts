import type { Feature, FeatureCollection, Geometry, LineString, Point, Polygon } from "geojson";
import { areaFromGisRings, areaFromSquareMeters } from "@/src/modules/land/plotArea";

export type MeasurementMode = "point" | "line" | "polygon" | "rectangle" | "distance";
export type LngLatTuple = [number, number];

const EARTH_RADIUS_M = 6_371_008.8;
const EMPTY_COLLECTION: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: [],
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function segmentDistanceMeters(a: LngLatTuple, b: LngLatTuple): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function polylineDistanceMeters(points: LngLatTuple[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += segmentDistanceMeters(points[index - 1], points[index]);
  }
  return total;
}

export function closeRing(points: LngLatTuple[]): LngLatTuple[] {
  if (points.length < 3) return [];
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return [...points];
  return [...points, first];
}

export function rectangleRing(a: LngLatTuple, b: LngLatTuple): LngLatTuple[] {
  return [
    [a[0], a[1]],
    [b[0], a[1]],
    [b[0], b[1]],
    [a[0], b[1]],
    [a[0], a[1]],
  ];
}

export function measurementAreaSquareMeters(
  mode: MeasurementMode,
  points: LngLatTuple[],
): number {
  let ring: LngLatTuple[] = [];
  if (mode === "polygon") ring = closeRing(points);
  if (mode === "rectangle" && points.length >= 2) ring = rectangleRing(points[0], points[1]);
  if (ring.length < 4) return 0;
  return areaFromGisRings([ring as number[][]]);
}

export type MeasurementSummary = {
  point?: LngLatTuple;
  distanceMeters: number;
  areaSquareMeters: number;
  area: ReturnType<typeof areaFromSquareMeters>;
};

export function summarizeMeasurement(
  mode: MeasurementMode,
  points: LngLatTuple[],
): MeasurementSummary {
  const distanceMeters =
    mode === "line" || mode === "distance" ? polylineDistanceMeters(points) : 0;
  const areaSquareMeters = measurementAreaSquareMeters(mode, points);
  return {
    point: mode === "point" ? points[0] : undefined,
    distanceMeters,
    areaSquareMeters,
    area: areaFromSquareMeters(areaSquareMeters),
  };
}

function pointFeatures(points: LngLatTuple[]): Array<Feature<Point>> {
  return points.map((coordinates, index) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: { index },
  }));
}

export function measurementFeatureCollection(
  mode: MeasurementMode,
  points: LngLatTuple[],
): FeatureCollection<Geometry> {
  if (!points.length) return EMPTY_COLLECTION;

  const features: Array<Feature<Geometry>> = [...pointFeatures(points)];

  if ((mode === "line" || mode === "distance") && points.length >= 2) {
    const line: Feature<LineString> = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: points },
      properties: { kind: "measurement-line" },
    };
    features.push(line);
  }

  if (mode === "polygon" && points.length >= 3) {
    const ring = closeRing(points);
    const polygon: Feature<Polygon> = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
      properties: { kind: "measurement-polygon" },
    };
    features.push(polygon);
  }

  if (mode === "rectangle" && points.length >= 2) {
    const ring = rectangleRing(points[0], points[1]);
    const polygon: Feature<Polygon> = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring] },
      properties: { kind: "measurement-rectangle" },
    };
    features.push(polygon);
  }

  return { type: "FeatureCollection", features };
}
