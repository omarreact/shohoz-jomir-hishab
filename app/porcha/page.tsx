"use client";

import { useState, useEffect, useRef } from "react";
import { Search, FileText, Download } from "lucide-react";
import { toBn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // ইউজারের সার্চ অনুযায়ী API থেকে সরাসরি সিকিউর ডাটা নিয়ে আসা (Debounce System)
  useEffect(() => {
    setLoading(true);

    // ইউজার টাইপ করার আধা-সেকেন্ড (500ms) পর সার্চ হবে, যেন সার্ভারে চাপ না পড়ে
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/porcha?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data) => {
          setFilteredData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading porcha data:", err);
          setFilteredData([]);
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const downloadPDF = async () => {
    if (!exportRef.current) return;
    setIsDownloading(true);

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `Khotiyan_${selectedPorcha?.JOMIHUB}.pdf`,
        image: { type: "jpeg" as `jpeg`, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as `portrait`,
        },
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

  return (
    <div className="container py-5 fade-in">
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8 text-center">
          <h2 className="fw-bold text-success mb-3 d-flex align-items-center justify-content-center">
            <FileText size={28} className="me-2" /> ডিজিটাল খতিয়ান (পর্চা)
            সংগ্রহ
          </h2>
          <p className="text-muted">
            আপনার কাঙ্ক্ষিত খতিয়ান, দাগ নম্বর বা মালিকের নাম লিখে সার্চ করুন
            এবং ডাউনলোড করুন।
          </p>

          <div className="position-relative mt-4 shadow-sm rounded-pill">
            <input
              type="text"
              className="form-control form-control-lg border-success rounded-pill ps-5"
              placeholder="খতিয়ান নং, দাগ নং বা মালিকের নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="position-absolute text-muted"
              size={20}
              style={{ top: "15px", left: "20px" }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted fw-bold">
            সার্ভার থেকে তথ্য খোঁজা হচ্ছে...
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredData.map((item, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 rounded-4 h-100 hover-shadow transition-all">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge bg-success bg-opacity-10 text-success fs-6 rounded-pill px-3 py-2">
                      খতিয়ান নং: {item.JOMIHUB ? toBn(item.JOMIHUB) : "-"}
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">
                    মালিক: {item.Column2 || "অজ্ঞাত"}
                  </h6>
                  <p className="text-muted small mb-0 mt-2 text-truncate">
                    <strong>দাগ নং:</strong>{" "}
                    {item.Column4 ? toBn(item.Column4) : "অজ্ঞাত"}
                  </p>
                </div>
                <div className="card-footer bg-transparent border-top p-3 text-center">
                  <button
                    onClick={() => setSelectedPorcha(item)}
                    className="btn btn-outline-success fw-bold rounded-pill w-100 d-flex align-items-center justify-content-center"
                    data-bs-toggle="modal"
                    data-bs-target="#khotiyanModal"
                  >
                    <Download size={16} className="me-2" /> ভিউ ও ডাউনলোড
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted fs-5">কোনো খতিয়ান পাওয়া যায়নি!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <div
        className="modal fade"
        id="khotiyanModal"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content rounded-4 border-0 shadow-lg">
            <div className="modal-header border-bottom-0 pb-0">
              <button
                onClick={() => setSelectedPorcha(null)}
                type="button"
                className="btn-close shadow-none"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body p-0">
              {selectedPorcha ? (
                <div ref={exportRef} className="bg-white p-5">
                  <div className="text-center mb-5 border-bottom border-success border-2 pb-3">
                    <h2 className="fw-bold text-success mb-2">
                      খতিয়ান (পর্চা) বিবরণী
                    </h2>
                    <p className="text-muted fw-bold mb-0">
                      ডিজিটাল রেকর্ড রুম | সহজ জমির হিসাব
                    </p>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered border-secondary align-middle">
                      <tbody>
                        <tr>
                          <th className="bg-light w-25 px-4 py-3 text-dark">
                            খতিয়ান নং
                          </th>
                          <td className="px-4 py-3 fw-bold fs-5 text-success">
                            {selectedPorcha.JOMIHUB
                              ? toBn(selectedPorcha.JOMIHUB)
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-light px-4 py-3 text-dark">
                            মালিকের নাম
                          </th>
                          <td className="px-4 py-3 fw-bold">
                            {selectedPorcha.Column2 || "প্রযোজ্য নয়"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-light px-4 py-3 text-dark">
                            পিতা/স্বামীর নাম
                          </th>
                          <td className="px-4 py-3 text-muted">
                            {selectedPorcha.Column3 || "প্রযোজ্য নয়"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-light px-4 py-3 text-dark">
                            দাগ নং সমূহ
                          </th>
                          <td className="px-4 py-3 text-primary fw-semibold">
                            {selectedPorcha.Column4
                              ? toBn(selectedPorcha.Column4)
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-light px-4 py-3 text-dark">
                            জমির পরিমাণ / অংশ
                          </th>
                          <td className="px-4 py-3 fw-bold">
                            {selectedPorcha.Column5
                              ? toBn(selectedPorcha.Column5)
                              : "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-5 pt-3 text-center text-muted small border-top">
                    * এই খতিয়ানটি ডিজিটাল কপি। দাপ্তরিক কাজের জন্য মূল কপির
                    সাথে যাচাই করে নেওয়ার অনুরোধ করা হলো।
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center text-muted">
                  ডাটা লোড হচ্ছে...
                </div>
              )}
            </div>
            <div className="modal-footer border-top-0 justify-content-center bg-light rounded-bottom-4 p-4">
              <button
                onClick={downloadPDF}
                disabled={isDownloading || !selectedPorcha}
                className="btn btn-danger px-5 rounded-pill fw-bold shadow-sm d-flex align-items-center"
              >
                {isDownloading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <Download size={18} className="me-2" />
                )}
                {isDownloading ? "ডাউনলোড হচ্ছে..." : "PDF ডাউনলোড করুন"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
