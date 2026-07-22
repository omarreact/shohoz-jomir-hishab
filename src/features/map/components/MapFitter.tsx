import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapFitterProps {
  positions: [number, number][];
}

/**
 * Centers the map on the given polygon bounds.
 */
export function MapFitter({ positions }: MapFitterProps) {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [map, positions]);

  return null;
}
