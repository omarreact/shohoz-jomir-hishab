"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/src/shared/ui/Card";
import { Button } from "@/src/shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/src/shared/ui/alert";

export default function KhatiyanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Khatiyan page crashed:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-muted/10">
      <Card className="max-w-xl w-full border-red-500/20 shadow-xl">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-foreground">Something went wrong!</h2>
          <p className="text-muted-foreground mb-6">
            We apologize, but an unexpected error occurred while loading the Khatiyan calculator.
          </p>

          <Alert variant="destructive" className="mb-6 text-left w-full">
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="font-mono text-xs mt-2 break-all">
              {error.message || "Unknown rendering error occurred."}
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => reset()} 
            className="flex items-center gap-2"
            size="lg"
          >
            <RefreshCcw size={16} />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
