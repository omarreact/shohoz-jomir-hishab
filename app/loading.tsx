"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <main
      className="flex min-h-[60vh] items-center justify-center overflow-hidden bg-[#F8FAF9] px-4 py-16 dark:bg-slate-950"
      aria-label="পেজ লোড হচ্ছে"
      aria-busy="true"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-[#1A6B3C]/10 blur-xl"
            aria-hidden="true"
          />
          <div
            className={`absolute inset-0 rounded-full border-4 border-[#1A6B3C]/10 border-t-[#1A6B3C] border-r-[#1A6B3C]/70 ${
              reducedMotion ? "" : "animate-spin"
            }`}
            style={{ animationDuration: "1.1s" }}
            aria-hidden="true"
          />
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#1A6B3C]/10 dark:bg-slate-900 ${
              reducedMotion ? "" : "animate-pulse"
            }`}
            aria-hidden="true"
          >
            <span className="text-2xl font-bold text-[#1A6B3C]">জ</span>
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#0D1F17] dark:text-white sm:text-2xl">
          সহজ জমির হিসাব
        </h1>
        <p className="mt-2 text-sm text-[#5A7268] dark:text-slate-400 sm:text-base">
          লোড হচ্ছে<span className={reducedMotion ? "" : "animate-pulse"}>…</span>
        </p>

        <div className="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-[#E4EDE8] dark:bg-slate-800">
          <div
            className={`h-full w-1/2 rounded-full bg-[#1A6B3C] ${
              reducedMotion ? "" : "animate-[loading-progress_1.4s_ease-in-out_infinite]"
            }`}
            style={{
              animation: reducedMotion
                ? undefined
                : "loading-progress 1.4s ease-in-out infinite",
            }}
          />
        </div>

        <span className="sr-only">অনুগ্রহ করে একটু অপেক্ষা করুন</span>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </main>
  );
}
