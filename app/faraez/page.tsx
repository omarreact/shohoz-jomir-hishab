"use client";

import { useState, useRef } from "react";
import AppHeader from "@/components/shared/AppHeader";
import AdBanner from "@/components/shared/AdBanner";
import AssetInput from "@/components/faraez/AssetInput";
import FamilyTreeInput from "@/components/faraez/FamilyTreeInput";
import { Religion, DeceasedGender, HeirsInput, HeirResult, AssetsInput } from "@/lib/faraez/types";
import { calculateMuslimFaraez } from "@/lib/faraez/muslim-law";
// হিন্দু আইনের ফাইলটি ইমপোর্ট করা হলো
import { calculateHinduDayabhaga } from "@/lib/faraez/hindu-law";
import { Calculator, HelpCircle } from "lucide-react";
import LatestBlogs from "../../components/shared/LatestBlogs";
import dynamic from "next/dynamic";

const FaraezResult = dynamic(() => import("@/components/faraez/FaraezResult"), {
  ssr: false,
  loading: () => (
    <div className="text-center p-5 mt-4">
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-2 text-muted fw-bold">বন্টননামা প্রস্তুত করা হচ্ছে...</p>
    </div>
  ),
});

export default function FaraezPage() {
  const [religion, setReligion] = useState<Religion>("muslim");
  const [gender, setGender] = useState<DeceasedGender>("male");
  const [assets, setAssets] = useState<AssetsInput>({ land: 0, gold: 0, cash: 0, funeralCost: 0, debt: 0, wasiyat: 0 });
  const exportRef = useRef<HTMLDivElement | null>(null);
  
  const [heirs, setHeirs] = useState<HeirsInput>({
    spouse: 1, sons: 0, deadSons: 0, daughters: 0, deadDaughters: 0,
    father: 0, mother: 0, paternalGrandFather: 0, paternalGrandMother: 0, maternalGrandMother: 0,
    fullBrothers: 0, fullSisters: 0, consanguineBrothers: 0, consanguineSisters: 0, uterineBrothers: 0, uterineSisters: 0,
    fullBrotherSon: 0, consBrotherSon: 0, fullBrotherSonSon: 0, consBrotherSonSon: 0,
    fullPaternalUncle: 0, consPaternalUncle: 0, fullCousin: 0, consCousin: 0,
    fullCousinSon: 0, consCousinSon: 0, fullCousinSonSon: 0, consCousinSonSon: 0
  });
  
  const [results, setResults] = useState<HeirResult[]>([]);

  const handleCalculate = () => {
    // ধর্ম অনুযায়ী আলাদা হিসাবের লজিক চালু হবে
    if (religion === "muslim") {
      setResults(calculateMuslimFaraez(heirs, gender, assets));
    } else {
      setResults(calculateHinduDayabhaga(heirs, gender, assets));
    }
    setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const downloadMultiPagePDF = async () => {
    if (!exportRef.current) return;
    const element = exportRef.current;
    
    // ম্যাজিক: পিডিএফ বানানোর আগে সাইটকে ডেস্কটপ মোডে (800px) নিয়ে যাওয়া হচ্ছে
    const originalWidth = element.style.width;
    element.style.width = "800px";

    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      
      const opt = {
        margin:       [15, 10, 15, 10] as [number, number, number, number], 
        filename:     'Faraez_Result.pdf',
        image:        { type: 'jpeg' as 'jpeg', quality: 0.98 }, 
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 }, // windowWidth 800px ফিক্স করা হলো
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }, 
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("PDF তৈরিতে সমস্যা হয়েছে।");
    } finally {
      // পিডিএফ নামানো শেষ হলে আবার ফোনের রেগুলার ভিউতে ফিরিয়ে আনা
      element.style.width = originalWidth;
    }
  };

  const downloadExcel = () => {
    if (!results || results.length === 0) return;
    let csvContent = "ওয়ারিশ,অংশ (%),প্রাপ্ত জমি (শতাংশ),প্রাপ্ত স্বর্ণ (ভরি),প্রাপ্ত অর্থ (টাকা),আইনি ব্যাখ্যা\n";
    const validResults = results.filter((r) => r.count > 0);
    validResults.forEach((res) => {
      for (let i = 1; i <= res.count; i++) {
        const isExcluded = res.fraction === 0;
        const heirName = res.count > 1 ? `${res.heirType} ${i}` : res.heirType;
        const fractionText = isExcluded ? "বঞ্চিত" : `${(res.fraction * 100).toFixed(2)}%`;
        const land = res.assets.land > 0 ? res.assets.land.toFixed(3) : "0";
        const gold = res.assets.gold > 0 ? res.assets.gold.toFixed(3) : "0";
        const cash = res.assets.cash > 0 ? res.assets.cash.toFixed(2) : "0";
        const reasoning = res.reasoning.replace(/,/g, " "); 
        csvContent += `${heirName},${fractionText},${land},${gold},${cash},${reasoning}\n`;
      }
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Faraez_Result.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center mb-4">
        <div className="col-lg-10">
          
          <div className="accordion mb-4 shadow-sm rounded-4" id="manualFaraez">
            <div className="accordion-item border-0 rounded-4 overflow-hidden">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed bg-white text-primary fw-bold p-3 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFaraez">
                  <HelpCircle size={20} className="me-2" /> কীভাবে ব্যবহার করবেন? (নির্দেশিকা)
                </button>
              </h2>
              <div id="collapseFaraez" className="accordion-collapse collapse" data-bs-parent="#manualFaraez">
                <div className="accordion-body bg-light text-secondary lh-lg pt-2 pb-4">
                  <ol className="mb-0 ps-3">
                    <li className="mb-1">প্রথমে <strong>ধর্ম এবং মৃত ব্যক্তির লিঙ্গ</strong> নির্বাচন করুন।</li>
                    <li className="mb-1"><strong>সম্পত্তির বিবরণ</strong> অংশে মোট জমি, স্বর্ণ বা নগদ অর্থ দিন (এটি না দিলেও শুধু অংশের হার দেখা যাবে)।</li>
                    <li className="mb-1">নিচের তালিকা থেকে মৃত ব্যক্তির <strong>জীবিত ওয়ারিশদের সংখ্যা</strong> (+ বা -) বাটনে চেপে নির্ধারণ করুন।</li>
                    <li>সবশেষে <strong>সম্পত্তি বন্টন করুন</strong> বাটনে ক্লিক করলে প্রত্যেকের প্রাপ্ত অংশ দেখতে পাবেন।</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card border shadow-sm rounded-4 mb-4">
            <div className="card-body p-4 d-flex flex-wrap justify-content-between gap-3">
              {/* ধর্ম নির্বাচনের অপশন যুক্ত করা হলো */}
              <div>
                <label className="fw-bold text-muted small d-block mb-2">ধর্ম (আইন)</label>
                <div className="btn-group" role="group">
                  <button onClick={() => setReligion("muslim")} className={`btn ${religion === "muslim" ? "btn-success" : "btn-outline-secondary"}`}>মুসলিম</button>
                  <button onClick={() => setReligion("hindu")} className={`btn ${religion === "hindu" ? "btn-success" : "btn-outline-secondary"}`}>হিন্দু (দায়ভাগ)</button>
                </div>
              </div>
              <div>
                <label className="fw-bold text-muted small d-block mb-2">মৃত ব্যক্তির লিঙ্গ</label>
                <div className="btn-group" role="group">
                  <button onClick={() => { setGender("male"); setHeirs(h => ({ ...h, spouse: 1 })); }} className={`btn ${gender === "male" ? "btn-dark" : "btn-outline-secondary"}`}>পুরুষ</button>
                  <button onClick={() => { setGender("female"); setHeirs(h => ({ ...h, spouse: 1 })); }} className={`btn ${gender === "female" ? "btn-dark" : "btn-outline-secondary"}`}>মহিলা</button>
                </div>
              </div>
            </div>
          </div>

          <AssetInput assets={assets} setAssets={setAssets} />
          <FamilyTreeInput heirs={heirs} setHeirs={setHeirs} gender={gender} />
          
          <div className="text-center mt-4">
            <button onClick={handleCalculate} className="btn btn-success btn-lg px-5 rounded-pill shadow-sm fw-bold d-inline-flex align-items-center">
              <Calculator size={20} className="me-2" /> সম্পত্তি বন্টন করুন
            </button>
          </div>

          {results.length > 0 && (
            <FaraezResult 
            results={results}
            exportRef={exportRef}
            onDownloadPDF={downloadMultiPagePDF}
            onDownloadExcel={downloadExcel}
            religion={religion} // <--- এই নতুন লাইনটি যুক্ত হলো
          />
          )}
        </div>
      </div>
      <LatestBlogs />
    </div>
  );
}