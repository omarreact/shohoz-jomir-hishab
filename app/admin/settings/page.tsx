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

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch((err) => {
        console.error("Error fetching settings:", err);
        setErrorMsg("সেটিংস লোড করতে সমস্যা হয়েছে।");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          maintenanceMode: String(settings.maintenanceMode),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("সেটিংস সফলভাবে আপডেট হয়েছে!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("সেটিংস আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in visible">
      <div className="flex items-center mb-8">
        <h3 className="font-bold text-slate-900 dark:text-white text-2xl mb-0">গ্লোবাল সেটিংস</h3>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-10 h-10 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl p-6 mb-8">
          <h5 className="font-bold mb-3 text-lg">❌ এরর</h5>
          <p className="mb-0">{errorMsg}</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* General Settings */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 border-t-4 border-t-blue-500">
              <h5 className="font-bold mb-6 flex items-center text-blue-500 text-xl">
                <Globe size={24} className="mr-3" /> সাধারণ তথ্য
              </h5>
              <div className="mb-6">
                <label className="block text-slate-900 dark:text-white font-bold mb-2">ওয়েবসাইটের নাম</label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm"
                />
              </div>
              <div>
                <label className="block text-slate-900 dark:text-white font-bold mb-2">জরুরি নোটিশ / ঘোষণা</label>
                <textarea
                  name="announcement"
                  rows={4}
                  placeholder="হোমপেজে দেখানোর জন্য কোনো জরুরি নোটিশ..."
                  value={settings.announcement}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm resize-y"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 border-t-4 border-t-cyan-500">
              <h5 className="font-bold mb-6 flex items-center text-cyan-500 text-xl">
                <Info size={24} className="mr-3" /> যোগাযোগ ও সোশ্যাল মিডিয়া
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-slate-900 dark:text-white font-bold mb-2">
                    <Mail size={16} className="mr-2" /> ইমেইল
                  </label>
                  <input type="email" name="contactEmail" value={settings.contactEmail} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="flex items-center text-slate-900 dark:text-white font-bold mb-2">
                    <Phone size={16} className="mr-2" /> ফোন নম্বর
                  </label>
                  <input type="text" name="contactPhone" value={settings.contactPhone} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="flex items-center text-slate-900 dark:text-white font-bold mb-2">
                    <LinkIcon size={16} className="mr-2" /> Facebook URL
                  </label>
                  <input type="url" name="facebookUrl" value={settings.facebookUrl} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm" />
                </div>
                <div>
                  <label className="flex items-center text-slate-900 dark:text-white font-bold mb-2">
                    <LinkIcon size={16} className="mr-2" /> YouTube URL
                  </label>
                  <input type="url" name="youtubeUrl" value={settings.youtubeUrl} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 border-t-4 border-t-red-500 mb-8">
              <h5 className="font-bold mb-6 flex items-center text-red-500 text-xl">
                <SettingsIcon size={24} className="mr-3" /> সিস্টেম কন্ট্রোল
              </h5>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500" />
                <span className="ml-3 font-bold text-slate-900 dark:text-white">মেইনটেন্যান্স মোড</span>
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                এটি চালু করলে সাধারণ ইউজাররা ওয়েবসাইট অ্যাক্সেস করতে পারবে না।
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#006a4e] text-white hover:bg-[#00523b] font-bold rounded-xl px-4 py-4 shadow-lg hover:-translate-y-1 transition-all flex justify-center items-center text-lg disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSaving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  আপডেট হচ্ছে...
                </>
              ) : (
                <><Save size={20} className="mr-2" /> পরিবর্তনগুলো সেভ করুন</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
