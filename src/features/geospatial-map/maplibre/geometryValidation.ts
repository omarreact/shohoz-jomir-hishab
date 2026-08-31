type Coordinate = [number, number];
type Ring = readonly Coordinate[];

const EPSILON = 1e-12;
const MAX_EXACT_INTERSECTION_VERTICES = 2500;

function orientation(a: Coordinate, b: Coordinate, c: Coordinate): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a: Coordinate, b: Coordinate, p: Coordinate): boolean {
  return (
    p[0] >= Math.min(a[0], b[0]) - EPSILON &&
    p[0] <= Math.max(a[0], b[0]) + EPSILON &&
    p[1] >= Math.min(a[1], b[1]) - EPSILON &&
    p[1] <= Math.max(a[1], b[1]) + EPSILON
  );
}

function segmentsIntersect(a: Coordinate, b: Coordinate, c: Coordinate, d: Coordinate): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (Math.abs(o1) <= EPSILON && onSegment(a, b, c)) return true;
  if (Math.abs(o2) <= EPSILON && onSegment(a, b, d)) return true;
  if (Math.abs(o3) <= EPSILON && onSegment(c, d, a)) return true;
  if (Math.abs(o4) <= EPSILON && onSegment(c, d, b)) return true;

  return ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0));
}

function samePoint(a: Coordinate, b: Coordinate): boolean {
  return Math.abs(a[0] - b[0]) <= EPSILON && Math.abs(a[1] - b[1]) <= EPSILON;
}

function signedArea(ring: Ring): number {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return area / 2;
}

/**
 * Lightweight cadastral polygon topology guard.
 * Coordinates are already validated by mapUtils; this layer additionally
 * requires closure, non-zero area and no self-intersection for normal-sized
 * rings. Very large rings retain the structural checks to avoid blocking the
 * WebGL thread with quadratic work on unusually detailed survey sheets.
 */
export function isValidPolygonRings(rings: readonly Ring[]): boolean {
  if (rings.length === 0) return false;

  for (const ring of rings) {
    if (ring.length < 4 || !samePoint(ring[0], ring[ring.length - 1])) return false;
    for (let i = 1; i < ring.length; i += 1) {
      if (samePoint(ring[i - 1], ring[i])) return false;
    }
    if (Math.abs(signedArea(ring)) <= EPSILON) return false;

    if (ring.length > MAX_EXACT_INTERSECTION_VERTICES) continue;

    const segmentCount = ring.length - 1;
    for (let i = 0; i < segmentCount; i += 1) {
      const a = ring[i];
      const b = ring[i + 1];
      for (let j = i + 1; j < segmentCount; j += 1) {
        // Adjacent segments share their endpoint by design.
        if (j === i + 1 || (i === 0 && j === segmentCount - 1)) continue;
        if (segmentsIntersect(a, b, ring[j], ring[j + 1])) return false;
      }
    }
  }

  return true;
}
