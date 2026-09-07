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
      domain="Khatiyan"
      domainBn="খতিয়ান হিসাব"
      error={error}
      reset={reset}
    />
  );
}
