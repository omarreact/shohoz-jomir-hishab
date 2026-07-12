"use client";

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Info, Link as LinkIcon, Globe, Phone, Mail } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    siteName: "সহজ জমির হিসাব",
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
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      if (error.code === 'permission-denied') {
        setErrorMsg("Firebase Security Rules (Firestore) এ পারমিশন দেওয়া নেই। দয়া করে Firebase Console থেকে 'config' কালেকশনের Read/Write পারমিশন দিন।");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
    <div className="fade-in">
      <div className="d-flex align-items-center mb-4">
        <h3 className="fw-bold text-dark mb-0">গ্লোবাল সেটিংস</h3>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : errorMsg ? (
        <div className="alert alert-danger shadow-sm border-0 rounded-4" role="alert">
          <h5 className="fw-bold mb-2">❌ পারমিশন এরর</h5>
          {errorMsg}
        </div>
      ) : (
        <form onSubmit={handleSave} className="row g-4">
          {/* General Settings */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 rounded-4 mb-4" style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>
              <div className="card-body p-4 p-md-5">
                <h5 className="fw-bold mb-4 d-flex align-items-center text-primary">
                  <Globe size={24} className="me-2" /> সাধারণ তথ্য
                </h5>
                
                <div className="mb-4">
                  <label className="form-label text-light fw-bold small">ওয়েবসাইটের নাম (Site Name)</label>
                  <input 
                    type="text" 
                    name="siteName"
                    className="form-control bg-dark text-white border-secondary" 
                    value={settings.siteName}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="form-label text-light fw-bold small">জরুরি নোটিশ / ঘোষণা (Announcement Banner)</label>
                  <textarea 
                    name="announcement"
                    className="form-control bg-dark text-white border-secondary" 
                    rows={3}
                    placeholder="হোমপেজে দেখানোর জন্য কোনো জরুরি নোটিশ থাকলে এখানে লিখুন..."
                    value={settings.announcement}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4" style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>
              <div className="card-body p-4 p-md-5">
                <h5 className="fw-bold mb-4 d-flex align-items-center text-info">
                  <Info size={24} className="me-2" /> যোগাযোগ ও সোশ্যাল মিডিয়া
                </h5>
                
                <div className="row g-3">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-light fw-bold small d-flex align-items-center"><Mail size={16} className="me-1"/> ইমেইল</label>
                    <input 
                      type="email" 
                      name="contactEmail"
                      className="form-control bg-dark text-white border-secondary" 
                      value={settings.contactEmail}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-light fw-bold small d-flex align-items-center"><Phone size={16} className="me-1"/> ফোন নম্বর</label>
                    <input 
                      type="text" 
                      name="contactPhone"
                      className="form-control bg-dark text-white border-secondary" 
                      value={settings.contactPhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-light fw-bold small d-flex align-items-center"><LinkIcon size={16} className="me-1"/> Facebook URL</label>
                    <input 
                      type="url" 
                      name="facebookUrl"
                      className="form-control bg-dark text-white border-secondary" 
                      value={settings.facebookUrl}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-light fw-bold small d-flex align-items-center"><LinkIcon size={16} className="me-1"/> YouTube URL</label>
                    <input 
                      type="url" 
                      name="youtubeUrl"
                      className="form-control bg-dark text-white border-secondary" 
                      value={settings.youtubeUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 rounded-4 mb-4" style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>
              <div className="card-body p-4 p-md-5">
                <h5 className="fw-bold mb-4 d-flex align-items-center text-danger">
                  <SettingsIcon size={24} className="me-2" /> সিস্টেম কন্ট্রোল
                </h5>
                
                <div className="form-check form-switch mb-4">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    role="switch" 
                    id="maintenanceMode" 
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    style={{ 
                      transform: "scale(1.5)", 
                      marginRight: "10px",
                      cursor: "pointer",
                      backgroundColor: settings.maintenanceMode ? "" : "#64748b",
                      borderColor: settings.maintenanceMode ? "" : "#475569"
                    }}
                  />
                  <label className="form-check-label fw-bold text-light ms-2" htmlFor="maintenanceMode" style={{ cursor: "pointer" }}>
                    মেইনটেন্যান্স মোড (Maintenance Mode)
                  </label>
                  <p className="text-muted small mt-2">এটি চালু করলে সাধারণ ইউজাররা ওয়েবসাইট অ্যাক্সেস করতে পারবে না। শুধুমাত্র অ্যাডমিনরা দেখতে পারবে।</p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSaving} className="btn btn-success fw-bold px-4 py-3 rounded-4 d-flex align-items-center w-100 justify-content-center shadow-lg">
              {isSaving ? (
                <><span className="spinner-border spinner-border-sm me-2"></span> আপডেট হচ্ছে...</>
              ) : (
                <><Save size={20} className="me-2" /> পরিবর্তনগুলো সেভ করুন</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
