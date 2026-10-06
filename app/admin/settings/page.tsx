"use client";

import React, { useState, useEffect } from "react";
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
  announcement: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  siteName: "LandBD",
  contactEmail: "",
  contactPhone: "",
  facebookUrl: "",
  youtubeUrl: "",
  maintenanceMode: false,
  announcement: "",
};

export default function SettingsPage() {
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
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            // Product decision: maintenance mode is retired / hard-disabled.
            maintenanceMode: false,
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
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          maintenanceMode: "false",
        }),
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
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-900">মেইনটেন্যান্স মোড বন্ধ</p>
                <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                  Maintenance mode বর্তমানে প্রজেক্ট থেকে নিষ্ক্রিয় করা হয়েছে। সাইট সবসময়
                  স্বাভাবিক ট্রাফিক সার্ভ করবে। পরে আবার প্রয়োজন হলে কোডে
                  <code className="mx-1 rounded bg-white px-1">MAINTENANCE_MODE_ENABLED</code>
                  চালু করা যাবে।
                </p>
              </div>
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
