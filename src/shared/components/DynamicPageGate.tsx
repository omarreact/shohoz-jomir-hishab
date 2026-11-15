"use client";

import React from "react";

type DynamicPageGateProps = {
  pageId: string;
  featureName: string;
  children: React.ReactNode;
};

/**
 * Backward-compatible wrapper kept for pages that already import it.
 * Runtime page-access enforcement is centralized in proxy.ts, which resolves
 * the current page policy before the route renders. ConditionalShell only
 * controls application chrome/layout; it is not an authorization boundary.
 */
export default function DynamicPageGate({ children }: DynamicPageGateProps) {
  return <>{children}</>;
}
