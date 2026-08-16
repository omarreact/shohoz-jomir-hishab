"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Button } from "@/src/shared/ui/button";
import { CheckCircle2, XCircle, Clock, Database, AlertTriangle, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ApiTestResult {
  name: string;
  endpoint: string;
  visibility: "public" | "private";
  status: "idle" | "testing" | "success" | "error" | "auth_error";
  httpStatus?: number;
  responseTime?: number;
  recordCount?: number;
  error?: string;
}

const INITIAL_ENDPOINTS: ApiTestResult[] = [
  // Public
  { name: "Public Tiles (MapServer)", endpoint: "/api/tiles?service=rajuk_db/Rajuk_dap_db/MapServer&x=0&y=0&z=0", visibility: "public", status: "idle" },
  { name: "Public Gateway Info", endpoint: "/api/unified?include=health", visibility: "public", status: "idle" },
  // Private
  { name: "Feature Server (Plots)", endpoint: "/api/unified?include=plots&limit=1", visibility: "private", status: "idle" },
  { name: "Feature Server (Mouzas)", endpoint: "/api/unified?include=mouzas&limit=1", visibility: "private", status: "idle" },
];

export default function RajukApiTestPage() {
  const [endpoints, setEndpoints] = useState<ApiTestResult[]>(INITIAL_ENDPOINTS);
  const [authStatus, setAuthStatus] = useState<string>("TOKEN_CHECKING");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        setAuthStatus(data.status);
      } catch (e) {
        setAuthStatus("TOKEN_ERROR");
      }
    })();
  }, []);

  const runTest = async (index: number) => {
    const target = endpoints[index];
    
    if (target.visibility === "private" && authStatus !== "TOKEN_VALID") {
      toast.error("বৈধ টোকেন পাওয়া যায়নি। প্রাইভেট API ব্যবহার করা যাবে না।");
      return;
    }

    setEndpoints(prev => prev.map((e, i) => i === index ? { ...e, status: "testing" } : e));
    
    const start = performance.now();
    try {
      const res = await fetch(target.endpoint);
      const time = Math.round(performance.now() - start);
      
      if (!res.ok) {
        let isAuth = res.status === 401 || res.status === 403 || res.status === 498 || res.status === 499;
        
        try {
          const json = await res.json();
          if (json.errors && json.errors.some((e: any) => e.message?.includes("Invalid token"))) {
             isAuth = true;
          }
        } catch {}

        setEndpoints(prev => prev.map((e, i) => i === index ? {
          ...e,
          status: isAuth ? "auth_error" : "error",
          httpStatus: res.status,
          responseTime: time,
          error: `${res.status} ${res.statusText}`
        } : e));
        return;
      }
      
      let records = 0;
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.data) {
          records = Object.values(data.data)[0] ? (Object.values(data.data)[0] as any).features?.length || 1 : 1;
        } else if (data.data) {
           records = Array.isArray(data.data) ? data.data.length : 1;
        }
      }

      setEndpoints(prev => prev.map((e, i) => i === index ? {
        ...e,
        status: "success",
        httpStatus: res.status,
        responseTime: time,
        recordCount: records
      } : e));

    } catch (err: any) {
      setEndpoints(prev => prev.map((e, i) => i === index ? {
        ...e,
        status: "error",
        responseTime: Math.round(performance.now() - start),
        error: err.message || "Network Error"
      } : e));
    }
  };

  const renderStatus = (status: ApiTestResult["status"], error?: string) => {
    switch (status) {
      case "idle": return <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Clock size={16}/> অপেক্ষমাণ</span>;
      case "testing": return <span className="text-[#006a4e] flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> যাচাই চলছে...</span>;
      case "success": return <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16}/> সফল</span>;
      case "error": return <span className="text-red-600 dark:text-red-400 flex items-center gap-2" title={error}><XCircle size={16}/> ব্যর্থ</span>;
      case "auth_error": return <span className="text-amber-600 dark:text-amber-400 flex items-center gap-2" title="টোকেন বাতিল/মেয়াদোত্তীর্ণ"><AlertTriangle size={16}/> টোকেন সমস্যা</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in visible">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="font-bold text-3xl text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <Database className="text-[#006a4e]" /> রাজউক API স্বাস্থ্য পরীক্ষা
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-lg">সিস্টেমের সকল পাবলিক ও প্রাইভেট এন্ডপয়েন্টের রিয়েল-টাইম স্ট্যাটাস।</p>
        </div>
        
        <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${authStatus === "TOKEN_VALID" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
          {authStatus === "TOKEN_VALID" ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          {authStatus === "TOKEN_VALID" ? "প্রাইভেট কানেকশন সক্রিয়" : "প্রাইভেট কানেকশন নিষ্ক্রিয়"}
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">পাবলিক API (Public Endpoints)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endpoints.map((ep, idx) => ep.visibility === "public" && (
              <Card key={idx} className="shadow-sm border-slate-200 dark:border-slate-800 hover:border-[#006a4e]/50 transition-colors">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <h5 className="font-bold text-lg mb-1">{ep.name}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 p-1 rounded mb-4 truncate">{ep.endpoint}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col gap-1">
                      {renderStatus(ep.status, ep.error)}
                      {ep.responseTime !== undefined && <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{ep.responseTime}ms | {ep.httpStatus} HTTP | {ep.recordCount ?? 0} Records</span>}
                    </div>
                    <Button size="sm" onClick={() => runTest(idx)} disabled={ep.status === "testing"}>
                      টেস্ট করুন
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">প্রাইভেট API (Feature Server)</h4>
          {authStatus !== "TOKEN_VALID" && (
             <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-500/20 mb-4 flex items-center gap-3">
               <ShieldAlert size={24} />
               <p className="font-bold">বৈধ টোকেন পাওয়া যায়নি। প্রাইভেট API ব্যবহার করা যাবে্বা না।</p>
             </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-100 transition-opacity">
            {endpoints.map((ep, idx) => ep.visibility === "private" && (
              <Card key={idx} className={`shadow-sm border-slate-200 dark:border-slate-800 hover:border-[#006a4e]/50 transition-colors ${authStatus !== "TOKEN_VALID" ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <h5 className="font-bold text-lg mb-1 flex items-center justify-between">
                      {ep.name}
                      <span className="bg-[#006a4e]/10 text-[#006a4e] text-xs px-2 py-0.5 rounded-full font-bold border border-[#006a4e]/20">Private</span>
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 p-1 rounded mb-4 truncate">{ep.endpoint}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col gap-1">
                      {renderStatus(ep.status, ep.error)}
                      {ep.responseTime !== undefined && <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{ep.responseTime}ms | {ep.httpStatus} HTTP | {ep.recordCount ?? 0} Records</span>}
                    </div>
                    <Button size="sm" onClick={() => runTest(idx)} disabled={ep.status === "testing" || authStatus !== "TOKEN_VALID"} variant="secondary">
                      টেস্ট করুন
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
