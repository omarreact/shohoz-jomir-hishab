import { redirect } from "next/navigation";

/** Legacy LIOS entry — features live on the unified urban planning map. */
export default function LiosMapPage() {
  redirect("/geospatial-map");
}
