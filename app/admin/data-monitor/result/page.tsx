"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_REGISTRY } from "../page";
import {
  Activity,
  ArrowLeft,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  AlertTriangle,
  Loader,
} from "lucide-react";
import Link from "next/link";
import DynamicApiTable from "@/components/features/admin/DynamicApiTable";
import { resolveApiRequestUrl } from "@/lib/api/rajukTiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface TestResult {
  apiIndex: number;
  name: string;
  endpoint: string;
  status: number;
  timeMs: number;
  data: unknown;
  error?: string;
  recordCount: number;
}

function CombinedResultContent() {
  const searchParams = useSearchParams();
  const apisParam = searchParams.get("apis");

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    const fetchApis = async () => {
      if (!apisParam) {
        setLoading(false);
        return;
      }

      const indices = apisParam
        .split(",")
        .map((n) => parseInt(n, 10))
        .filter((n) => !isNaN(n));
      if (indices.length === 0) {
        setLoading(false);
        return;
      }

      const startTime = performance.now();

      const fetchedResults = await Promise.all(
        indices.map(async (idx) => {
          const api = API_REGISTRY[idx];
          if (!api) return null;

          const startReqTime = performance.now();
          try {
            const urlToFetch = resolveApiRequestUrl(
              api.endpoint,
              window.location.origin,
            );

            const res = await fetch(urlToFetch);
            let jsonData = null;
            let recordCount = 0;

            try {
              jsonData = await res.json();

              // Try to determine record count
              if (Array.isArray(jsonData)) {
                recordCount = jsonData.length;
              } else if (jsonData && Array.isArray(jsonData.features)) {
                recordCount = jsonData.features.length; // ESRI format
              } else if (jsonData && Array.isArray(jsonData.data)) {
                recordCount = jsonData.data.length; // Common API format
              } else if (jsonData && typeof jsonData === "object") {
                recordCount = 1;
              }
            } catch (e) {
              const text = await res.text();
              jsonData = { rawText: text };
              recordCount = 1;
            }

            return {
              apiIndex: idx,
              name: api.name,
              endpoint: api.endpoint,
              status: res.status,
              timeMs: Math.round(performance.now() - startReqTime),
              data: jsonData,
              recordCount,
            };
          } catch (e: unknown) {
            return {
              apiIndex: idx,
              name: api?.name || "Unknown",
              endpoint: api?.endpoint || "",
              status: 500,
              timeMs: Math.round(performance.now() - startReqTime),
              data: null,
              error: e instanceof Error ? e.message : "Unknown error",
              recordCount: 0,
            };
          }
        }),
      );

      setResults(fetchedResults.filter((r) => r !== null) as TestResult[]);
      setTotalTime(Math.round(performance.now() - startTime));
      setLoading(false);
    };

    fetchApis();
  }, [apisParam]);

  if (!apisParam) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Alert variant="default" className="mb-6 bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>No APIs Selected</AlertTitle>
          <AlertDescription>
            You did not select any APIs to test. Please go back to the Data Monitor and select APIs.
          </AlertDescription>
        </Alert>
        <Link 
          href="/admin/data-monitor" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Link>
      </div>
    );
  }

  const successfulCount = results.filter((r) => r.status === 200).length;
  const failedCount = results.length - successfulCount;
  const totalRecords = results.reduce((acc, curr) => acc + curr.recordCount, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in visible">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/data-monitor"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back to Registry
          </Link>
          <h4 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Activity size={24} className="text-primary" />
            Combined API Viewer
          </h4>
          <p className="text-muted-foreground text-sm mt-1">
            Previewing multiple API responses in a unified dashboard.
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-primary font-medium bg-primary/10 px-4 py-2 rounded-full text-sm">
            <Loader className="h-4 w-4 animate-spin" /> Fetching APIs...
          </div>
        )}
      </div>

      {/* ── Dashboard Overview ── */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-muted-foreground text-xs font-semibold mb-2 flex items-center gap-1">
                <Terminal size={14} /> Selected APIs
              </div>
              <div className="text-2xl font-bold text-foreground">{results.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-muted-foreground text-xs font-semibold mb-2 flex items-center gap-1">
                <Database size={14} /> Total Records
              </div>
              <div className="text-2xl font-bold text-primary">
                {totalRecords.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-green-600 dark:text-green-400 text-xs font-semibold mb-2 flex items-center gap-1">
                <CheckCircle2 size={14} /> Successful
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {successfulCount}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-red-600 dark:text-red-400 text-xs font-semibold mb-2 flex items-center gap-1">
                <XCircle size={14} /> Failed
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 md:col-span-4 lg:col-span-1 bg-slate-900 text-white">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="text-slate-400 text-xs font-semibold mb-2 flex items-center gap-1">
                <Clock size={14} /> Execution Time
              </div>
              <div className="text-2xl font-bold">{totalTime} ms</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Results Tables ── */}
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground font-medium mt-4">
              Executing {apisParam?.split(",").length || 0} API requests in parallel...
            </p>
          </div>
        ) : (
          results.map((res, index) => (
            <Card key={index} className="overflow-hidden border-border/50 shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold mb-1">{res.name}</CardTitle>
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-[300px] md:max-w-md lg:max-w-2xl">
                    {res.endpoint}
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-xs text-muted-foreground font-semibold flex items-center">
                    <Clock size={12} className="mr-1" />
                    {res.timeMs} ms
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      res.status === 200 
                        ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    Status: {res.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {res.error ? (
                  <div className="p-6 bg-red-500/5 text-red-500 flex flex-col items-center justify-center text-center">
                    <AlertTriangle size={32} className="mb-3 opacity-80" />
                    <p className="font-semibold text-lg">{res.error}</p>
                  </div>
                ) : (
                  <DynamicApiTable data={res.data} apiName={res.name} />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function CombinedResultPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CombinedResultContent />
    </Suspense>
  );
}
