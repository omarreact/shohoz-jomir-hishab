"use client";

import { useState } from "react";
import { Users, Plus, Minus, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { HeirsInput } from "@/lib/faraez/types";
import { toBn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

interface Props {
  heirs: HeirsInput;
  setHeirs: React.Dispatch<React.SetStateAction<HeirsInput>>;
  gender: "male" | "female";
}

export default function FamilyTreeInput({ heirs, setHeirs, gender }: Props) {
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

  const totalSelected = Object.values(heirs).reduce((a, b) => a + b, 0);

  return (
    <Card className="mb-4">
      <CardHeader className="bg-success text-success-foreground py-4 rounded-t-xl flex flex-row justify-between items-center">
        <CardTitle className="text-lg flex items-center m-0">
          <Users size={18} className="mr-2" /> 
          <span>ওয়ারিশ/উত্তরাধিকারী নির্বাচন করুন</span>
        </CardTitle>
        <div className="bg-background text-success px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center">
          <UserCheck size={14} className="mr-1.5" /> মোট নির্বাচিত: {toBn(totalSelected)} জন
        </div>
      </CardHeader>
      
      <CardContent className="bg-muted/30 p-4 md:p-6 space-y-4">
        {groups.map((group) => {
          const isOpen = openSection === group.id;
          const hasSelectedInGroup = group.controls.some(ctrl => heirs[ctrl.key as keyof HeirsInput] > 0);

          return (
            <Card key={group.id} className="overflow-hidden border-border shadow-sm">
              <button
                onClick={() => setOpenSection(isOpen ? -1 : group.id)}
                className={`w-full text-left flex justify-between items-center p-4 transition-all focus:outline-none ${
                  isOpen ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted/50"
                }`}
              >
                <div>
                  <h6 className="font-bold mb-1 flex items-center text-sm">
                    {group.title} 
                    {!isOpen && hasSelectedInGroup && (
                      <span className="w-2 h-2 rounded-full bg-primary ml-2"></span>
                    )}
                  </h6>
                  <small className={isOpen ? "text-primary-foreground/80" : "text-muted-foreground"} style={{ fontSize: "12px" }}>
                    {group.desc}
                  </small>
                </div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} className="text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="p-4 bg-card border-t border-border animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.controls.map((ctrl) => {
                      const count = heirs[ctrl.key as keyof HeirsInput];
                      const isActive = count > 0;

                      return (
                        <div 
                          key={ctrl.key} 
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background"
                          }`}
                        >
                          <span className={`font-semibold text-sm ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                            {ctrl.label}
                          </span>
                          
                          <div className="flex items-center bg-background rounded-full border border-border shadow-sm p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateCount(ctrl.key as keyof HeirsInput, -1)}
                              disabled={count === 0}
                              className={`h-7 w-7 rounded-full ${
                                count === 0 ? "text-muted-foreground opacity-50" : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                              }`}
                            >
                              <Minus size={14} />
                            </Button>
                            
                            <span className="font-bold text-center w-8 text-sm">
                              {toBn(count)}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateCount(ctrl.key as keyof HeirsInput, 1)}
                              disabled={count >= ctrl.max}
                              className={`h-7 w-7 rounded-full ${
                                count >= ctrl.max ? "text-muted-foreground opacity-50" : "text-success hover:bg-success/10 hover:text-success"
                              }`}
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}