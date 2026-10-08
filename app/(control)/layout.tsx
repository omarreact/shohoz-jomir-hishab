import type { ReactNode } from "react";

/** Admin has its own RBAC-protected dashboard layout and sidebar. */
export default function ControlLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
