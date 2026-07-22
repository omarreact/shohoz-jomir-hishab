"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="bg-[var(--bg)] min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="bg-destructive/10 p-4 rounded-full">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          কোথাও কোনো সমস্যা হয়েছে!
        </h2>
        <p className="text-[var(--text-secondary)]">
          {error.message || "পেইজটি লোড করার সময় একটি ত্রুটি দেখা দিয়েছে।"}
        </p>
      </div>
      <Button
        onClick={() => reset()}
        variant="default"
        className="mt-4"
      >
        পুনরায় চেষ্টা করুন
      </Button>
    </div>
  );
}
