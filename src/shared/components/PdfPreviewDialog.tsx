"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, X } from "lucide-react";

export type PdfPreviewDocument = {
  blob: Blob;
  fileName: string;
  pages: number;
};

type Props = {
  document: PdfPreviewDocument;
  onClose: () => void;
};

export function downloadPdfBlob(blob: Blob, fileName: string): void {
  if (!blob.size) throw new Error("PDF is empty");
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  // Keep it alive long enough for mobile browsers to finish saving.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Preview the generated PDF, not a separate HTML approximation. */
export default function PdfPreviewDialog({ document: pdfDocument, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(pdfDocument.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdfDocument.blob]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-sm sm:p-5 print:hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="landbd-pdf-preview-heading"
        className="flex h-[min(94dvh,1000px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <FileText size={22} />
            </span>
            <div className="min-w-0">
              <h2 id="landbd-pdf-preview-heading" className="truncate text-base font-bold text-slate-900">
                PDF প্রিভিউ
              </h2>
              <p className="max-w-[65vw] truncate text-xs text-slate-500 sm:max-w-xl">
                {pdfDocument.fileName} · {pdfDocument.pages} পৃষ্ঠা
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {url ? (
              <>
                <a
                  href={url}
                  download={pdfDocument.fileName}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  <Download size={16} /> PDF ডাউনলোড
                </a>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                >
                  <ExternalLink size={16} /> নতুন ট্যাবে
                </a>
              </>
            ) : null}
            <button
              type="button"
              aria-label="PDF প্রিভিউ বন্ধ করুন"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 bg-slate-100 p-1.5 sm:p-3">
          {url ? (
            <iframe
              title="LandBD generated PDF document"
              src={url}
              className="h-full w-full rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <p className="p-8 text-center text-sm text-slate-600" role="status">
              PDF প্রস্তুত হচ্ছে…
            </p>
          )}
        </div>
        <p className="border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
          ব্রাউজারে PDF দেখা না গেলে “নতুন ট্যাবে” খুলুন বা “PDF ডাউনলোড” ব্যবহার করুন।
        </p>
      </section>
    </div>
  );
}
