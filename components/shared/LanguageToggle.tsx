"use client";

import { useLanguage } from "./LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-outline-success btn-sm rounded-pill px-3 d-flex align-items-center fw-bold transition-all shadow-sm bg-white bg-opacity-10"
      title="ভাষা পরিবর্তন করুন"
    >
      <Globe size={16} className="me-1" />
      {language === 'bn' ? 'EN' : 'বাংলা'}
    </button>
  );
}