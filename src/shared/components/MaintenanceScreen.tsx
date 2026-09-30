"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Construction,
  MapPin,
  MousePointer2,
  Sparkles,
} from "lucide-react";

const plotMessages = [
  "মৌজা স্তর সাজানো হচ্ছে…",
  "দাগের রেখা মিলিয়ে নেওয়া হচ্ছে…",
  "খতিয়ান সেবা ঝালাই হচ্ছে…",
  "নকশা আরও দ্রুত করা হচ্ছে…",
  "RS স্তর প্রস্তুত হচ্ছে…",
  "BRS ডেটা অপ্টিমাইজ হচ্ছে…",
];

const plotLabels = ["মৌজা", "দাগ", "খতিয়ান", "নকশা", "RS", "BRS"];

export default function MaintenanceScreen() {
  const [activePlot, setActivePlot] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [glow, setGlow] = useState({ x: 50, y: 45 });

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3faf6] px-4 py-8 sm:py-12"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setGlow({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
    >
      <div className="absolute inset-0 opacity-[0.07] [background-image:url('/brand/brand-pattern.svg')] [background-size:420px]" />
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(34,163,90,.16), transparent 24rem)`,
        }}
      />
      <div className="maintenance-orb maintenance-orb-one absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="maintenance-orb maintenance-orb-two absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />

      <section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white/95 px-5 py-8 text-center shadow-[0_24px_80px_rgba(0,70,61,0.14)] backdrop-blur-xl sm:px-10 sm:py-11">
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-emerald-950/5">
          <span className="maintenance-progress block h-full w-1/3 bg-gradient-to-r from-[#006A3D] via-[#22A35A] to-[#E10600]" />
        </div>

        <div className="mx-auto flex max-w-[290px] justify-center">
          <Image
            src="/brand/landbd-logo-horizontal.svg"
            alt="LandBD — সহজ জমির হিসাব"
            width={290}
            height={78}
            priority
            className="h-auto w-full motion-safe:animate-[maintenanceFloat_4s_ease-in-out_infinite]"
          />
        </div>

        <div className="relative mx-auto mt-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-600/20" />
          <div className="maintenance-ring absolute inset-2 rounded-full border-2 border-dashed border-[#22A35A]/60" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006A3D] to-[#22A35A] text-white shadow-lg shadow-emerald-900/20">
            <Construction className="h-8 w-8" strokeWidth={1.8} />
            <Sparkles className="absolute -right-2 -top-2 h-5 w-5 text-amber-400 motion-safe:animate-pulse" />
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-3.5 py-1.5 text-xs font-extrabold text-amber-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
          সাময়িক রক্ষণাবেক্ষণ
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          LandBD আরও উন্নত হচ্ছে
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-slate-600 sm:text-base">
          সিস্টেম, মানচিত্র ও ভূমি-তথ্য সেবাগুলো আরও দ্রুত ও স্থিতিশীল করার কাজ চলছে।
          একটু পরেই LandBD আবার স্বাভাবিকভাবে ফিরে আসবে।
        </p>

        <div className="mx-auto mt-7 max-w-lg rounded-[1.7rem] border border-emerald-900/10 bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 p-4 shadow-inner sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006A3D] text-white shadow-sm">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-800">LandBD Mini Map</p>
                <p className="text-[11px] font-medium text-slate-500">যেকোনো ঘরে ট্যাপ করুন</p>
              </div>
            </div>
            <MousePointer2 className="h-5 w-5 text-[#22A35A] motion-safe:animate-bounce" />
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#dcefe4] p-2">
            {plotLabels.map((label, index) => {
              const isActive = activePlot === index;
              return (
                <button
                  key={label}
                  type="button"
                  aria-label={`${label} প্লট নির্বাচন করুন`}
                  aria-pressed={isActive}
                  onClick={() => {
                    setActivePlot(index);
                    setTapCount((count) => count + 1);
                  }}
                  className={`maintenance-plot relative min-h-16 overflow-hidden rounded-xl border px-2 py-3 text-xs font-extrabold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A3D] focus-visible:ring-offset-2 sm:min-h-20 sm:text-sm ${
                    isActive
                      ? "scale-[1.04] border-[#006A3D] bg-[#006A3D] text-white shadow-lg shadow-emerald-900/20"
                      : "border-emerald-900/10 bg-white/90 text-slate-700 hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-white"
                  }`}
                >
                  <span
                    className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                      isActive ? "bg-amber-300" : "bg-emerald-200"
                    }`}
                  />
                  <span className="relative">{label}</span>
                  {isActive ? (
                    <span className="maintenance-plot-ripple absolute inset-0 rounded-xl border border-white/30" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-900/10 bg-white/75 px-3 py-2 text-xs font-bold text-slate-600"
            aria-live="polite"
          >
            <span className="h-2 w-2 rounded-full bg-[#22A35A] motion-safe:animate-pulse" />
            {plotMessages[activePlot]}
            {tapCount >= 6 ? <span aria-hidden="true">✨</span> : null}
          </div>
        </div>

        <p className="mt-6 text-xs leading-6 text-slate-400">
          সাময়িক অসুবিধার জন্য আন্তরিকভাবে দুঃখিত। LandBD টিম সেবাগুলো আরও সুন্দর,
          দ্রুত ও নির্ভরযোগ্য করতে কাজ করছে।
        </p>
      </section>

      <style jsx global>{`
        @keyframes maintenanceFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes maintenanceSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes maintenanceSlide {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(420%); }
        }
        @keyframes maintenanceOrb {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(24px, 18px, 0) scale(1.08); }
        }
        @keyframes maintenancePlotPulse {
          0% { opacity: 0; transform: scale(0.75); }
          45% { opacity: 0.65; }
          100% { opacity: 0; transform: scale(1.28); }
        }
        .maintenance-ring { animation: maintenanceSpin 12s linear infinite; }
        .maintenance-progress { animation: maintenanceSlide 2.4s ease-in-out infinite; }
        .maintenance-orb { animation: maintenanceOrb 7s ease-in-out infinite; }
        .maintenance-orb-two { animation-delay: -3.5s; }
        .maintenance-plot-ripple { animation: maintenancePlotPulse 0.75s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .maintenance-ring,
          .maintenance-progress,
          .maintenance-orb,
          .maintenance-plot-ripple {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
