"use client";

import { Wallet, Map, CircleDollarSign } from "lucide-react";
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
        <span className="fw-semibold">সম্পত্তির বিবরণ (ঐচ্ছিক)</span>
      </div>
      <div className="card-body bg-light p-4">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><Map size={14} className="me-1"/> জমি (শতাংশ)</label>
            <input 
              type="number" className="form-control" placeholder="যেমন: ১০০"
              onChange={(e) => handleChange("land", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><CircleDollarSign size={14} className="me-1"/> স্বর্ণ (ভরি)</label>
            <input 
              type="number" className="form-control" placeholder="যেমন: ১০"
              onChange={(e) => handleChange("gold", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-muted fw-bold small"><Wallet size={14} className="me-1"/> নগদ অর্থ (টাকা)</label>
            <input 
              type="number" className="form-control" placeholder="যেমন: ৫00000"
              onChange={(e) => handleChange("cash", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}