import type { ReactNode } from "react";
import ImmersiveGlobalHeader from "@/src/shared/components/ImmersiveGlobalHeader";

/** Fullscreen maps share global navigation; standalone certificate editors stay print-isolated. */
export default function ImmersiveLayout({ children }: { children: ReactNode }) {
  return <><ImmersiveGlobalHeader />{children}</>;
}
