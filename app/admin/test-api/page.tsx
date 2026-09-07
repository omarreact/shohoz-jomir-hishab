"use client";

import React, { useState } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";
import { Button } from "@/src/shared/ui/button";
import { ShieldCheck, Globe, Loader2, Play } from "lucide-react";

export default function TestApiPage() {
  const { user, isLoggedIn, loading: authChecking } = useAuth();
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (authChecking) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  if (!isLoggedIn || !isStaffRole(user?.role)) {
    return <div className="p-8 text-center text-red-500">অননুমোদিত অ্যাক্সেস</div>;
  }

  const runTest = async (endpoint: string) => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">এপিআই টেস্টিং (API Testing)</h1>
        <p className="mt-1 text-sm text-slate-500">পাবলিক এবং প্রাইভেট সিস্টেম API চেক করুন।</p>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("public")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "public"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Globe size={18} />
          পাবলিক API
        </button>
        <button
          onClick={() => setActiveTab("private")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "private"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <ShieldCheck size={18} />
          প্রাইভেট API (Admin Only)
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {activeTab === "public" ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="font-semibold">DLRMS Divisions</h3>
                <p className="mb-3 text-xs text-slate-500">GET /api/land-records/divisions</p>
                <Button onClick={() => runTest("/api/land-records/divisions")} disabled={loading} size="sm">
                  <Play size={14} className="mr-2" /> টেস্ট করুন
                </Button>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="font-semibold">Mutation Verify (Invalid Key Test)</h3>
                <p className="mb-3 text-xs text-slate-500">GET /api/land-records/mutation-verify?qrKey=invalid</p>
                <Button onClick={() => runTest("/api/land-records/mutation-verify?qrKey=invalid")} disabled={loading} size="sm">
                  <Play size={14} className="mr-2" /> টেস্ট করুন
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <h3 className="font-semibold">RAJUK API Status</h3>
                <p className="mb-3 text-xs text-slate-500">GET /api/rajuk/status</p>
                <Button onClick={() => runTest("/api/rajuk/status")} disabled={loading} size="sm">
                  <Play size={14} className="mr-2" /> টেস্ট করুন
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold">Response</h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" />
              </div>
            ) : (
              <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs text-emerald-400">
                {testResult || "No result yet. Run a test."}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
