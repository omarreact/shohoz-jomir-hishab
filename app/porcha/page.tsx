"use client";

import { useState, useEffect, useRef } from "react";
import { Search, FileText, Download, X } from "lucide-react";
import { toBn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface PorchaData {
  JOMIHUB: number | string;
  Column2?: string;
  Column3?: string;
  Column4?: number | string;
  Column5?: number | string;
}

export default function PorchaPage() {
  const [filteredData, setFilteredData] = useState<PorchaData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPorcha, setSelectedPorcha] = useState<PorchaData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const exportRef = useRef<HTMLDivElement | null>(null);

  // Auth — JWT cookie-based, no Firebase
  const { isLoggedIn, loading: authChecking } = useAuth();

  // Fetch on search query change
  useEffect(() => {
    if (!isLoggedIn) return;

    if (!searchQuery.trim()) {
      setFilteredData([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      setPage(1);
      fetch(`/api/porcha?q=${encodeURIComponent(searchQuery)}&page=1`)
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data) => {
          setFilteredData(data.results || []);
          setHasMore(data.hasMore || false);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading porcha data:", err);
          setFilteredData([]);
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, isLoggedIn]);

  const loadMore = () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    fetch(`/api/porcha?q=${encodeURIComponent(searchQuery)}&page=${nextPage}`)
      .then((res) => res.json())
      .then((data) => {
        setFilteredData((prev) => [...prev, ...(data.results || [])]);
        setHasMore(data.hasMore || false);
        setPage(nextPage);
        setIsLoadingMore(false);
      })
      .catch((err) => {
        console.error("Error loading more data:", err);
        setIsLoadingMore(false);
      });
  };

  const downloadPDF = async () => {
    if (!exportRef.current) return;
    setIsDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `Khotiyan_${selectedPorcha?.JOMIHUB}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(exportRef.current).save();
    } catch (err) {
      console.error(err);
      alert("PDF তৈরিতে সমস্যা হয়েছে।");
    } finally {
      setIsDownloading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[var(--text-secondary)] font-bold">
          যাচাই করা হচ্ছে...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 fade-in visible">
        <div className="flex justify-center">
          <div className="max-w-md w-full text-center">
            <div className="card-new p-10">
              <div className="bg-red-500/10 text-red-500 rounded-full inline-flex p-4 mb-6">
                <Search size={48} />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                অ্যাক্সেস ডিনাইড
              </h3>
              <p className="text-[var(--text-secondary)] mb-8">
                পর্চা খুঁজতে অনুগ্রহ করে লগিন করুন।
              </p>
              <a
                href="/login"
                className="cta-gradient text-[var(--bg)] font-bold px-8 py-3 rounded-full shadow-lg block w-full"
              >
                লগিন করুন
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in visible">
      <div className="flex justify-center mb-12">
        <div className="w-full max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 flex items-center justify-center text-[var(--text-primary)]">
            <FileText size={32} className="mr-3 text-[var(--accent)]" /> ডিজিটাল
            খতিয়ান (পর্চা) সংগ্রহ
          </h2>
          <p className="text-[var(--text-secondary)] text-lg mb-8">
            আপনার কাঙ্ক্ষিত খতিয়ান, দাগ নম্বর বা মালিকের নাম লিখে সার্চ করুন।
          </p>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-full px-6 py-4 pl-14 shadow-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-lg"
              placeholder="খতিয়ান নং, দাগ নং বা মালিকের নাম..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="absolute text-[var(--text-secondary)] top-1/2 left-5 -translate-y-1/2"
              size={24}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[var(--text-secondary)] font-bold">
            সার্ভার থেকে তথ্য খোঁজা হচ্ছে...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item, index) => (
              <div
                key={index}
                className="card-new p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold rounded-full px-4 py-1 border border-[var(--accent)]/20">
                      খতিয়ান নং: {item.JOMIHUB ? toBn(item.JOMIHUB) : "-"}
                    </span>
                  </div>
                  <h6 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2">
                    মালিক: {item.Column2 || "অজ্ঞাত"}
                  </h6>
                  <p className="text-[var(--text-secondary)] text-sm mb-6">
                    <strong className="text-[var(--text-primary)]">
                      দাগ নং:
                    </strong>{" "}
                    {item.Column4 ? toBn(item.Column4) : "অজ্ঞাত"}
                  </p>
                </div>
                <div className="pt-4 border-t border-[var(--border)] mt-auto">
                  <button
                    onClick={() => setSelectedPorcha(item)}
                    className="w-full py-2 px-4 rounded-full border border-[var(--accent)] text-[var(--accent)] font-bold flex items-center justify-center hover:bg-[var(--accent)] hover:text-[var(--bg)] transition-colors"
                  >
                    <Download size={18} className="mr-2" /> ভিউ ও ডাউনলোড
                  </button>
                </div>
              </div>
            ))}
            {filteredData.length === 0 && searchQuery && (
              <div className="col-span-full text-center py-16">
                <p className="text-[var(--text-secondary)] text-xl">
                  কোনো খতিয়ান পাওয়া যায়নি!
                </p>
              </div>
            )}
          </div>

          {hasMore && (
            <div className="text-center mt-12">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 rounded-full cta-gradient text-[var(--bg)] font-bold shadow-lg flex items-center mx-auto"
              >
                {isLoadingMore ? (
                  <>
                    <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin mr-2" />
                    লোড হচ্ছে...
                  </>
                ) : (
                  "আরও দেখুন"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {selectedPorcha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative">
            <div className="flex justify-between items-center p-6 border-b border-[var(--border)]">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                পর্চা প্রিভিউ
              </h3>
              <button
                onClick={() => setSelectedPorcha(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] rounded-full p-2"
              >
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div ref={exportRef} className="bg-white p-8 sm:p-12 text-black">
                <div className="text-center mb-8 border-b-2 border-green-600 pb-4">
                  <h2 className="text-2xl font-bold text-green-700 mb-2">
                    খতিয়ান (পর্চা) বিবরণী
                  </h2>
                  <p className="text-gray-600 font-bold mb-0">
                    ডিজিটাল রেকর্ড রুম | LandBD
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-left">
                    <tbody>
                      {[
                        [
                          "খতিয়ান নং",
                          (item: PorchaData) =>
                            item.JOMIHUB ? toBn(item.JOMIHUB) : "-",
                          "font-bold text-lg text-green-700",
                        ],
                        [
                          "মালিকের নাম",
                          (item: PorchaData) => item.Column2 || "প্রযোজ্য নয়",
                          "font-bold text-gray-900",
                        ],
                        [
                          "পিতা/স্বামীর নাম",
                          (item: PorchaData) => item.Column3 || "প্রযোজ্য নয়",
                          "text-gray-700",
                        ],
                        [
                          "দাগ নং সমূহ",
                          (item: PorchaData) =>
                            item.Column4 ? toBn(item.Column4) : "-",
                          "text-blue-700 font-semibold",
                        ],
                        [
                          "জমির পরিমাণ",
                          (item: PorchaData) =>
                            item.Column5 ? toBn(item.Column5) : "-",
                          "font-bold text-gray-900",
                        ],
                      ].map(([label, getValue, cls]) => (
                        <tr key={label as string}>
                          <th className="bg-gray-100 border border-gray-300 w-1/3 px-4 py-3 text-gray-800 font-bold">
                            {label as string}
                          </th>
                          <td
                            className={`border border-gray-300 px-4 py-3 ${cls as string}`}
                          >
                            {(
                              getValue as (item: PorchaData) => React.ReactNode
                            )(selectedPorcha!)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 pt-4 text-center text-gray-500 text-sm border-t border-gray-200">
                  * এই খতিয়ানটি ডিজিটাল কপি। দাপ্তরিক কাজের জন্য মূল কপির সাথে
                  যাচাই করুন।
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)] flex justify-center rounded-b-2xl">
              <button
                onClick={downloadPDF}
                disabled={isDownloading}
                className="cta-gradient text-[var(--bg)] px-8 py-3 rounded-full font-bold shadow-lg flex items-center hover:opacity-90 disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Download size={20} className="mr-2" />
                )}
                {isDownloading ? "ডাউনলোড হচ্ছে..." : "PDF ডাউনলোড করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
