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
      className="flex min-h-[60vh] items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-16"
      aria-label="পেজ লোড হচ্ছে"
      aria-busy="true"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
          <div className="absolute inset-0 rounded-full bg-[var(--brand-gold-soft)] blur-xl" aria-hidden />
          <div
            className={`absolute inset-0 rounded-full border-[3px] border-[var(--brand-gold-soft)] border-t-[var(--brand-gold)] ${
              reducedMotion ? "" : "animate-spin"
            }`}
            style={{ animationDuration: "1.05s" }}
            aria-hidden
          />
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-[var(--brand-gold-text)] shadow-sm ring-1 ring-[var(--border-color)] sm:h-14 sm:w-14 sm:text-xl ${
              reducedMotion ? "" : "animate-pulse"
            }`}
            aria-hidden
          >
            BD
          </div>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-2xl">
          সহজ জমির হিসাব
        </h1>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)] sm:text-base">
          তথ্য প্রস্তুত হচ্ছে<span className={reducedMotion ? "" : "animate-pulse"}>…</span>
        </p>

        <div className="mt-5 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full w-1/2 rounded-full bg-[var(--brand-gold)]"
            style={{
              animation: reducedMotion ? undefined : "loading-progress 1.4s ease-in-out infinite",
            }}
          />
        </div>

        <span className="sr-only">অনুগ্রহ করে একটু অপেক্ষা করুন</span>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </main>
  );
}
