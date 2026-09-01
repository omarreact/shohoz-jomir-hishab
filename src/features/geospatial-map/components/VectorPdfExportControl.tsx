"use client";

import { Download, Loader2, Satellite, X } from "lucide-react";
import { useEffect, useState } from "react";

const CLIENT_TIMEOUT_MS = 65_000;

export default function VectorPdfExportControl() {
  const [open, setOpen] = useState(false);
  const [mouza, setMouza] = useState("");
  const [layers, setLayers] = useState<"rs" | "ms" | "combined">("combined");
  const [satellite, setSatellite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function downloadVectorPdf() {
    const value = mouza.trim();
    if (value.length < 2 || loading) return;
    setLoading(true);
    setElapsed(0);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const params = new URLSearchParams({ mouza: value, format: "vector-pdf", layers, satellite: String(satellite) });
      const response = await fetch(`/api/mouza-map/download?${params.toString()}`, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        if (response.status === 429) throw new Error("Export limit reached. Please wait a few minutes before trying again.");
        if (response.status === 504) throw new Error("The map export took too long. Please try again, or export without satellite imagery.");
        throw new Error(body.error || `Vector PDF তৈরি করা যায়নি (${response.status})`);
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The server returned an empty PDF.");
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match?.[1] || `landbd-${value.replace(/[^\p{L}\p{N}]+/gu, "-")}-${layers}${satellite ? "-satellite" : ""}-vector.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        setError("PDF generation timed out. Please try again, or turn off satellite imagery for a faster export.");
      } else {
        setError(cause instanceof Error ? cause.message : "Vector PDF তৈরি করা যায়নি");
      }
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-50 -translate-x-1/2 sm:top-4">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-xl backdrop-blur transition hover:bg-white dark:border-slate-700 dark:bg-slate-950/95 dark:text-white" aria-label="Vector PDF ডাউনলোড">
          <Download className="h-4 w-4" />Vector PDF
        </button>
      ) : (
        <div className="w-[min(92vw,340px)] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
          <div className="mb-3 flex items-center justify-between">
            <div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Vector PDF Map</h2><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">RS/MS vector geometry + satellite backdrop</p></div>
            <button type="button" disabled={loading} onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800" aria-label="বন্ধ করুন"><X className="h-4 w-4" /></button>
          </div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">মৌজার নাম
            <input value={mouza} disabled={loading} onChange={(event) => setMouza(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void downloadVectorPdf(); }} placeholder="যেমন: Patira" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white" autoFocus />
          </label>
          <label className="mt-3 block text-xs font-semibold text-slate-700 dark:text-slate-200">Map layers
            <select value={layers} disabled={loading} onChange={(event) => setLayers(event.target.value as "rs" | "ms" | "combined")} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="combined">RS + MS</option><option value="rs">RS only</option><option value="ms">MS only</option>
            </select>
          </label>
          <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"><span className="flex items-center gap-2"><Satellite className="h-4 w-4" />Satellite backdrop</span><input type="checkbox" disabled={loading} checked={satellite} onChange={(event) => setSatellite(event.target.checked)} /></label>
          <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Satellite is a compressed raster backdrop; RS/MS boundaries and plot geometry remain vector paths.</p>
          {loading ? <div role="status" aria-live="polite" className="mt-3 rounded-xl bg-slate-100 px-3 py-2.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"><div className="flex items-center gap-2 font-semibold"><Loader2 className="h-4 w-4 animate-spin" />PDF তৈরি হচ্ছে… {elapsed}s</div><p className="mt-1 text-[10px] opacity-75">বড় মৌজায় 15–60 সেকেন্ড লাগতে পারে। এই উইন্ডো বন্ধ করবেন না।</p></div> : null}
          {error ? <div role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div> : null}
          <button type="button" disabled={loading || mouza.trim().length < 2} onClick={() => void downloadVectorPdf()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{loading ? "Vector PDF তৈরি হচ্ছে…" : "Download Vector PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
