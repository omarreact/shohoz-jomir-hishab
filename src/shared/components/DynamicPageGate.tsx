"use client";

import React from "react";

type DynamicPageGateProps = {
  pageId: string;
  featureName: string;
  children: React.ReactNode;
};

/**
 * Backward-compatible wrapper kept for pages that already import it.
 * Access enforcement now lives centrally in PageAccessGate inside
 * ConditionalShell so every registered user-facing route follows the same
 * rules without duplicate network requests or conflicting decisions.
 */
export default function DynamicPageGate({ children }: DynamicPageGateProps) {
  return <>{children}</>;
}
