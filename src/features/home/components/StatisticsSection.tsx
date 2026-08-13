"use client";

import { useEffect, useRef, useState } from "react";
import { Users, MapPin, Database, Activity } from "lucide-react";
import { t } from "@/src/locales";

// Custom hook for number counting animation
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(easeProgress * end));
            
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return { count, nodeRef };
}

// Convert English numbers to Bengali
function toBengaliNum(num: number): string {
  const eng = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const ben = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let str = num.toString();
  for (let i = 0; i < 10; i++) {
    str = str.split(eng[i]).join(ben[i]);
  }
  return str;
}

export default function StatisticsSection() {
  const stats = [
    { label: t.stats.plots || "খতিয়ান", end: 125000, suffix: "+", icon: <MapPin size={32} className="accent-text" /> },
    { label: t.stats.districts || "জেলা", end: 64, suffix: "", icon: <Activity size={32} className="accent-text" /> },
    { label: t.stats.mouzas || "মৌজা", end: 15000, suffix: "+", icon: <Database size={32} className="accent-text" /> },
    { label: t.stats.maps || "ম্যাপ", end: 350, suffix: "+", icon: <Users size={32} className="accent-text" /> },
  ];

  return (
    <section className="py-24 bg-[var(--bg)] border-y border-c overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 fade-in visible">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
            <span className="accent-text">পরিসংখ্যানে</span> LandBD
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            সারাদেশের লক্ষাধিক মানুষ প্রতিদিন আমাদের সেবা ব্যবহার করছেন।
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => {
            const { count, nodeRef } = useCountUp(stat.end, 2000);
            return (
              <div key={i} className="fade-in visible" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-c flex items-center justify-center mx-auto mb-6 shadow-sm">
                  {stat.icon}
                </div>
                <div ref={nodeRef} className="stat-num mb-2">
                  {toBengaliNum(count)}{stat.suffix}
                </div>
                <div className="text-[var(--text-secondary)] font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
