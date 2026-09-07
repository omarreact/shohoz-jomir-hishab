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
      domain="Blog"
      domainBn="ব্লগ"
      error={error}
      reset={reset}
    />
  );
}
