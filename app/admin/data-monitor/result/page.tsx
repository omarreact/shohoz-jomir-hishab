"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { DATA_MONITOR_SERVICES } from "@/src/features/admin/data-monitor/api-registry";

type Result = { id: string; name: string; endpoint: string; status: number; ms: number; error?: string };

export default function CombinedResultPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  const ids = useMemo(() => {
    if (typeof window === "undefined") return [];
    const raw = new URLSearchParams(window.location.search).get("services");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, []);

  useEffect(() => {
    const requested = ids.length ? DATA_MONITOR_SERVICES.filter((s) => ids.includes(s.id)) : DATA_MONITOR_SERVICES;
    setSelected(requested.map((s) => s.id));
    const run = async () => {
      const started = performance.now();
      const output = await Promise.all(requested.map(async (service) => {
        const t = performance.now();
        try {
          const response = await fetch(`/api/rajuk/metadata?service=${encodeURIComponent(service.id)}`, { cache: "no-store" });
          return { id: service.id, name: service.name, endpoint: service.endpoint, status: response.status, ms: Math.round(performance.now() - t), ...(response.ok ? {} : { error: (await response.text()).slice(0, 300) }) };
        } catch (error) {
          return { id: service.id, name: service.name, endpoint: service.endpoint, status: 0, ms: Math.round(performance.now() - t), error: error instanceof Error ? error.message : "Request failed" };
        }
      }));
      setResults(output);
      setLoading(false);
      void started;
    };
    run();
  }, [ids]);

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/admin/data-monitor" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950 dark:hover:text-white"><ArrowLeft size={16} /> Back to registry</Link>
    <header className="mb-8"><h1 className="text-3xl font-bold text-slate-950 dark:text-white">Combined Service Viewer</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Server-side metadata checks through the canonical LandBD proxy. Client-side tokens are never exposed.</p></header>
    {loading ? <div className="flex items-center gap-2 py-12 text-slate-500"><Loader2 className="animate-spin" size={18} /> Testing {selected.length || DATA_MONITOR_SERVICES.length} services…</div> : <div className="grid gap-4">{results.map((result) => <article key={result.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-semibold text-slate-950 dark:text-white">{result.name}</h2><p className="mt-1 break-all text-xs text-slate-500">{result.endpoint}</p></div><div className="flex items-center gap-3 text-xs">{result.status >= 200 && result.status < 300 ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 size={14} /> {result.status}</span> : <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={14} /> {result.status || "ERR"}</span>}<span className="inline-flex items-center gap-1 text-slate-500"><Clock3 size={14} /> {result.ms} ms</span></div></div>{result.error && <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-red-300">{result.error}</pre>}</article>)}</div>}
  </main>;
}
