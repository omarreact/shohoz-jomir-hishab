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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

interface AppSettings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  facebookUrl: string;
  youtubeUrl: string;
  maintenanceMode: boolean;
  announcement: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    siteName: "LandBD",
    contactEmail: "",
    contactPhone: "",
    facebookUrl: "",
    youtubeUrl: "",
    maintenanceMode: false,
    announcement: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const [errorMsg, setErrorMsg] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const docRef = doc(db, "config", "app_settings");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings((prev) => ({ ...prev, ...docSnap.data() }));
      }
    } catch (error: unknown) {
      console.error("Error fetching settings:", error);
      if (
        error instanceof Error &&
        (error as any).code === "permission-denied"
      ) {
        setErrorMsg(
          "Firebase Security Rules (Firestore) এ পারমিশন দেওয়া নেই। দয়া করে Firebase Console থেকে 'config' কালেকশনের Read/Write পারমিশন দিন।",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(db, "config", "app_settings");
      await setDoc(docRef, settings, { merge: true });
      alert("সেটিংস সফলভাবে আপডেট হয়েছে!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("সেটিংস আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in visible">
      <div className="flex items-center mb-8">
        <h3 className="font-bold text-[var(--text-primary)] text-2xl mb-0">গ্লোবাল সেটিংস</h3>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl p-6 shadow-sm mb-8">
          <h5 className="font-bold mb-3 text-lg flex items-center">
            <span className="mr-2">❌</span> পারমিশন এরর
          </h5>
          <p className="mb-0">{errorMsg}</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* General Settings */}
          <div className="lg:col-span-7 space-y-8">
            <div className="card-new p-8 border-t-4 border-t-blue-500">
              <h5 className="font-bold mb-6 flex items-center text-blue-500 text-xl">
                <Globe size={24} className="mr-3" /> সাধারণ তথ্য
              </h5>

              <div className="mb-6">
                <label className="block text-[var(--text-primary)] font-bold mb-2">ওয়েবসাইটের নাম (Site Name)</label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                />
              </div>

              <div className="mb-2">
                <label className="block text-[var(--text-primary)] font-bold mb-2">জরুরি নোটিশ / ঘোষণা (Announcement Banner)</label>
                <textarea
                  name="announcement"
                  rows={4}
                  placeholder="হোমপেজে দেখানোর জন্য কোনো জরুরি নোটিশ থাকলে এখানে লিখুন..."
                  value={settings.announcement}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm resize-y"
                />
              </div>
            </div>

            <div className="card-new p-8 border-t-4 border-t-cyan-500">
              <h5 className="font-bold mb-6 flex items-center text-cyan-500 text-xl">
                <Info size={24} className="mr-3" /> যোগাযোগ ও সোশ্যাল মিডিয়া
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-[var(--text-primary)] font-bold mb-2">
                    <Mail size={16} className="mr-2" /> ইমেইল
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleChange}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center text-[var(--text-primary)] font-bold mb-2">
                    <Phone size={16} className="mr-2" /> ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleChange}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center text-[var(--text-primary)] font-bold mb-2">
                    <LinkIcon size={16} className="mr-2" /> Facebook URL
                  </label>
                  <input
                    type="url"
                    name="facebookUrl"
                    value={settings.facebookUrl}
                    onChange={handleChange}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center text-[var(--text-primary)] font-bold mb-2">
                    <LinkIcon size={16} className="mr-2" /> YouTube URL
                  </label>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={settings.youtubeUrl}
                    onChange={handleChange}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="lg:col-span-5">
            <div className="card-new p-8 border-t-4 border-t-red-500 mb-8">
              <h5 className="font-bold mb-6 flex items-center text-red-500 text-xl">
                <SettingsIcon size={24} className="mr-3" /> সিস্টেম কন্ট্রোল
              </h5>

              <div className="mb-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                  <span className="ml-3 font-bold text-[var(--text-primary)]">
                    মেইনটেন্যান্স মোড
                  </span>
                </label>
                <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">
                  এটি চালু করলে সাধারণ ইউজাররা ওয়েবসাইট অ্যাক্সেস করতে পারবে
                  না। শুধুমাত্র অ্যাডমিনরা দেখতে পারবে।
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full cta-gradient text-[var(--bg)] font-bold rounded-xl px-4 py-4 shadow-lg hover:-translate-y-1 transition-all flex justify-center items-center text-lg disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSaving ? (
                <>
                  <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin mr-3"></span>
                  আপডেট হচ্ছে...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" /> পরিবর্তনগুলো সেভ করুন
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
