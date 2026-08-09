import { useState, useEffect } from "react";
import L from "leaflet";

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
      const coords = ring.map((point: number[]) => {
        let [x, y] = point;
        if (Math.abs(x) > 180 || Math.abs(y) > 90) {
          const latLng = L.CRS.EPSG3857.unproject(L.point(x, y));
          return [latLng.lat, latLng.lng] as [number, number];
        }
        return [y, x] as [number, number];
      });
      setPolygonCoords(coords);
    } else {
      setPolygonCoords(null);
    }
  }, [plotData]);

  return polygonCoords;
}
