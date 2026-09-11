import { redirect } from "next/navigation";

/** Legacy short URL → canonical full GIS map. */
export default function LegacyMapPage() {
  redirect("/geospatial-map");
}
