export interface Point {
  lat: number;
  lng: number;
}

export function esriRingsToLatLngs(rings: number[][][]): [number, number][][] {
  if (!rings || !rings.length) return [];
  return rings.map((ring) => ring.map((pt) => [pt[1], pt[0]] as [number, number]));
}

export function parseEsriGeometryToPoint(lng: number, lat: number, wkid: number = 4326): string {
  return JSON.stringify({
    x: lng,
    y: lat,
    spatialReference: { wkid },
  });
}

export function parseBoundsToEsriEnvelope(
  west: number,
  south: number,
  east: number,
  north: number,
  wkid: number = 4326
): string {
  return JSON.stringify({
    xmin: west,
    ymin: south,
    xmax: east,
    ymax: north,
    spatialReference: { wkid },
  });
}
