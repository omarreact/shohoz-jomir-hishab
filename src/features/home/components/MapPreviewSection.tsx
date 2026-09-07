import Link from "next/link";
import { Map, MousePointer2, Layers, ArrowRight } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

const MAP_POINTS = [
  {
    icon: Layers,
    title: "RS + MS টাইল",
    desc: "লগইন ছাড়াই মৌজা মানচিত্র দেখুন",
  },
  {
    icon: MousePointer2,
    title: "প্লট ট্যাপ",
    desc: "ক্লিক করে RS ও MS ফলাফল একসাথে",
  },
  {
    icon: Map,
    title: "সীমানা ও বেসম্যাপ",
    desc: "জুম করে স্যাটেলাইট বা রাস্তার মানচিত্র",
  },
];

export default function MapPreviewSection() {
  return (
    <section
      id="map"
      className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="grid items-stretch lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#006a4e]">
                জিআইএস
              </p>
              <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                নগর পরিকল্পনা{" "}
                <span className="text-[#006a4e]">মানচিত্র</span>
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500 dark:text-slate-400 md:text-lg">
                RAJUK এলাকার RS ও MS মৌজা টাইল লাইভ দেখুন। প্লটে ট্যাপ করে দাগ
                নম্বর ও ঠিকানা পান—পাবলিক ব্যবহারকারীর জন্যও উন্মুক্ত।
              </p>

              <ul className="mb-8 space-y-4">
                {MAP_POINTS.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#006a4e]/10">
                      <item.icon size={18} className="text-[#006a4e]" />
                    </div>
                    <div>
                      <p className="m-0 font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="m-0 text-sm text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href={FEATURE_ROUTES.landMap}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#006a4e] px-6 py-4 text-base font-bold text-white no-underline shadow-lg shadow-[#006a4e]/20 transition hover:bg-[#005a42] sm:w-auto"
              >
                <Map size={18} />
                মানচিত্র খুলুন
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="relative min-h-[280px] bg-gradient-to-br from-[#006a4e]/90 via-[#0a7a5c] to-slate-900 p-8 md:min-h-[360px] md:p-12">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }}
                aria-hidden
              />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
                  <span className="text-sm font-semibold text-white/90">
                    লাইভ ম্যাপ সার্ভার
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                    <p className="m-0 text-xs font-medium uppercase tracking-wide text-white/70">
                      পাবলিক লেয়ার
                    </p>
                    <p className="m-0 mt-1 text-lg font-bold text-white">
                      RS Mauza · MS Mauza
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm">
                    <p className="m-0 text-sm text-white/85">
                      প্লটে ট্যাপ করুন → RS ও MS ফলাফল একসাথে
                    </p>
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
