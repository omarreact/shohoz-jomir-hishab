"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Search, X } from "lucide-react";
import { toBn } from "@/src/shared/utils";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDocument from "@/src/shared/components/ResultDocument";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";

interface PorchaData {
  JOMIHUB: number | string;
  Column2?: string;
  Column3?: string;
  Column4?: number | string;
  Column5?: number | string;
}

function safeFilePart(value: unknown): string {
  return String(value ?? "record")
    .trim()
    .replace(/[^\w\u0980-\u09FF-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 48) || "record";
}

export default function PorchaPage() {
  const [filteredData, setFilteredData] = useState<PorchaData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPorcha, setSelectedPorcha] = useState<PorchaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const { isLoggedIn, loading: authChecking } = useAuth();

  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: exportRef,
    fileName: `LandBD-Porcha-${safeFilePart(selectedPorcha?.JOMIHUB)}-A4-Portrait`,
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    if (!searchQuery.trim()) {
      setFilteredData([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPage(1);
      void fetch(`/api/porcha?q=${encodeURIComponent(searchQuery)}&page=1`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.json();
        })
        .then((data) => {
          if (controller.signal.aborted) return;
          setFilteredData(data.results || []);
          setHasMore(Boolean(data.hasMore));
          setLoading(false);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.error("Error loading porcha data:", error);
          setFilteredData([]);
          setLoading(false);
        });
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery, isLoggedIn]);

  const loadMore = async () => {
    if (isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const response = await fetch(`/api/porcha?q=${encodeURIComponent(searchQuery)}&page=${nextPage}`);
      if (!response.ok) throw new Error("আরও পর্চা লোড করা যায়নি");
      const data = await response.json();
      setFilteredData((previous) => [...previous, ...(data.results || [])]);
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#006a4e] border-t-transparent" />
        <p className="mt-4 font-bold text-slate-500 dark:text-slate-400">যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 fade-in visible">
        <div className="flex justify-center">
          <div className="w-full max-w-md text-center">
            <div className="card-new p-10">
              <div className="mb-6 inline-flex rounded-full bg-red-500/10 p-4 text-red-500">
                <Search size={48} />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">অ্যাক্সেস সীমাবদ্ধ</h3>
              <p className="mb-8 text-slate-500 dark:text-slate-400">পর্চা খুঁজতে অনুগ্রহ করে লগইন করুন।</p>
              <a href="/login" className="cta-gradient block w-full rounded-full px-8 py-3 font-bold text-white shadow-lg">
                লগইন করুন
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 fade-in visible">
      <div className="mb-12 flex justify-center">
        <div className="w-full max-w-2xl text-center">
          <h1 className="mb-4 flex items-center justify-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            <FileText size={32} className="mr-3 text-[#006a4e]" /> ডিজিটাল খতিয়ান (পর্চা) সংগ্রহ
          </h1>
          <p className="mb-8 text-lg text-slate-500 dark:text-slate-400">
            আপনার কাঙ্ক্ষিত খতিয়ান, দাগ নম্বর বা মালিকের নাম লিখে খুঁজুন।
          </p>
          <div className="relative">
            <input
              type="search"
              className="w-full rounded-full border border-slate-200 bg-white px-6 py-4 pl-14 text-lg text-slate-900 shadow-sm transition-colors focus:border-[#006a4e] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="খতিয়ান নং, দাগ নং বা মালিকের নাম..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#006a4e] border-t-transparent" />
          <p className="mt-4 font-bold text-slate-500 dark:text-slate-400">সার্ভার থেকে তথ্য খোঁজা হচ্ছে...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredData.map((item, index) => (
              <article key={`${item.JOMIHUB}-${index}`} className="card-new flex h-full flex-col justify-between p-6">
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <span className="rounded-full border border-[#006a4e]/20 bg-[#006a4e]/10 px-4 py-1 text-sm font-bold text-[#006a4e]">
                      খতিয়ান নং: {item.JOMIHUB ? toBn(item.JOMIHUB) : "-"}
                    </span>
                  </div>
                  <h2 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 dark:text-white">মালিক: {item.Column2 || "অজ্ঞাত"}</h2>
                  <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white">দাগ নং:</strong> {item.Column4 ? toBn(item.Column4) : "অজ্ঞাত"}
                  </p>
                </div>
                <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedPorcha(item)}
                    className="flex w-full items-center justify-center rounded-full border border-[#006a4e] px-4 py-2 font-bold text-[#006a4e] transition-colors hover:bg-[#006a4e] hover:text-white"
                  >
                    <Download size={18} className="mr-2" /> বিস্তারিত দেখুন
                  </button>
                </div>
              </article>
            ))}

            {filteredData.length === 0 && searchQuery ? (
              <div className="col-span-full py-16 text-center">
                <p className="text-xl text-slate-500 dark:text-slate-400">কোনো খতিয়ান পাওয়া যায়নি।</p>
              </div>
            ) : null}
          </div>

          {hasMore ? (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={isLoadingMore}
                className="cta-gradient mx-auto flex items-center rounded-full px-8 py-3 font-bold text-white shadow-lg disabled:opacity-60"
              >
                {isLoadingMore ? (
                  <>
                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    লোড হচ্ছে...
                  </>
                ) : (
                  "আরও দেখুন"
                )}
              </button>
            </div>
          ) : null}
        </>
      )}

      {selectedPorcha ? (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">পর্চা প্রিভিউ</h2>
              <button
                type="button"
                onClick={() => setSelectedPorcha(null)}
                className="rounded-full bg-white p-2 text-slate-500 transition hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300"
                aria-label="বন্ধ করুন"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ResultDocument ref={exportRef} className="p-8 sm:p-12">
                <div className="mb-8 border-b-2 border-green-600 pb-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006a4e]">ল্যান্ডবিডি</p>
                  <h2 className="mt-1 text-2xl font-bold text-green-700">খতিয়ান (পর্চা) বিবরণী</h2>
                  <p className="mt-1 font-bold text-gray-600">ডিজিটাল রেকর্ড রুম</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-left">
                    <tbody>
                      {[
                        ["খতিয়ান নং", selectedPorcha.JOMIHUB ? toBn(selectedPorcha.JOMIHUB) : "-", "font-bold text-lg text-green-700"],
                        ["মালিকের নাম", selectedPorcha.Column2 || "প্রযোজ্য নয়", "font-bold text-gray-900"],
                        ["পিতা/স্বামীর নাম", selectedPorcha.Column3 || "প্রযোজ্য নয়", "text-gray-700"],
                        ["দাগ নং সমূহ", selectedPorcha.Column4 ? toBn(selectedPorcha.Column4) : "-", "text-blue-700 font-semibold"],
                        ["জমির পরিমাণ", selectedPorcha.Column5 ? toBn(selectedPorcha.Column5) : "-", "font-bold text-gray-900"],
                      ].map(([label, value, className]) => (
                        <tr key={label}>
                          <th className="w-1/3 border border-gray-300 bg-gray-100 px-4 py-3 font-bold text-gray-800">{label}</th>
                          <td className={`border border-gray-300 px-4 py-3 ${className}`}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
                  * এই খতিয়ানটি ডিজিটাল কপি। দাপ্তরিক কাজের জন্য মূল কপির সাথে যাচাই করুন।
                </div>
              </ResultDocument>
            </div>

            <div className="rounded-b-2xl border-t border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex justify-center">
                <ResultDownloadButton onClick={() => void generatePDF()} loading={isGenerating} />
              </div>
              {pdfError ? <p className="mt-2 text-center text-xs font-semibold text-red-600">{pdfError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
