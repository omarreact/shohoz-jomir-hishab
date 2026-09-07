"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isSuperAdminRole } from "@/src/modules/auth/roles";
import { ShieldCheck, Save, Loader2, Globe, Lock, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/src/shared/ui/button";

const DYNAMIC_PAGES = [
  { id: "/mouza-map", name: "মৌজা ম্যাপ (PDF)" },
  { id: "/geospatial-map", name: "GIS ডাইনামিক ম্যাপ" },
  { id: "/dlrms-khatian", name: "DLRMS খতিয়ান অনুসন্ধান" },
  { id: "/dap-map", name: "RAJUK DAP ম্যাপ" },
  { id: "/faraez", name: "ফরায়েজ ক্যালকুলেটর" },
  { id: "/land-measurement", name: "ভূমি পরিমাপ" },
  { id: "/khatiyan", name: "খতিয়ান ক্যালকুলেটর" },
  { id: "/settlement-khatian", name: "সেটেলমেন্ট খতিয়ান" }
];

const ACCESS_LEVELS = [
  { value: "public", label: "সবার জন্য উন্মুক্ত (Public)", icon: Globe },
  { value: "logged_in", label: "লগইনকৃত ইউজার (Logged In)", icon: Lock },
  { value: "admin", label: "শুধুমাত্র এডমিন (Admin)", icon: ShieldCheck },
  { value: "super_admin", label: "শুধুমাত্র সুপার এডমিন (Super Admin)", icon: ShieldAlert },
  { value: "hidden", label: "পুরোপুরি বন্ধ (Hidden)", icon: FileText }
];

export default function PageAccessAdmin() {
  const { user, isLoggedIn, loading: authChecking } = useAuth();
  const [accessRules, setAccessRules] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/page-access")
      .then(res => res.json())
      .then(data => {
        if (data?.access) setAccessRules(data.access);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (authChecking || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  // Only Super Admins should ideally control this, or Admins if you allow it. 
  // Let's restrict to Super Admin as requested.
  if (!isLoggedIn || !isSuperAdminRole(user?.role)) {
    return (
      <div className="p-8 text-center text-red-500">
        <ShieldAlert size={48} className="mx-auto mb-4" />
        <h2 className="text-xl font-bold">অননুমোদিত অ্যাক্সেস</h2>
        <p>এই পেজটি শুধুমাত্র সুপার এডমিনদের জন্য সীমাবদ্ধ।</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/page-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accessRules),
      });
      if (res.ok) setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (pageId: string, level: string) => {
    setAccessRules(prev => ({ ...prev, [pageId]: level }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">পেইজ অ্যাক্সেস কন্ট্রোল</h1>
        <p className="mt-1 text-sm text-slate-500">
          অ্যাপের গুরুত্বপূর্ণ পেইজগুলো কে দেখতে পারবে তা এখান থেকে নিয়ন্ত্রণ করুন।
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-6">
          {DYNAMIC_PAGES.map((page) => {
            const currentLevel = accessRules[page.id] || "public";
            return (
              <div key={page.id} className="flex flex-col gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{page.name}</h3>
                  <p className="text-xs text-slate-500">Path: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{page.id}</code></p>
                </div>
                
                <div className="w-full md:w-64">
                  <select 
                    value={currentLevel}
                    onChange={(e) => handleChange(page.id, e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {ACCESS_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
          {success && (
            <span className="flex items-center text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={16} className="mr-1" /> আপডেট সম্পন্ন হয়েছে
            </span>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#006a4e] text-white hover:bg-[#005a42]"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            সেভ করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
