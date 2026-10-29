import { redirect } from "next/navigation";

export default function LegacyNidDobPage() {
  redirect("/admin/nid-verification");
}
