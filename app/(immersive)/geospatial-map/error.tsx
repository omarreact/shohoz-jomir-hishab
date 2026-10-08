"use client";

import DomainErrorFallback from "@/src/shared/components/DomainErrorFallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DomainErrorFallback
      domain="Maps"
      domainBn="GIS মানচিত্র"
      error={error}
      reset={reset}
    />
  );
}
