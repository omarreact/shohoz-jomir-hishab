"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole, isSuperAdminRole } from "@/src/modules/auth/roles";

type DynamicPageGateProps = {
  pageId: string;
  featureName: string;
  children: React.ReactNode;
};

export default function DynamicPageGate({ pageId, featureName, children }: DynamicPageGateProps) {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [accessRules, setAccessRules] = useState<Record<string, string>>({});
  const [rulesLoading, setRulesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/page-access")
      .then(res => res.json())
      .then(data => {
        if (data?.access) setAccessRules(data.access);
      })
      .catch(console.error)
      .finally(() => setRulesLoading(false));
  }, []);

  if (authLoading || rulesLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#006a4e]" />
        <p className="text-sm font-medium text-slate-500">অপেক্ষা করুন...</p>
      </div>
    );
  }

  // Determine required access level for this page. Default to public if not defined.
  const requiredAccess = accessRules[pageId] || "public";

  if (requiredAccess === "public") {
    return <>{children}</>;
  }

  if (requiredAccess === "hidden") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">পেইজটি বন্ধ আছে</h1>
        <p className="text-slate-500">এই মুহূর্তে পেইজটি সাধারণ ইউজারদের জন্য উন্মুক্ত নয়।</p>
      </div>
    );
  }

  // All other roles require at least being logged in
  if (!isLoggedIn) {
    const next = encodeURIComponent(pathname || "/");
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-5 inline-flex rounded-full bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
            <Lock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">লগইন প্রয়োজন</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            <strong className="font-semibold text-slate-700 dark:text-slate-200">{featureName}</strong> ব্যবহার করতে অনুগ্রহ করে লগইন করুন।
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

  // Check specific roles
  const userRole = user?.role;

  if (requiredAccess === "super_admin" && !isSuperAdminRole(userRole)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">অনুমতি নেই</h1>
        <p className="text-slate-500">এই ফিচারটি শুধুমাত্র সুপার এডমিনদের জন্য সীমাবদ্ধ।</p>
      </div>
    );
  }

  if (requiredAccess === "admin" && !isAdminRole(userRole)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">অনুমতি নেই</h1>
        <p className="text-slate-500">এই ফিচারটি শুধুমাত্র এডমিনদের জন্য সীমাবদ্ধ।</p>
      </div>
    );
  }

  return <>{children}</>;
}
