import type { ReactNode } from "react";

/** Login, maintenance and access errors never receive public site chrome. */
export default function SystemLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
