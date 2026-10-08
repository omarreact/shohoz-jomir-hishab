import type { ReactNode } from "react";

/** Fullscreen maps and standalone certificate editors own their viewport. */
export default function ImmersiveLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
