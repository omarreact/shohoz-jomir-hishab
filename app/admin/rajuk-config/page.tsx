"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Key,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  Save,
} from "lucide-react";
import HarImporter from "@/src/features/admin/components/HarImporter";

export default function RajukConfig() {
  const [token, setToken] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);

  // Auto Generator State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Save State
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTokenConfig();
  }, []);

  const fetchTokenConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rajuk-config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      setToken(data.token ?? "");
      if (data.updatedAt) {
        setLastUpdated(new Date(data.updatedAt).toLocaleString("bn-BD"));
      }
    } catch (error) {
      console.error("Error fetching Rajuk config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveToken = async (newToken: string) => {
    const res = await fetch("/api/admin/rajuk-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: newToken }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "টোকেন সেভ করতে সমস্যা হয়েছে।");
    }

    const data = await res.json();
    setToken(data.token);
    if (data.updatedAt) {
      setLastUpdated(new Date(data.updatedAt).toLocaleString("bn-BD"));
    }
    alert("টোকেন সফলভাবে সেভ হয়েছে!");
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("টোকেন দিন");

    setIsSaving(true);
    try {
      await saveToken(token);
    } catch (error: any) {
      console.error("Error saving token:", error);
      alert(error.message || "টোকেন সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert("ইউজারনেম এবং পাসওয়ার্ড দিন");

    setIsGenerating(true);
    try {
      const res = await fetch("/api/rajuk-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        await saveToken(data.token);
        setUsername("");
        setPassword("");
      } else {
        alert(data.error?.message || "টোকেন জেনারেট করতে ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error(error);
      alert("সার্ভার ত্রুটি");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fade-in visible" data-admin-panel="true">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">রাজউক API কন্ট্রোল</h1>
        <p className="text-[var(--text-secondary)]">টোকেন, API সেটিংস ও কনফিগারেশন পরিচালনা করুন।</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Status Card */}
        <div className="card-new p-6 md:p-8 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-[var(--surface)] p-4 rounded-full mr-5 border border-[var(--border)]">
              <Database size={32} className="text-[var(--accent)]" />
            </div>
            <div>
              <h5 className="font-bold text-xl text-[var(--text-primary)] mb-2">বর্তমান টোকেন স্ট্যাটাস</h5>
              {loading ? (
                <span className="text-[var(--text-secondary)] font-medium">লোড হচ্ছে...</span>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span
                    className={`inline-flex items-center px-4 py-1.5 rounded-full font-bold text-sm ${
                      token
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {token ? (
                      <><CheckCircle size={16} className="mr-2" /> অ্যাক্টিভ</>
                    ) : (
                      <><XCircle size={16} className="mr-2" /> টোকেন নেই</>
                    )}
                  </span>
                  {lastUpdated && (
                    <span className="text-[var(--text-secondary)] text-sm font-medium">
                      সর্বশেষ আপডেট: {lastUpdated}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auto Generator */}
          <div className="card-new p-6 md:p-8 border-t-4 border-t-green-500">
            <h5 className="font-bold mb-4 flex items-center text-green-500 text-xl">
              <RefreshCw size={24} className="mr-3" /> অটোমেটিক টোকেন জেনারেটর
            </h5>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              রাজউকের ইউজারনেম এবং পাসওয়ার্ড দিয়ে অটোমেটিক টোকেন জেনারেট করুন।
              এটি সবচেয়ে নিরাপদ এবং সহজ পদ্ধতি।
            </p>

            <form onSubmit={handleAutoGenerate} className="space-y-5">
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-2">রাজউক ইউজারনেম</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[var(--text-primary)] font-bold mb-2">পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-colors shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-green-500 text-white font-bold rounded-xl px-4 py-3.5 shadow-md hover:-translate-y-0.5 transition-transform flex justify-center items-center mt-2 disabled:opacity-70 disabled:hover:translate-y-0 text-lg"
              >
                {isGenerating ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></span>
                    জেনারেট হচ্ছে...
                  </>
                ) : (
                  "নতুন টোকেন তৈরি করুন"
                )}
              </button>
            </form>
          </div>

          {/* Manual Entry */}
          <div className="card-new p-6 md:p-8 border-t-4 border-t-yellow-500">
            <h5 className="font-bold mb-4 flex items-center text-yellow-500 text-xl">
              <Settings size={24} className="mr-3" /> ম্যানুয়াল টোকেন এন্ট্রি
            </h5>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              আপনার কাছে যদি আগে থেকে টোকেন থাকে, তবে নিচে পেস্ট করে সেভ করুন।
              (অ্যাডভান্সড ইউজারদের জন্য)
            </p>

            <form onSubmit={handleManualSave} className="space-y-5 flex flex-col h-[calc(100%-100px)]">
              <div className="flex-1">
                <label className="block text-[var(--text-primary)] font-bold mb-2">বর্তমান টোকেন</label>
                <textarea
                  rows={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="eyJhb..."
                  className="w-full h-[180px] bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors shadow-sm font-mono text-xs resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[var(--text-primary)] text-[var(--bg)] font-bold rounded-xl px-4 py-3.5 shadow-md hover:-translate-y-0.5 transition-transform flex justify-center items-center mt-auto disabled:opacity-70 disabled:hover:translate-y-0 text-lg"
              >
                {isSaving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin mr-3"></span>
                    সেভ হচ্ছে...
                  </>
                ) : (
                  "ম্যানুয়ালি সেভ করুন"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* HAR Importer Section */}
        <HarImporter onImportComplete={fetchTokenConfig} />
      </div>
    </div>
  );
}
