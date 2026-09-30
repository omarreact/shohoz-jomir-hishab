"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Construction,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

export default function MaintenanceAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3faf6] px-4">
        <div className="absolute inset-0 opacity-[0.07] [background-image:url('/brand/brand-pattern.svg')] [background-size:420px]" />
        <div className="relative flex flex-col items-center gap-5" role="status" aria-live="polite">
          <div className="rounded-3xl border border-emerald-900/10 bg-white/90 p-5 shadow-xl shadow-emerald-950/10 backdrop-blur">
            <Image
              src="/brand/landbd-symbol.svg"
              alt="LandBD"
              width={72}
              height={72}
              priority
              className="h-16 w-16 motion-safe:animate-[maintenanceFloat_3s_ease-in-out_infinite]"
            />
          </div>
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#006A3D]" />
            অ্যাকাউন্ট যাচাই হচ্ছে…
          </div>
        </div>
        <MaintenanceStyles />
      </div>
    );
  }

  if (isLoggedIn) return <>{children}</>;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3faf6] px-4 py-8 sm:py-12">
      <div className="absolute inset-0 opacity-[0.07] [background-image:url('/brand/brand-pattern.svg')] [background-size:420px]" />
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

        <div className="relative mx-auto mt-7 flex h-24 w-24 items-center justify-center">
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
          LandBD-তে নির্ধারিত রক্ষণাবেক্ষণ ও সিস্টেম আপডেট চলছে। এই সময়ে শুধু
          লগইন করা ব্যবহারকারীরা সেবাগুলো ব্যবহার করতে পারবেন।
        </p>

        <div className="mx-auto mt-6 grid max-w-lg gap-3 text-left sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#006A3D]" />
            <div>
              <p className="text-sm font-extrabold text-slate-800">নিরাপদ আপডেট</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                সিস্টেম ও ডেটা সেবা উন্নত করা হচ্ছে।
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#E10600]" />
            <div>
              <p className="text-sm font-extrabold text-slate-800">Member Access</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                লগইন করা ব্যবহারকারীদের প্রবেশ চালু আছে।
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#006A3D] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-[#005631] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A3D] focus-visible:ring-offset-2"
          >
            <LockKeyhole className="h-4 w-4" />
            লগইন করে প্রবেশ করুন
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-700/30 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A3D] focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            আবার চেষ্টা করুন
          </button>
        </div>

        <p className="mt-7 text-xs leading-6 text-slate-400">
          সাময়িক অসুবিধার জন্য আন্তরিকভাবে দুঃখিত। LandBD টিম কাজ করছে সেবা আরও
          দ্রুত, স্থিতিশীল ও নির্ভরযোগ্য করতে।
        </p>
      </section>

      <MaintenanceStyles />
    </main>
  );
}

function MaintenanceStyles() {
  return (
    <style jsx global>{`
      @keyframes maintenanceFloat {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-7px);
        }
      }

      @keyframes maintenanceSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes maintenanceSlide {
        0% {
          transform: translateX(-140%);
        }
        100% {
          transform: translateX(420%);
        }
      }

      @keyframes maintenanceOrb {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(24px, 18px, 0) scale(1.08);
        }
      }

      .maintenance-ring {
        animation: maintenanceSpin 12s linear infinite;
      }

      .maintenance-progress {
        animation: maintenanceSlide 2.4s ease-in-out infinite;
      }

      .maintenance-orb {
        animation: maintenanceOrb 7s ease-in-out infinite;
      }

      .maintenance-orb-two {
        animation-delay: -3.5s;
      }

      @media (prefers-reduced-motion: reduce) {
        .maintenance-ring,
        .maintenance-progress,
        .maintenance-orb {
          animation: none !important;
        }
      }
    `}</style>
  );
}
