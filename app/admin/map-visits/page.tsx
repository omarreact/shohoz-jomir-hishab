"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";

type Visit = {
  id: string;
  createdAt?: string | null;
  page?: string;
  locationGranted?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  } | null;
};

export default function AdminMapVisitsPage() {
  const [items, setItems] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { auth } = await import("@/src/modules/database/firebaseClient");
      const token = (await auth.currentUser?.getIdToken()) ?? null;
      const res = await fetch("/api/admin/map-visits?limit=100", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "লোড ব্যর্থ");
      }
      setItems(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ত্রুটি");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            মানচিত্র ভিজিটর
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            geospatial-map থেকে সংগৃহীত লোকেশন (অনুমতি দিলে)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
          এখনো কোনো ভিজিট রেকর্ড নেই।
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((v) => (
            <article
              key={v.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span>{v.createdAt ? new Date(v.createdAt).toLocaleString("bn-BD") : "—"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    v.locationGranted
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {v.locationGranted ? "লোকেশন অন" : "লোকেশন বন্ধ"}
                </span>
              </div>

              {v.location ? (
                <p className="m-0 flex items-start gap-2 text-sm text-slate-800 dark:text-slate-100">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#006a4e]" />
                  <span>
                    {v.location.latitude?.toFixed(6)}, {v.location.longitude?.toFixed(6)}
                    {v.location.accuracy != null && (
                      <span className="text-slate-500">
                        {" "}
                        (±{Math.round(v.location.accuracy)} মি)
                      </span>
                    )}
                  </span>
                </p>
              ) : (
                <p className="m-0 text-sm text-slate-500">লোকেশন দেওয়া হয়নি</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
