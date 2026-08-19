"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { DATA_MONITOR_SERVICES } from "@/src/features/admin/data-monitor/api-registry";

export default function DataMonitorPage() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | "feature" | "tile" | "external">("all");
  const services = useMemo(() => DATA_MONITOR_SERVICES.filter((service) => {
    const q = search.trim().toLowerCase();
    return (kind === "all" || service.kind === kind) && (!q || `${service.name} ${service.endpoint} ${service.note}`.toLowerCase().includes(q));
  }), [kind, search]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><ShieldCheck size={14} /> Verified service registry</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">ডেটা মনিটর</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">শুধু যাচাই করা GIS ও external services এখানে দেখানো হচ্ছে। API key বা runtime token এই client page-এ রাখা হয় না।</p>
        </div>
        <Link href="/admin/data-monitor/result" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Combined viewer</Link>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Verified services", DATA_MONITOR_SERVICES.length],
          ["Feature services", DATA_MONITOR_SERVICES.filter((s) => s.kind === "feature").length],
          ["Tile services", DATA_MONITOR_SERVICES.filter((s) => s.kind === "tile").length],
        ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{value}</div></div>)}
      </section>

      <section className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search service..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900" /></label>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900"><option value="all">All types</option><option value="feature">FeatureServer</option><option value="tile">MapServer tiles</option><option value="external">External</option></select>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950/50"><tr><th className="px-5 py-4 font-semibold">Service</th><th className="px-5 py-4 font-semibold">Type</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Endpoint</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{services.map((service) => <tr key={service.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40"><td className="px-5 py-4"><div className="font-semibold text-slate-950 dark:text-white">{service.name}</div><div className="mt-1 text-xs text-slate-500">{service.note}</div></td><td className="px-5 py-4 capitalize text-slate-600 dark:text-slate-300">{service.kind}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 size={13} /> verified</span></td><td className="max-w-xl px-5 py-4"><a href={service.endpoint} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-slate-500 hover:text-emerald-600"><span className="truncate">{service.endpoint}</span><ExternalLink size={13} /></a></td></tr>)}</tbody></table></div>{services.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No matching services.</div>}</section>
    </main>
  );
}
