import { redirect } from "next/navigation";

/** Compatibility URL → canonical LandBD full-screen GIS map. */
export default function DapMapPage() {
  redirect("/geospatial-map");
}
