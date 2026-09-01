"use client";

import { Download, Loader2, Satellite, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Server maxDuration is 300s. Client must not abort first.
 * Satellite backdrop adds tile fetch + large JPEG embed — keep budget high.
 */
const CLIENT_TIMEOUT_MS = 240_000;

type GenerateResponse = {
  ok?: boolean;
  downloadUrl?: string;
  filename?: string;
  size?: number;
  error?: string;
};

const TIMEOUT_HINT =
  "The map export took too long. Please try again, or export without satellite imagery.";

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
    if (response.status === 429) {
      throw new Error("Export limit reached. Please wait a few minutes before trying again.");
    }
    if (response.status === 504 || response.status === 503) {
      throw new Error(TIMEOUT_HINT);
    }
    throw new Error(body.error || `Vector PDF তৈরি করা যায়নি (${response.status})`);
  }

  if (!body.downloadUrl) {
    throw new Error("The server generated the PDF but did not return a secure download link.");
  }

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
  /** Default off: vector-only is reliable; satellite is optional quality upgrade. */
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
        const body = await requestVectorPdf({
          mouza: value,
          layers,
          satellite: usedSatellite,
          signal: controller.signal,
        });
        triggerDownload(body.downloadUrl!);
        setOpen(false);
        return;
      } catch (firstError) {
        const isTimeout =
          (firstError instanceof DOMException && firstError.name === "AbortError") ||
          (firstError instanceof Error &&
            (firstError.message.includes("took too long") || firstError.message.includes("timed out")));

        // Automatic one-shot fallback: drop satellite and retry once.
        if (isTimeout && usedSatellite && !controller.signal.aborted) {
          setStatus("স্যাটেলাইট ব্যর্থ — শুধু ভেক্টর দিয়ে আবার চেষ্টা…");
          setSatellite(false);
          usedSatellite = false;
          const body = await requestVectorPdf({
            mouza: value,
            layers,
            satellite: false,
            signal: controller.signal,
          });
          triggerDownload(body.downloadUrl!);
          setOpen(false);
          return;
        }
        throw firstError;
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        setError(TIMEOUT_HINT);
      } else {
        setError(cause instanceof Error ? cause.message : "Vector PDF তৈরি করা যায়নি");
      }
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      setStatus("");
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
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vector PDF Map</h2>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                RS/MS vector geometry + optional satellite backdrop
              </p>
            </div>
            <button
              type="button"
              onClick={() => !loading && setOpen(false)}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="বন্ধ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">মৌজার নাম</label>
          <input
            value={mouza}
            onChange={(e) => setMouza(e.target.value)}
            placeholder="যেমন: Dumni"
            disabled={loading}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Map layers</label>
          <select
            value={layers}
            onChange={(e) => setLayers(e.target.value as "rs" | "ms" | "combined")}
            disabled={loading}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="combined">RS + MS</option>
            <option value="rs">RS only</option>
            <option value="ms">MS only</option>
          </select>

          <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Satellite className="h-4 w-4" />
              Satellite backdrop
            </span>
            <input
              type="checkbox"
              checked={satellite}
              disabled={loading}
              onChange={(e) => setSatellite(e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <p className="mb-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Satellite is a compressed raster backdrop; RS/MS boundaries and plot geometry remain vector paths.
            For large মৌজা, turn satellite off for a faster, more reliable export.
          </p>

          {loading && (
            <p className="mb-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              {status || "Processing…"} ({elapsed}s)
            </p>
          )}

          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading || mouza.trim().length < 2}
            onClick={() => void downloadVectorPdf()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {loading ? "Vector PDF তৈরি হচ্ছে…" : "Download Vector PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
