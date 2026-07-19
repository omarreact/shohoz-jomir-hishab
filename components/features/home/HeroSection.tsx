"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Map as MapIcon, Database, Users, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { t } from "@/src/locales";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="hero-gradient pt-32 pb-20 relative overflow-hidden border-b border-c">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={`fade-in ${isLoaded ? "visible" : ""}`}>
            <div className="inline-block bg-[var(--surface)] text-[var(--text-secondary)] px-4 py-2 rounded-full text-sm font-medium mb-6 border border-c">
              🚀 LandBD 4.0 - নতুন আপডেট
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-[var(--text-primary)]">
              ভূমির হিসাব এখন <br />
              <span className="accent-text">আরও সহজ</span> ও নির্ভুল
            </h1>
            <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-lg leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dap-map"
                className="cta-gradient text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-shadow no-underline"
              >
                {t.hero.ctaPrimary}
              </Link>
              <Link
                href="#how-it-works"
                className="surface-bg text-[var(--text-primary)] border border-c px-8 py-3 rounded-xl font-medium hover:border-[var(--accent)] transition-colors no-underline"
              >
                কিভাবে কাজ করে?
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-c">
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-2xl">৫০ লাখ+</h4>
                <p className="text-[var(--text-secondary)] text-sm">খতিয়ান রেকর্ড</p>
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-2xl">১ লাখ+</h4>
                <p className="text-[var(--text-secondary)] text-sm">সক্রিয় ব্যবহারকারী</p>
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-2xl">৯৯.৯%</h4>
                <p className="text-[var(--text-secondary)] text-sm">সঠিক হিসাব</p>
              </div>
            </div>
          </div>

          {/* Right Content / App Preview */}
          <div
            className={`fade-in lg:ml-auto relative ${
              isLoaded ? "visible" : ""
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="relative z-10 w-full max-w-md mx-auto">
              {/* Decorative Card 1 */}
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#3B82F6] rounded-2xl opacity-20 blur-2xl"></div>
              {/* Decorative Card 2 */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#F6C343] rounded-2xl opacity-20 blur-2xl"></div>

              {/* Main Preview Card */}
              <div className="card-new relative bg-[var(--bg)] shadow-2xl p-6 border border-c">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F6C343]/20 flex items-center justify-center text-[#F6C343]">
                      <Search size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] text-sm">স্মার্ট অনুসন্ধান</h4>
                      <p className="text-[var(--text-secondary)] text-xs">খতিয়ান ও দাগ নম্বর</p>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">
                    সক্রিয়
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-10 bg-[var(--surface)] rounded-lg border border-c w-full"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-[var(--surface)] rounded-lg border border-c w-full"></div>
                    <div className="h-10 bg-[var(--surface)] rounded-lg border border-c w-full"></div>
                  </div>
                  <button className="w-full h-10 cta-gradient text-white font-bold rounded-lg mt-2">
                    খুঁজুন
                  </button>
                </div>

                {/* Floating elements */}
                <div className="absolute -right-12 top-20 card-new p-4 hidden md:flex items-center gap-3 shadow-lg bg-[var(--bg)] border-c animate-bounce" style={{ animationDuration: "3s" }}>
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                    <Database size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-[var(--text-primary)] text-xs">ডিজিটাল ডাটাবেস</h5>
                    <p className="text-[var(--text-secondary)] text-[10px]">আপডেট করা হয়েছে</p>
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
