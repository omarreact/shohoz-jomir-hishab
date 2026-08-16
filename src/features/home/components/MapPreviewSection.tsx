"use client";

import Link from "next/link";
import { Map, ArrowRight, Search, Navigation } from "lucide-react";
import { t } from "@/src/locales";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MapPreviewSection() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dap-map");
  };

  return (
    <section id="search" className="py-24 relative bg-white dark:bg-slate-950">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Form */}
            <div className={`fade-in ${isLoaded ? "visible" : ""}`}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                মৌজা ও খতিয়ান <span className="text-[#006a4e]">অনুসন্ধান</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                আপনার নির্দিষ্ট মৌজা এবং দাগ নম্বর দিয়ে বিস্তারিত খতিয়ান তথ্য খুঁজুন। সম্পূর্ণ বাংলাদেশের ম্যাপ ডাটাবেস।
              </p>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                      বিভাগ
                    </label>
                    <select className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e]">
                      <option>ঢাকা</option>
                      <option>চট্টগ্রাম</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                      জেলা
                    </label>
                    <select className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e]">
                      <option>ঢাকা</option>
                      <option>গাজীপুর</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    মৌজা / জে.এল নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="মৌজার নাম বা নম্বর লিখুন"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#006a4e] text-white font-bold text-lg py-4 rounded-xl mt-4 hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  অনুসন্ধান করুন
                </button>
              </form>
            </div>

            {/* Right Map Preview */}
            <div className={`fade-in lg:ml-auto w-full ${isLoaded ? "visible" : ""}`} style={{ transitionDelay: "200ms" }}>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg aspect-[4/3] bg-slate-100 dark:bg-slate-950 group">
                {/* Fallback image if real map isn't rendering */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-700"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop')",
                  }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent opacity-90"></div>

                {/* Map UI overlays */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
                      <Map className="text-slate-900 dark:text-white" size={20} />
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-slate-900/80 p-4 rounded-2xl backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-slate-900 dark:text-white text-sm font-bold">
                          লাইভ ম্যাপ সার্ভার
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Syncing...
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#006a4e] rounded-full animate-[progress_2s_ease-in-out_infinite]"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
