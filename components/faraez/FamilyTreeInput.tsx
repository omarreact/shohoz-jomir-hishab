"use client";

import { useState } from "react";
import { Users, Plus, Minus, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { HeirsInput } from "@/lib/faraez/types";
import { toBn } from "@/lib/utils";

interface Props {
  heirs: HeirsInput;
  setHeirs: React.Dispatch<React.SetStateAction<HeirsInput>>;
  gender: "male" | "female";
}

export default function FamilyTreeInput({ heirs, setHeirs, gender }: Props) {
  // প্রথম সেকশনটি বাই ডিফল্ট খোলা থাকবে
  const [openSection, setOpenSection] = useState<number>(0);

  const updateCount = (key: keyof HeirsInput, delta: number) => {
    setHeirs((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const groups = [
    {
      id: 0,
      title: "প্রথম শ্রেণী (স্বামী/স্ত্রী, পিতা-মাতা, সন্তান)",
      desc: "মৃত ব্যক্তির সবচেয়ে কাছের আত্মীয়",
      theme: "success",
      controls: [
        { key: "spouse", label: gender === "male" ? "স্ত্রী" : "স্বামী", max: gender === "male" ? 4 : 1 },
        { key: "father", label: "পিতা", max: 1 },
        { key: "mother", label: "মাতা", max: 1 },
        { key: "sons", label: "পুত্র", max: 20 },
        { key: "deadSons", label: "মৃত পুত্র", max: 20 },
        { key: "daughters", label: "কন্যা", max: 20 },
        { key: "deadDaughters", label: "মৃত কন্যা", max: 20 },
      ]
    },
    {
      id: 1,
      title: "দ্বিতীয় শ্রেণী (দাদা-দাদি, নানি)",
      desc: "পিতা-মাতা জীবিত না থাকলে এরা অংশ পান",
      theme: "primary",
      controls: [
        { key: "paternalGrandFather", label: "দাদা", max: 1 },
        { key: "paternalGrandMother", label: "দাদি", max: 1 },
        { key: "maternalGrandMother", label: "নানি", max: 1 },
      ]
    },
    {
      id: 2,
      title: "তৃতীয় শ্রেণী (ভাই-বোন ও তাদের সন্তান)",
      desc: "পিতা বা পুত্র না থাকলে এরা অংশ পান",
      theme: "warning",
      controls: [
        { key: "fullBrothers", label: "সহোদর ভাই", max: 20 },
        { key: "fullSisters", label: "সহোদর বোন", max: 20 },
        { key: "consanguineBrothers", label: "সৎ ভাই (বৈমাত্রেয়)", max: 20 },
        { key: "consanguineSisters", label: "সৎ বোন (বৈমাত্রেয়)", max: 20 },
        { key: "uterineBrothers", label: "সৎ ভাই (বৈপিত্রেয়)", max: 20 },
        { key: "uterineSisters", label: "সৎ বোন (বৈপিত্রেয়)", max: 20 },
        { key: "fullBrotherSon", label: "সহোদর ভাইয়ের পুত্র", max: 20 },
        { key: "consBrotherSon", label: "সৎ ভাই(বৈমাত্রেয়)-এর পুত্র", max: 20 },
        { key: "fullBrotherSonSon", label: "সহোদর ভাইয়ের পুত্রের পুত্র", max: 20 },
        { key: "consBrotherSonSon", label: "সৎ ভাই(বৈমাত্রেয়)-এর পুত্রের পুত্র", max: 20 },
      ]
    },
    {
      id: 3,
      title: "চতুর্থ শ্রেণী (চাচা ও তাদের বংশধর)",
      desc: "পূর্ববর্তী পুরুষ ওয়ারিশ না থাকলে এরা অংশ পান",
      theme: "danger",
      controls: [
        { key: "fullPaternalUncle", label: "চাচা", max: 20 },
        { key: "consPaternalUncle", label: "চাচা (বৈমাত্রেয়)", max: 20 },
        { key: "fullCousin", label: "চাচাতো ভাই", max: 20 },
        { key: "consCousin", label: "চাচাতো ভাই (বৈমাত্রেয়)", max: 20 },
        { key: "fullCousinSon", label: "চাচাতো ভাইয়ের পুত্র", max: 20 },
        { key: "consCousinSon", label: "চাচাতো ভাই(বৈমাত্রেয়)-এর পুত্র", max: 20 },
        { key: "fullCousinSonSon", label: "চাচাতো ভাইয়ের পুত্রের পুত্র", max: 20 },
        { key: "consCousinSonSon", label: "চাচাতো ভাই(বৈমাত্রেয়)-এর পুত্রের পুত্র", max: 20 },
      ]
    }
  ];

  // মোট কতজন ওয়ারিশ সিলেক্ট করা হয়েছে তা বের করা
  const totalSelected = Object.values(heirs).reduce((a, b) => a + b, 0);

  return (
    <div className="card shadow-sm rounded-4 border-0 mb-4">
      <div className="card-header bg-success text-white p-3 d-flex justify-content-between align-items-center">
        <span className="fw-semibold d-flex align-items-center">
          <Users size={18} className="me-2" /> ওয়ারিশ/উত্তরাধিকারী নির্বাচন করুন
        </span>
        <span className="badge bg-white text-success rounded-pill px-3 py-2 shadow-sm d-flex align-items-center">
          <UserCheck size={14} className="me-1" /> মোট নির্বাচিত: {toBn(totalSelected)} জন
        </span>
      </div>
      
      <div className="card-body bg-light p-3 p-md-4">
        <div className="accordion custom-accordion" id="heirsAccordion">
          
          {groups.map((group) => {
            const isOpen = openSection === group.id;
            
            // এই গ্রুপের ভেতরে কোনো ওয়ারিশ সিলেক্ট করা আছে কি না তা চেক করা
            const hasSelectedInGroup = group.controls.some(ctrl => heirs[ctrl.key as keyof HeirsInput] > 0);

            return (
              <div key={group.id} className="card border-0 mb-3 shadow-sm rounded-4 overflow-hidden">
                <button
                  onClick={() => setOpenSection(isOpen ? -1 : group.id)}
                  className={`card-header w-100 border-0 text-start d-flex justify-content-between align-items-center p-3 transition-all ${
                    isOpen ? `bg-${group.theme} text-white` : "bg-white text-dark"
                  }`}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <h6 className="fw-bold mb-1 d-flex align-items-center">
                      {group.title} 
                      {!isOpen && hasSelectedInGroup && (
                        <span className={`badge bg-${group.theme} ms-2 rounded-circle`} style={{ width: '8px', height: '8px', padding: 0 }}> </span>
                      )}
                    </h6>
                    <small className={isOpen ? "text-white-50" : "text-muted"} style={{ fontSize: "12px" }}>
                      {group.desc}
                    </small>
                  </div>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} className="text-secondary" />}
                </button>

                {isOpen && (
                  <div className="card-body bg-white p-3 border-top fade-in">
                    <div className="row g-3">
                      {group.controls.map((ctrl) => {
                        const count = heirs[ctrl.key as keyof HeirsInput];
                        const isActive = count > 0;

                        return (
                          <div key={ctrl.key} className="col-md-6 col-lg-4">
                            <div 
                              className={`d-flex align-items-center justify-content-between p-2 rounded-3 border transition-all ${
                                isActive ? `border-${group.theme} bg-${group.theme} bg-opacity-10 shadow-sm` : "border-light bg-light"
                              }`}
                            >
                              <span className={`fw-semibold ps-2 ${isActive ? `text-${group.theme}` : "text-secondary"}`} style={{ fontSize: "13px" }}>
                                {ctrl.label}
                              </span>
                              
                              <div className="d-flex align-items-center bg-white rounded-pill border shadow-sm px-1 py-1">
                                <button
                                  onClick={() => updateCount(ctrl.key as keyof HeirsInput, -1)}
                                  disabled={count === 0}
                                  className={`btn btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center border-0 ${
                                    count === 0 ? "text-muted" : "text-danger bg-danger bg-opacity-10 hover-bg-danger"
                                  }`}
                                  style={{ width: "26px", height: "26px" }}
                                >
                                  <Minus size={14} />
                                </button>
                                
                                <span className="fw-bold text-center" style={{ minWidth: "32px", fontSize: "15px" }}>
                                  {toBn(count)}
                                </span>
                                
                                <button
                                  onClick={() => updateCount(ctrl.key as keyof HeirsInput, 1)}
                                  disabled={count >= ctrl.max}
                                  className={`btn btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center border-0 ${
                                    count >= ctrl.max ? "text-muted" : "text-success bg-success bg-opacity-10"
                                  }`}
                                  style={{ width: "26px", height: "26px" }}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
        </div>
      </div>
    </div>
  );
}