"use client";

import { Download, Loader2, Satellite, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Keep the client alive longer than normal requests, but below the server maxDuration. */
const CLIENT_TIMEOUT_MS = 240_000;

type GenerateResponse = {
  ok?: boolean;
  downloadUrl?: string;
  filename?: string;
  size?: number;
  error?: string;
};

const TIMEOUT_HINT =
  "মৌজা PDF তৈরিতে বেশি সময় লাগছে। স্যাটেলাইট বন্ধ করে আবার চেষ্টা করুন, অথবা কিছুক্ষণ পরে চেষ্টা করুন।";

async function requestVectorPdf(params: {
  mouza: string;
  layers: string;
  satellite: boolean;
  signal: AbortSignal;
}): Promise<GenerateResponse> {
  const qs = new URLSearchParams({
    mouza: params.mouza,
    format: "vector-pdf",
    layers: params.layers,
    satellite: String(params.satellite),
  });

  const response = await fetch(`/api/mouza-map/download?${qs.toString()}`, {
    signal: params.signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const body = (await response.json().catch(() => ({}))) as GenerateResponse;

  if (!response.ok) {
    if (response.status === 429) throw new Error("Export limit reached. কয়েক মিনিট পরে আবার চেষ্টা করুন।");
    if (response.status === 504 || response.status === 503) throw new Error(TIMEOUT_HINT);
    throw new Error(body.error || `Vector PDF তৈরি করা যায়নি (${response.status})`);
  }

  if (!body.downloadUrl) throw new Error("সার্ভার PDF তৈরি করেছে, কিন্তু নিরাপদ download link ফেরত দেয়নি।");
  return body;
}

function triggerDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function VectorPdfExportControl() {
  const [open, setOpen] = useState(false);
  const [mouza, setMouza] = useState("");
  const [layers, setLayers] = useState<"rs" | "ms" | "combined">("combined");
  const [satellite, setSatellite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

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
    setStatus(satellite ? "স্যাটেলাইট + ভেক্টর PDF তৈরি হচ্ছে…" : "ভেক্টর PDF তৈরি হচ্ছে…");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      let usedSatellite = satellite;
      try {
        const body = await requestVectorPdf({ mouza: value, layers, satellite: usedSatellite, signal: controller.signal });
        triggerDownload(body.downloadUrl!);
        toast.success("মৌজা PDF প্রস্তুত হয়েছে");
        setOpen(false);
        return;
      } catch (firstError) {
        const isTimeout =
          (firstError instanceof DOMException && firstError.name === "AbortError") ||
          (firstError instanceof Error && (firstError.message.includes("বেশি সময়") || firstError.message.includes("timed out")));

        if (isTimeout && usedSatellite && !controller.signal.aborted) {
          setStatus("স্যাটেলাইট ব্যর্থ — শুধু ভেক্টর দিয়ে আবার চেষ্টা…");
          toast.info("স্যাটেলাইট বাদ দিয়ে PDF পুনরায় তৈরি করা হচ্ছে");
          setSatellite(false);
          usedSatellite = false;
          const body = await requestVectorPdf({ mouza: value, layers, satellite: false, signal: controller.signal });
          triggerDownload(body.downloadUrl!);
          toast.success("মৌজা PDF প্রস্তুত হয়েছে");
          setOpen(false);
          return;
        }
        throw firstError;
      }
    } catch (cause) {
      const message = cause instanceof DOMException && cause.name === "AbortError"
        ? TIMEOUT_HINT
        : cause instanceof Error
          ? cause.message
          : "Vector PDF তৈরি করা যায়নি";
      setError(message);
      toast.error(message);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-50 -translate-x-1/2 sm:top-4">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-xl backdrop-blur transition hover:bg-white dark:border-slate-700 dark:bg-slate-950/95 dark:text-white" aria-label="Vector PDF ডাউনলোড">
          <Download className="h-4 w-4" /> Vector PDF
        </button>
      ) : (
        <div className="w-[min(92vw,340px)] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vector PDF Map</h2>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">RS/MS vector geometry + optional satellite backdrop</p>
            </div>
            <button type="button" onClick={() => !loading && setOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="বন্ধ"><X className="h-4 w-4" /></button>
          </div>

          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">মৌজার নাম</label>
          <input value={mouza} onChange={(e) => setMouza(e.target.value)} placeholder="যেমন: Dumni" disabled={loading} className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />

          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Map layers</label>
          <select value={layers} onChange={(e) => setLayers(e.target.value as "rs" | "ms" | "combined")} disabled={loading} className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="combined">RS + MS</option><option value="rs">RS only</option><option value="ms">MS only</option>
          </select>

          <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><Satellite className="h-4 w-4" /> Satellite backdrop</span>
            <input type="checkbox" checked={satellite} disabled={loading} onChange={(e) => setSatellite(e.target.checked)} className="h-4 w-4" />
          </label>

          <p className="mb-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Satellite is a compressed raster backdrop; RS/MS boundaries and plot geometry remain vector paths. For large মৌজা, turn satellite off for a faster, more reliable export.</p>

          {loading && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30" aria-live="polite"><div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-800 dark:text-emerald-300"><Loader2 className="h-4 w-4 animate-spin" />{status || "Processing…"}<span className="ml-auto tabular-nums">{elapsed}s</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/60"><div className="h-full w-2/5 animate-pulse rounded-full bg-emerald-500" /></div><p className="mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-400">বড় মৌজায় ১৫+ সেকেন্ড লাগতে পারে। এই সময়ে নতুন export শুরু করা যাবে না।</p></div>}

          {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300" role="alert">{error}</div>}

          <button type="button" disabled={loading || mouza.trim().length < 2} onClick={() => void downloadVectorPdf()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {loading ? "Vector PDF তৈরি হচ্ছে…" : "Download Vector PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
