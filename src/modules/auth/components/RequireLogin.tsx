"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

type RequireLoginProps = {
  children: React.ReactNode;
  /** Bangla feature name shown on the lock screen */
  featureName?: string;
};

/**
 * Client-side gate: visitors see a lock screen; logged-in users (any role)
 * get the children. Used for GIS map, mouza download, and similar member tools.
 */
export default function RequireLogin({
  children,
  featureName = "এই সেবা",
}: RequireLoginProps) {
  const { isLoggedIn, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#006a4e]" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          যাচাই করা হচ্ছে…
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    const next = encodeURIComponent(pathname || "/");
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 inline-flex rounded-full bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
            <Lock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            লগইন প্রয়োজন
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            <strong className="font-semibold text-slate-700 dark:text-slate-200">
              {featureName}
            </strong>{" "}
            শুধুমাত্র লগইন করা ব্যবহারকারী বা অ্যাডমিন দেখতে পারেন। অনুগ্রহ করে
            স্টাফ/ইউজার অ্যাকাউন্ট দিয়ে লগইন করুন।
          </p>
          <Link
            href={`/login?from=${next}`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#006a4e] px-8 text-sm font-bold text-white no-underline transition hover:opacity-90"
          >
            লগইন করুন
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
