"use client";

import { Download, Loader2, X } from "lucide-react";
import { useState } from "react";

export default function VectorPdfExportControl() {
  const [open, setOpen] = useState(false);
  const [mouza, setMouza] = useState("");
  const [layers, setLayers] = useState<"rs" | "ms" | "combined">("combined");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function downloadVectorPdf() {
    const value = mouza.trim();
    if (value.length < 2 || loading) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ mouza: value, format: "vector-pdf", layers });
      const response = await fetch(`/api/mouza-map/download?${params.toString()}`);
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Vector PDF তৈরি করা যায়নি");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match?.[1] || `landbd-${value.replace(/[^\p{L}\p{N}]+/gu, "-")}-${layers}-vector.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Vector PDF তৈরি করা যায়নি");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-50 -translate-x-1/2 sm:top-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-xl backdrop-blur transition hover:bg-white dark:border-slate-700 dark:bg-slate-950/95 dark:text-white"
          aria-label="Vector PDF ডাউনলোড"
        >
          <Download className="h-4 w-4" />
          Vector PDF
        </button>
      ) : (
        <div className="w-[min(92vw,340px)] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vector PDF Map</h2>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">RS/MS polygon geometry · lossless vector</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="বন্ধ করুন">
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            মৌজার নাম
            <input
              value={mouza}
              onChange={(event) => setMouza(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void downloadVectorPdf();
              }}
              placeholder="যেমন: Patira"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              autoFocus
            />
          </label>

          <label className="mt-3 block text-xs font-semibold text-slate-700 dark:text-slate-200">
            Map layers
            <select
              value={layers}
              onChange={(event) => setLayers(event.target.value as "rs" | "ms" | "combined")}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="combined">RS + MS</option>
              <option value="rs">RS only</option>
              <option value="ms">MS only</option>
            </select>
          </label>

          {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}

          <button
            type="button"
            disabled={loading || mouza.trim().length < 2}
            onClick={() => void downloadVectorPdf()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {loading ? "Vector PDF তৈরি হচ্ছে…" : "Download Vector PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
