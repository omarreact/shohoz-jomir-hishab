"use client";

import Link from "next/link";
import { Calculator, Ruler, Scale, BookOpen, ArrowRight, Map } from "lucide-react";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative overflow-hidden py-12 lg:py-20 bg-slate-50 dark:bg-slate-950">
      {/* Decorative blur orbs */}
      <div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 bg-[#006a4e]/20 rounded-full pointer-events-none"
        style={{ width: 400, height: 400, filter: "blur(80px)" }}
      />
      <div
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 bg-[#006a4e]/10 rounded-full pointer-events-none"
        style={{ width: 500, height: 500, filter: "blur(100px)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Headline + CTA */}
          <div className="text-center lg:text-left">
            <div
              className={`inline-flex items-center bg-white dark:bg-slate-900 rounded-full px-4 py-2 shadow-sm mb-6 border border-[#006a4e]/25 fade-in ${isLoaded ? 'visible' : ''}`}
            >
              <span className="bg-[#f42a41] text-white rounded-full mr-3 px-3 py-1 text-xs font-bold">১০০% ফ্রি</span>
              <span className="text-slate-800 dark:text-slate-200 text-sm font-bold">বাংলাদেশের সবচেয়ে নির্ভুল ভূমি ক্যালকুলেটর!</span>
            </div>

            <h1
              className={`font-extrabold text-4xl lg:text-5xl mb-6 text-slate-900 dark:text-white leading-tight fade-in ${isLoaded ? 'visible' : ''}`}
              style={{ transitionDelay: "100ms" }}
            >
              ভূমি হিসাব ও ফারায়েজের{" "}
              <br className="hidden lg:block" />
              <span className="text-[#006a4e] relative inline-block">
                সবচেয়ে স্মার্ট সমাধান
                <svg
                  className="absolute w-full left-0 bottom-0 opacity-30"
                  viewBox="0 0 100 15"
                  preserveAspectRatio="none"
                  style={{ height: 12, transform: "translateY(5px)" }}
                >
                  <path
                    d="M0 10 Q 50 0 100 10"
                    stroke="#006a4e"
                    strokeWidth="4"
                    fill="transparent"
                  />
                </svg>
              </span>
            </h1>

            <p
              className={`text-slate-600 dark:text-slate-400 mb-10 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 fade-in ${isLoaded ? 'visible' : ''}`}
              style={{ transitionDelay: "200ms" }}
            >
              খতিয়ানের আনা-গন্ডা, জমির সঠিক পরিমাপ এবং আইনি উত্তরাধিকার
              (ফারায়েজ)—সবকিছুর নির্ভুল হিসাব করুন এক ক্লিকেই। কোনো
              খাতা-কলমের প্রয়োজন নেই!
            </p>

            <div
              className={`flex flex-wrap justify-center lg:justify-start gap-4 fade-in ${isLoaded ? 'visible' : ''}`}
              style={{ transitionDelay: "300ms" }}
            >
              <Link
                href="/khatiyan"
                className="bg-[#006a4e] text-white rounded-full px-6 py-4 font-bold shadow-lg flex items-center hover:shadow-xl hover:-translate-y-1 transition-all no-underline"
              >
                <Calculator size={20} className="mr-2" /> খতিয়ান ক্যালকুলেটর
              </Link>
              <Link
                href="/land-measurement"
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full px-6 py-4 font-bold flex items-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all no-underline"
              >
                <Ruler size={20} className="mr-2 text-[#006a4e]" /> জমি পরিমাপ
              </Link>
            </div>

            {/* Quick-access chip row */}
            <div className={`flex flex-wrap gap-2 mt-8 justify-center lg:justify-start fade-in ${isLoaded ? 'visible' : ''}`} style={{ transitionDelay: "400ms" }}>
              <Link href="/dap-map" className="bg-slate-900 dark:bg-slate-800 text-white no-underline px-4 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
                <Map size={14} /> ফুল ড্যাপ ম্যাপ
              </Link>
              <Link href="/faraez" className="bg-slate-900 dark:bg-slate-800 text-white no-underline px-4 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
                <ArrowRight size={14} /> ফারায়েজ ক্যালকুলেটর
              </Link>
              <Link href="/blog" className="bg-slate-900 dark:bg-slate-800 text-white no-underline px-4 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
                <BookOpen size={14} /> ভূমি ব্লগ
              </Link>
            </div>
          </div>

          {/* Right: Floating Cards (desktop only) */}
          <div className={`hidden lg:block fade-in ${isLoaded ? 'visible' : ''}`} style={{ transitionDelay: "500ms" }}>
            <div className="grid grid-cols-2 gap-6 items-center">
              <div className="space-y-6">
                <div
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center hover:-translate-y-2 transition-transform duration-300"
                  style={{ transform: "translateY(20px)" }}
                >
                  <div className="bg-[#006a4e]/10 rounded-full inline-flex p-4 mb-4">
                    <Scale size={40} className="text-[#006a4e]" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-lg">নির্ভুল বন্টন</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-sm m-0">কোরআনিক নিয়মে ফারায়েজ</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 text-center hover:-translate-y-2 transition-transform duration-300">
                  <div className="bg-white/10 rounded-full inline-flex p-4 mb-4">
                    <Calculator size={40} className="text-white" />
                  </div>
                  <h5 className="font-bold text-white text-lg">আনা-গন্ডা হিসাব</h5>
                  <p className="text-white/75 text-sm m-0">সিএস, এসএ, আরএস খতিয়ান</p>
                </div>
              </div>
              <div className="space-y-6">
                <div
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center hover:-translate-y-2 transition-transform duration-300"
                  style={{ transform: "translateY(-20px)" }}
                >
                  <div className="bg-[#006a4e]/10 rounded-full inline-flex p-4 mb-4">
                    <Ruler size={40} className="text-[#006a4e]" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-lg">জমি মাপ</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-sm m-0">স্কয়ার ফিট ও শতাংশ</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden hover:-translate-y-2 transition-transform duration-300">
                  <div className="bg-[#f42a41]/10 rounded-full inline-flex p-4 mb-4">
                    <BookOpen size={40} className="text-[#f42a41]" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-lg">আইনি পরামর্শ</h5>
                  <p className="text-slate-500 dark:text-slate-400 text-sm m-0">জমি ক্রয়-বিক্রয় ব্লগ</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
