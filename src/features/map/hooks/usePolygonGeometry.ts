import { useState, useEffect } from "react";

/**
 * Parses ESRI-style geometry rings into Leaflet-compatible coordinates.
 */
export function usePolygonGeometry(plotData: any): [number, number][] | null {
  const [polygonCoords, setPolygonCoords] = useState<[number, number][] | null>(
    null,
  );

  useEffect(() => {
    if (plotData?.geometry?.rings && plotData.geometry.rings.length > 0) {
      const ring = plotData.geometry.rings[0];
      const coords = ring.map(
        (point: number[]) => [point[1], point[0]] as [number, number],
      );
      setPolygonCoords(coords);
    } else {
      setPolygonCoords(null);
    }
  }, [plotData]);

  return polygonCoords;
}
