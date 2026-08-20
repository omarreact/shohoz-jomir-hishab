"use client";

import { useEffect, useRef, useState } from "react";
import { Users, MapPin, Database, Activity, type LucideIcon } from "lucide-react";
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

type StatItemProps = {
  label: string;
  end: number;
  suffix: string;
  icon: LucideIcon;
  delayMs: number;
};

function StatItem({ label, end, suffix, icon: Icon, delayMs }: StatItemProps) {
  const { count, nodeRef } = useCountUp(end, 2000);

  return (
    <div className="fade-in visible group" style={{ transitionDelay: `${delayMs}ms` }}>
      <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:bg-[#006a4e]/10 group-hover:border-[#006a4e]/20 transition-colors duration-300">
        <Icon size={36} className="text-[#006a4e]" />
      </div>
      <div ref={nodeRef} className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
        {toBengaliNum(count)}
        {suffix}
      </div>
      <div className="text-slate-500 dark:text-slate-400 font-medium text-lg">{label}</div>
    </div>
  );
}

export default function StatisticsSection() {
  const stats = [
    { label: t.stats.plots || "খতিয়ান", end: 125000, suffix: "+", icon: MapPin },
    { label: t.stats.districts || "জেলা", end: 64, suffix: "", icon: Activity },
    { label: t.stats.mouzas || "মৌজা", end: 15000, suffix: "+", icon: Database },
    { label: t.stats.maps || "ম্যাপ", end: 350, suffix: "+", icon: Users },
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 fade-in visible">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            <span className="text-[#006a4e]">পরিসংখ্যানে</span> সহজ জমির হিসাব
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            সারাদেশের লক্ষাধিক মানুষ প্রতিদিন আমাদের সেবা ব্যবহার করছেন।
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <StatItem
              key={i}
              label={stat.label}
              end={stat.end}
              suffix={stat.suffix}
              icon={stat.icon}
              delayMs={i * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
