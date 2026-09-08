import { redirect } from "next/navigation";

/** Legacy short URL → canonical product map. */
export default function LegacyMapPage() {
  redirect("/dap-map");
}
