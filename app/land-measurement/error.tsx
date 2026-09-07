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
      domain="LandMeasurement"
      domainBn="জমি পরিমাপ"
      error={error}
      reset={reset}
    />
  );
}
