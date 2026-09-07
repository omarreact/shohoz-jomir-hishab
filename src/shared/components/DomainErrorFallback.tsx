"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { Card, CardContent } from "@/src/shared/ui/Card";
import { Alert, AlertDescription, AlertTitle } from "@/src/shared/ui/alert";

type DomainErrorFallbackProps = {
  domain: string;
  domainBn: string;
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Isolated domain error UI. A failure in one product domain must not
 * take down unrelated routes (Maps vs Khotiyan vs Faraez vs Blog).
 */
export default function DomainErrorFallback({
  domain,
  domainBn,
  error,
  reset,
}: DomainErrorFallbackProps) {
  useEffect(() => {
    console.error(`[${domain}] page error:`, error);
  }, [domain, error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-muted/10 p-4">
      <Card className="w-full max-w-xl border-red-500/20 shadow-xl">
        <CardContent className="flex flex-col items-center pt-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle size={32} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">সমস্যা হয়েছে</h2>
          <p className="mb-6 text-muted-foreground">
            {domainBn} লোড করতে একটি অপ্রত্যাশিত ত্রুটি হয়েছে। অন্যান্য টুল স্বাভাবিকভাবে কাজ করবে।
          </p>
          <Alert variant="destructive" className="mb-6 w-full text-left">
            <AlertTitle>Error ({domain})</AlertTitle>
            <AlertDescription className="mt-2 break-all font-mono text-xs">
              {error.message || "Unknown rendering error"}
            </AlertDescription>
          </Alert>
          <Button onClick={() => reset()} size="lg" className="flex items-center gap-2">
            <RefreshCcw size={16} />
            আবার চেষ্টা করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
