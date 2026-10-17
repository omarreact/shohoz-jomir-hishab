"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isSuperAdminRole } from "@/src/modules/auth/roles";
import {
  Settings as SettingsIcon,
  Save,
  Info,
  Link as LinkIcon,
  Globe,
  Phone,
  Mail,
  ShieldOff,
} from "lucide-react";

interface AppSettings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  facebookUrl: string;
  youtubeUrl: string;
  maintenanceMode: boolean;
  searchIndexingEnabled: boolean;
  announcement: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  siteName: "LandBD",
  contactEmail: "",
  contactPhone: "",
  facebookUrl: "",
  youtubeUrl: "",
  maintenanceMode: false,
  searchIndexingEnabled: false,
  announcement: "",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [publicAccessOverride, setPublicAccessOverride] = useState(false);
  const canChangeMaintenance = isSuperAdminRole(user?.role) && !publicAccessOverride;
  const canChangeSearchIndexing = isSuperAdminRole(user?.role);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) {
          setPublicAccessOverride(data.publicAccessOverride === true);
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            maintenanceMode: data.settings.maintenanceMode === true,
            searchIndexingEnabled: data.settings.searchIndexingEnabled === true,
          }));
        }
      })
      .catch((err) => {
        console.error("Error fetching settings:", err);
        setErrorMsg("সেটিংস লোড করতে সমস্যা হয়েছে।");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    setSaveOk(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveOk(false);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            siteName: settings.siteName,
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone,
            facebookUrl: settings.facebookUrl,
            youtubeUrl: settings.youtubeUrl,
            announcement: settings.announcement,
            ...(canChangeMaintenance ? { maintenanceMode: settings.maintenanceMode } : {}),
            ...(canChangeSearchIndexing ? { searchIndexingEnabled: settings.searchIndexingEnabled } : {}),
          },
        ),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveOk(true);
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMsg("সেটিংস আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in visible">
      <div className="mb-6 flex flex-col gap-1 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold-text)]">
            Control
          </p>
          <h3 className="text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
            গ্লোবাল সেটিংস
          </h3>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-gold)] border-t-transparent" />
        </div>
      ) : errorMsg && !settings.siteName ? (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-600">
          <h5 className="mb-2 text-lg font-bold">এরর</h5>
          <p className="mb-0">{errorMsg}</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-[var(--border-color)] border-t-4 border-t-[var(--brand-gold)] bg-[var(--card-bg)] p-5 shadow-sm sm:rounded-3xl sm:p-8">
              <h5 className="mb-5 flex items-center text-lg font-extrabold text-[var(--foreground)] sm:text-xl">
                <Globe size={22} className="mr-2 text-[var(--brand-gold-text)]" /> সাধারণ তথ্য
              </h5>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-[var(--foreground)]">
                  ওয়েবসাইটের নাম
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--canvas)] px-4 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--brand-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[var(--foreground)]">
                  জরুরি নোটিশ / ঘোষণা
                </label>
                <textarea
                  name="announcement"
                  rows={4}
                  placeholder="হোমপেজে দেখানোর জন্য কোনো জরুরি নোটিশ..."
                  value={settings.announcement}
                  onChange={handleChange}
                  className="w-full resize-y rounded-xl border border-[var(--border-color)] bg-[var(--canvas)] px-4 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--brand-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold)]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-color)] border-t-4 border-t-cyan-500 bg-[var(--card-bg)] p-5 shadow-sm sm:rounded-3xl sm:p-8">
              <h5 className="mb-5 flex items-center text-lg font-extrabold text-cyan-600 sm:text-xl">
                <Info size={22} className="mr-2" /> যোগাযোগ ও সোশ্যাল মিডিয়া
              </h5>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center text-sm font-bold text-[var(--foreground)]">
                    <Mail size={16} className="mr-2" /> ইমেইল
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--canvas)] px-4 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--brand-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold)]"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center text-sm font-bold text-[var(--foreground)]">
                    <Phone size={16} className="mr-2" /> ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--canvas)] px-4 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--brand-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold)]"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center text-sm font-bold text-[var(--foreground)]">
                    <LinkIcon size={16} className="mr-2" /> Facebook URL
                  </label>
                  <input
                    type="url"
                    name="facebookUrl"
                    value={settings.facebookUrl}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--canvas)] px-4 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--brand-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold)]"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center text-sm font-bold text-[var(--foreground)]">
                    <LinkIcon size={16} className="mr-2" /> YouTube URL
                  </label>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={settings.youtubeUrl}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--canvas)] px-4 py-3 text-[var(--foreground)] shadow-sm transition focus:border-[var(--brand-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-[var(--border-color)] border-t-4 border-t-emerald-500 bg-[var(--card-bg)] p-5 shadow-sm sm:rounded-3xl sm:p-8">
              <h5 className="mb-4 flex items-center text-lg font-extrabold text-emerald-700 sm:text-xl">
                <ShieldOff size={22} className="mr-2" /> সিস্টেম স্ট্যাটাস
              </h5>
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--canvas)] p-4">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[var(--foreground)]">
                    মেইনটেন্যান্স মোড {settings.maintenanceMode ? "চালু" : "বন্ধ"}
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="মেইনটেন্যান্স মোড"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    disabled={!canChangeMaintenance}
                    className="h-5 w-5 accent-red-600 disabled:opacity-50"
                  />
                </label>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {publicAccessOverride
                    ? "Public access mode চালু আছে। মেইনটেন্যান্স মোড আপাতত বন্ধ; পাবলিক পেজগুলো সবার জন্য উন্মুক্ত। ব্যক্তিগত ডেটা ও অ্যাডমিন API সুরক্ষিত আছে।"
                    : "চালু থাকলে লগইন না করা ব্যবহারকারীরা মেইনটেন্যান্স পেজ দেখবেন; বৈধ লগইন করা ব্যবহারকারীরা প্রবেশ করতে পারবেন।"}
                  {!publicAccessOverride && !canChangeMaintenance
                    ? " এই সেটিং শুধু Super Admin পরিবর্তন করতে পারেন।"
                    : ""}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-color)] border-t-4 border-t-amber-500 bg-[var(--card-bg)] p-5 shadow-sm sm:rounded-3xl sm:p-8">
              <h5 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[var(--foreground)]">
                <Globe size={21} /> সার্চ ইঞ্জিনে দৃশ্যমানতা
              </h5>
              <label className="flex min-h-12 items-center justify-between gap-3">
                <span className="font-bold text-sm">
                  Google ও অন্যান্য সার্চ ইঞ্জিনে ইনডেক্সিং {settings.searchIndexingEnabled ? "চালু" : "বন্ধ"}
                </span>
                <input type="checkbox" role="switch" name="searchIndexingEnabled"
                  aria-label="সার্চ ইঞ্জিনে ইনডেক্সিং চালু করুন"
                  checked={settings.searchIndexingEnabled}
                  onChange={handleChange}
                  disabled={!canChangeSearchIndexing}
                  className="h-5 w-5 accent-emerald-600 disabled:opacity-50"
                />
              </label>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                সম্পূর্ণ প্রস্তুত না হওয়া পর্যন্ত বন্ধ রাখুন। বন্ধ থাকলে সব পেজে noindex হেডার ও মেটাডেটা থাকবে এবং sitemap খালি থাকবে।
                এটি সাইটে ভিজিটর প্রবেশ বন্ধ করে না; আগে ইনডেক্স হওয়া পেজ সরাতে Google Search Console-এ removal request লাগতে পারে।
                {canChangeSearchIndexing ? "" : " এই সেটিং শুধু Super Admin পরিবর্তন করতে পারেন।"}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--brand-gold)] px-4 py-3.5 text-base font-extrabold text-[var(--primary-foreground)] shadow-lg transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSaving ? (
                <>
                  <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  আপডেট হচ্ছে...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" /> পরিবর্তনগুলো সেভ করুন
                </>
              )}
            </button>

            {saveOk ? (
              <p className="text-center text-sm font-semibold text-emerald-700" role="status">
                সেটিংস সফলভাবে আপডেট হয়েছে।
              </p>
            ) : null}
            {errorMsg ? (
              <p className="text-center text-sm font-semibold text-red-600" role="alert">
                {errorMsg}
              </p>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
