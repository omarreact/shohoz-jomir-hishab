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
    <section id="search" className="py-24 relative bg-[var(--bg)]">
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
        <div className="bg-[var(--surface)] rounded-3xl border border-c p-8 md:p-12 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Form */}
            <div className={`fade-in ${isLoaded ? "visible" : ""}`}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[var(--text-primary)]">
                মৌজা ও খতিয়ান <span className="accent-text">অনুসন্ধান</span>
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 text-lg">
                আপনার নির্দিষ্ট মৌজা এবং দাগ নম্বর দিয়ে বিস্তারিত খতিয়ান তথ্য খুঁজুন। সম্পূর্ণ বাংলাদেশের ম্যাপ ডাটাবেস।
              </p>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      বিভাগ
                    </label>
                    <select className="w-full bg-[var(--bg)] border border-c rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]">
                      <option>ঢাকা</option>
                      <option>চট্টগ্রাম</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      জেলা
                    </label>
                    <select className="w-full bg-[var(--bg)] border border-c rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]">
                      <option>ঢাকা</option>
                      <option>গাজীপুর</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    মৌজা / জে.এল নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="মৌজার নাম বা নম্বর লিখুন"
                    className="w-full bg-[var(--bg)] border border-c rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full cta-gradient text-[var(--bg)] font-bold text-lg py-4 rounded-xl mt-4 hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  অনুসন্ধান করুন
                </button>
              </form>
            </div>

            {/* Right Map Preview */}
            <div className={`fade-in lg:ml-auto w-full ${isLoaded ? "visible" : ""}`} style={{ transitionDelay: "200ms" }}>
              <div className="relative rounded-2xl overflow-hidden border border-c shadow-lg aspect-[4/3] bg-[var(--bg)] group">
                {/* Fallback image if real map isn't rendering */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-700"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop')",
                  }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent opacity-90"></div>

                {/* Map UI overlays */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <div className="bg-[var(--surface)] p-2 rounded-lg shadow-md border border-c">
                      <Map className="text-[var(--text-primary)]" size={20} />
                    </div>
                  </div>

                  <div className="card-new p-4 backdrop-blur-md bg-opacity-90 dark:bg-opacity-80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[var(--text-primary)] text-sm font-bold">
                          লাইভ ম্যাপ সার্ভার
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">
                        Syncing...
                      </span>
                    </div>
                    <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full animate-[progress_2s_ease-in-out_infinite]"
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
