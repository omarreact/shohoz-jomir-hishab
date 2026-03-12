"use client";

import { Wallet, Map, CircleDollarSign, Receipt, CreditCard, FileText } from "lucide-react";
import { AssetsInput } from "@/lib/faraez/types";

interface Props {
  assets: AssetsInput;
  setAssets: React.Dispatch<React.SetStateAction<AssetsInput>>;
}

export default function AssetInput({ assets, setAssets }: Props) {
  const handleChange = (key: keyof AssetsInput, value: string) => {
    const num = parseFloat(value);
    setAssets(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  return (
    <div className="card shadow-sm rounded-4 border-0 mb-4">
      <div className="card-header bg-primary text-white p-3 d-flex align-items-center">
        <Wallet size={18} className="me-2" />
        <span className="fw-semibold">সম্পত্তির বিবরণ ও খরচ (ঐচ্ছিক)</span>
      </div>
      <div className="card-body bg-light p-4">
        
        {/* রেখে যাওয়া সম্পত্তি */}
        <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">রেখে যাওয়া সম্পত্তি</h6>
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><Map size={14} className="me-1"/> জমি (শতাংশ)</label>
            <input 
              type="number" className="form-control" placeholder="যেমন: ১০০"
              onChange={(e) => handleChange("land", e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><CircleDollarSign size={14} className="me-1"/> স্বর্ণ (ভরি)</label>
            <input 
              type="number" className="form-control" placeholder="যেমন: ১০"
              onChange={(e) => handleChange("gold", e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><Wallet size={14} className="me-1"/> নগদ অর্থ (টাকা)</label>
            <input 
              type="number" className="form-control" placeholder="যেমন: ৫০০০০"
              onChange={(e) => handleChange("cash", e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* খরচ ও কর্তন */}
        <h6 className="fw-bold text-danger mb-3 border-bottom pb-2 mt-2">খরচ ও কর্তন (নগদ অর্থ থেকে বাদ যাবে)</h6>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><Receipt size={14} className="me-1"/> কাফন-দাফন খরচ (টাকা)</label>
            <input 
              type="number" className="form-control border-danger border-opacity-50" placeholder="যেমন: ১০০০০"
              onChange={(e) => handleChange("funeralCost", e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><CreditCard size={14} className="me-1"/> ঋণ বা দেনা (টাকা)</label>
            <input 
              type="number" className="form-control border-danger border-opacity-50" placeholder="যেমন: ২০০০০"
              onChange={(e) => handleChange("debt", e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><FileText size={14} className="me-1"/> অসিয়ত (টাকা - সর্বোচ্চ ১/৩)</label>
            <input 
              type="number" className="form-control border-danger border-opacity-50" placeholder="যেমন: ১০০০০"
              onChange={(e) => handleChange("wasiyat", e.target.value)}
              min="0"
            />
          </div>
        </div>

      </div>
    </div>
  );
}