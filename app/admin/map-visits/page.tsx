"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, RefreshCw, Smartphone, ExternalLink } from "lucide-react";

type Visit = { id: string; createdAt?: string | null; lastSeen?: string | null; page?: string; referrer?: string; locationGranted?: boolean; location?: { latitude?: number; longitude?: number; accuracy?: number } | null; lastLocation?: { latitude?: number; longitude?: number; accuracy?: number } | null; locationUpdatedAt?: string | null; visitCount?: number; device?: Record<string, unknown>; userAgent?: string; ip?: string | null };

async function getFreshAdminToken(): Promise<string> {
  const { auth } = await import("@/src/modules/database/firebaseClient");
  if (auth.currentUser) return auth.currentUser.getIdToken();
  return new Promise((resolve, reject) => {
    let settled = false;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (settled) return;
      if (!user) { settled = true; unsubscribe(); reject(new Error("আপনার অ্যাডমিন সেশন পাওয়া যায়নি। আবার লগইন করুন।")); return; }
      try { const token = await user.getIdToken(); settled = true; unsubscribe(); resolve(token); }
      catch (e) { settled = true; unsubscribe(); reject(e); }
    });
  });
}

export default function AdminMapVisitsPage() {
  const [items, setItems] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getFreshAdminToken();
      const res = await fetch("/api/admin/map-visits?limit=200", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.message || "ভিজিট ডেটা লোড ব্যর্থ হয়েছে");
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) { setError(e instanceof Error ? e.message : "ত্রুটি হয়েছে"); setItems([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">মানচিত্র ভিজিটর</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সর্বশেষ জানা লোকেশন, ডিভাইস, ব্রাউজার ও ভিজিট তথ্য</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />রিফ্রেশ</button></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {loading ? <div className="grid gap-3">{[0,1,2].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">এখনো কোনো ভিজিট রেকর্ড নেই।</div> : <div className="space-y-3">{items.map(v => {
      const loc = v.lastLocation || v.location;
      const lat = loc?.latitude, lng = loc?.longitude;
      const mapUrl = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null;
      return <article key={v.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span>{v.lastSeen ? new Date(v.lastSeen).toLocaleString("bn-BD") : "—"}</span>{v.ip && <span className="rounded-full bg-slate-100 px-2 py-0.5">IP: {v.ip}</span>}<span className="rounded-full bg-slate-100 px-2 py-0.5">ভিজিট: {v.visitCount || 1}</span></div>
        {loc ? <div className="mb-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30"><p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300"><MapPin className="h-4 w-4" />Last Location</p><p className="mt-1 text-sm font-mono text-slate-800 dark:text-slate-100">{lat?.toFixed(6)}, {lng?.toFixed(6)}</p>{loc.accuracy != null && <p className="text-xs text-slate-500">Accuracy: ±{Math.round(loc.accuracy)} m · Location updated: {v.locationUpdatedAt ? new Date(v.locationUpdatedAt).toLocaleString("bn-BD") : "—"}</p>}{mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#006a4e]">মানচিত্রে দেখুন <ExternalLink className="h-3 w-3" /></a>}</div> : <div className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">এই visitor-এর কোনো GPS location নেই</div>}
        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"><Smartphone className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0 space-y-1"><p className="break-all text-xs">{v.userAgent || String(v.device?.userAgent || "—")}</p><p className="text-xs text-slate-500">{[v.device?.platform && `প্ল্যাটফর্ম: ${v.device.platform}`, v.device?.language && `ভাষা: ${v.device.language}`, v.device?.timezone && `টাইমজোন: ${v.device.timezone}`, v.device?.screenWidth && v.device?.screenHeight && `স্ক্রিন: ${v.device.screenWidth}×${v.device.screenHeight}`].filter(Boolean).join(" · ")}</p><p className="text-xs text-slate-400">পেজ: {v.page || "—"}</p></div></div>
      </article>;
    })}</div>}
  </div>;
}
