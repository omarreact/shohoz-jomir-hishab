"use client";

import React, { useState, useEffect } from "react";
import { Database, Key, CheckCircle, XCircle, Settings, RefreshCw, Save } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
      const docRef = doc(db, "config", "rajuk_api");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setToken(data.token || "");
        if (data.updatedAt) {
          setLastUpdated(new Date(data.updatedAt).toLocaleString("bn-BD"));
        }
      }
    } catch (error) {
      console.error("Error fetching Rajuk config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTokenToFirestore = async (newToken: string) => {
    try {
      const docRef = doc(db, "config", "rajuk_api");
      await setDoc(docRef, {
        token: newToken,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setToken(newToken);
      setLastUpdated(new Date().toLocaleString("bn-BD"));
      alert("টোকেন সফলভাবে সেভ হয়েছে!");
    } catch (error) {
      console.error("Error saving token:", error);
      alert("টোকেন সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("টোকেন দিন");
    
    setIsSaving(true);
    await saveTokenToFirestore(token);
    setIsSaving(false);
  };

  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return alert("ইউজারনেম এবং পাসওয়ার্ড দিন");
    
    setIsGenerating(true);
    try {
      const res = await fetch("/api/rajuk-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        await saveTokenToFirestore(data.token);
        setUsername("");
        setPassword("");
      } else {
        alert(data.error?.message || "টোকেন জেনারেট করতে ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error(error);
      alert("সার্ভার ত্রুটি");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center mb-4">
        <h3 className="fw-bold text-dark mb-0">রাজউক API কন্ট্রোল</h3>
      </div>
      
      <div className="row g-4">
        {/* Status Card */}
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-4" style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="bg-dark p-3 rounded-circle me-3">
                  <Database size={28} className="text-info" />
                </div>
                <div>
                  <h5 className="fw-bold mb-1">বর্তমান টোকেন স্ট্যাটাস</h5>
                  {loading ? (
                    <span className="text-muted small">লোড হচ্ছে...</span>
                  ) : (
                    <div className="d-flex flex-column">
                      <span className={`badge ${token ? 'bg-success' : 'bg-danger'} mb-1 align-self-start`}>
                        {token ? <><CheckCircle size={12} className="me-1"/> অ্যাক্টিভ</> : <><XCircle size={12} className="me-1"/> টোকেন নেই</>}
                      </span>
                      {lastUpdated && <span className="text-muted small" style={{ fontSize: "11px" }}>সর্বশেষ আপডেট: {lastUpdated}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Generator */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 h-100" style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold mb-4 d-flex align-items-center text-success">
                <RefreshCw size={24} className="me-2" /> অটোমেটিক টোকেন জেনারেটর
              </h5>
              <p className="text-muted small mb-4">রাজউকের ইউজারনেম এবং পাসওয়ার্ড দিয়ে অটোমেটিক টোকেন জেনারেট করুন। এটি সবচেয়ে নিরাপদ এবং সহজ পদ্ধতি।</p>
              
              <form onSubmit={handleAutoGenerate}>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold small">রাজউক ইউজারনেম</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark text-white border-secondary" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-light fw-bold small">পাসওয়ার্ড</label>
                  <input 
                    type="password" 
                    className="form-control bg-dark text-white border-secondary" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={isGenerating} className="btn btn-success fw-bold px-4 rounded-pill d-flex align-items-center w-100 justify-content-center">
                  {isGenerating ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span> জেনারেট হচ্ছে...</>
                  ) : (
                    <><RefreshCw size={18} className="me-2" /> নতুন টোকেন তৈরি করুন</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 h-100" style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold mb-4 d-flex align-items-center text-warning">
                <Settings size={24} className="me-2" /> ম্যানুয়াল টোকেন এন্ট্রি
              </h5>
              <p className="text-muted small mb-4">আপনার কাছে যদি আগে থেকে টোকেন থাকে, তবে নিচে পেস্ট করে সেভ করুন। (অ্যাডভান্সড ইউজারদের জন্য)</p>

              <form onSubmit={handleManualSave}>
                <div className="mb-4">
                  <label className="form-label text-light fw-bold small">বর্তমান টোকেন</label>
                  <textarea 
                    className="form-control bg-dark text-white border-secondary text-monospace" 
                    rows={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{ fontSize: '12px', wordBreak: 'break-all' }}
                    placeholder="eyJhb..."
                  ></textarea>
                </div>
                <button type="submit" disabled={isSaving} className="btn btn-warning fw-bold px-4 rounded-pill d-flex align-items-center w-100 justify-content-center text-dark">
                  {isSaving ? "সেভ হচ্ছে..." : <><Save size={18} className="me-2" /> ম্যানুয়ালি সেভ করুন</>}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
