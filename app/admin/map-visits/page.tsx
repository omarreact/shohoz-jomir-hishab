"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, RefreshCw, Smartphone } from "lucide-react";

type Visit = {
  id: string;
  createdAt?: string | null;
  page?: string;
  referrer?: string;
  locationGranted?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  } | null;
  device?: Record<string, unknown>;
  userAgent?: string;
  ip?: string | null;
  acceptLanguage?: string;
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
            লোকেশন, ডিভাইস, ব্রাউজার ও কনটেক্সট তথ্য
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
              className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
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
                {v.ip && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                    IP: {v.ip}
                  </span>
                )}
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

              {v.location && (
                <p className="mb-2 flex items-start gap-2 text-sm text-slate-800 dark:text-slate-100">
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
              )}

              <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="m-0 break-all text-xs">
                    {v.userAgent || String(v.device?.userAgent || "—")}
                  </p>
                  <p className="m-0 text-xs text-slate-500">
                    {[
                      v.device?.platform && `প্ল্যাটফর্ম: ${v.device.platform}`,
                      v.device?.language && `ভাষা: ${v.device.language}`,
                      v.device?.timezone && `টাইমজোন: ${v.device.timezone}`,
                      v.device?.screenWidth &&
                        v.device?.screenHeight &&
                        `স্ক্রিন: ${v.device.screenWidth}×${v.device.screenHeight}`,
                      v.device?.connectionType && `নেট: ${v.device.connectionType}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {v.referrer ? (
                    <p className="m-0 truncate text-xs text-slate-400">রেফারার: {v.referrer}</p>
                  ) : null}
                  {v.page ? (
                    <p className="m-0 text-xs text-slate-400">পেজ: {v.page}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
