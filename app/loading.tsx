"use client";

import Image from "next/image";
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
    <main className="flex min-h-[60vh] items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-16" aria-label="পেজ লোড হচ্ছে" aria-busy="true">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-2 rounded-full bg-[#D9F2E3] blur-xl" aria-hidden />
          <div className={`absolute inset-0 rounded-full border-[3px] border-[#D9F2E3] border-t-[#006A3D] ${reducedMotion ? "" : "animate-spin"}`} style={{ animationDuration: "1.15s" }} aria-hidden />
          <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#006A3D]/10 ${reducedMotion ? "" : "animate-pulse"}`} aria-hidden>
            <Image src="/brand/landbd-symbol.svg" width={52} height={52} alt="" className="h-13 w-13" priority />
          </div>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#006A3D] sm:text-2xl">LandBD</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">সহজ জমির হিসাব</p>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">তথ্য প্রস্তুত হচ্ছে<span className={reducedMotion ? "" : "animate-pulse"}>…</span></p>
        <div className="mt-5 h-1.5 w-32 overflow-hidden rounded-full bg-[#D9F2E3]">
          <div className="h-full w-1/2 rounded-full bg-[#006A3D]" style={{ animation: reducedMotion ? undefined : "loading-progress 1.4s ease-in-out infinite" }} />
        </div>
        <span className="sr-only">অনুগ্রহ করে একটু অপেক্ষা করুন</span>
      </div>
      <style jsx>{`@keyframes loading-progress { 0% { transform: translateX(-100%); } 50% { transform: translateX(100%); } 100% { transform: translateX(220%); } }`}</style>
    </main>
  );
}
