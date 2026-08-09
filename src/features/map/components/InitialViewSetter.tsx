import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import L from "leaflet";

export function InitialViewSetter({ initialData }: { initialData?: any }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (!initialData) return;
    try {
      // @ts-ignore
      const bounds = L.latLngBounds([]);
      const processGeometry = (geom: any) => {
        if (geom?.rings) {
          geom.rings.forEach((ring: any) => {
            ring.forEach((pt: any) => {
              let [x, y] = pt;
              // If coordinates are in Web Mercator (meters), convert to LatLng
              if (Math.abs(x) > 180 || Math.abs(y) > 90) {
                const latLng = L.CRS.EPSG3857.unproject(L.point(x, y));
                bounds.extend([latLng.lat, latLng.lng]);
              } else {
                bounds.extend([y, x]);
              }
            });
          });
        }
      };

      if (Array.isArray(initialData) && initialData.length > 0) {
        initialData.forEach((f) => processGeometry(f.geometry));
      } else if (initialData.geometry) {
        processGeometry(initialData.geometry);
      }

      if (bounds.isValid()) {
        map.flyToBounds(bounds, { maxZoom: 18, duration: 1.5, easeLinearity: 0.25 });
      }
    } catch (e) {
      console.error("Bounds error", e);
    }
  }, [initialData, map]);
  return null;
}
