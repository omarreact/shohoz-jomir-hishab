"use client";

import React, { useState, useEffect } from "react";
import { Database, Key, CheckCircle, XCircle, Settings, RefreshCw, Save } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";

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
    <div className="fade-in" data-admin-panel="true">
      <div className="d-flex align-items-center mb-4">
        <SectionHeader 
          title="রাজউক API কন্ট্রোল" 
          subtitle="টোকেন, API সেটিংস ও কনফিগারেশন পরিচালনা করুন।"
          className="mb-0"
        />
      </div>
      
      <div className="row g-4">
        {/* Status Card */}
        <div className="col-12">
          <Card className="border-0 shadow-sm" style={{ backgroundColor: "var(--card-bg)" }}>
            <CardBody className="p-4 d-flex align-items-center justify-content-between">
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
            </CardBody>
          </Card>
        </div>

        {/* Auto Generator */}
        <div className="col-lg-6">
          <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: "var(--card-bg)" }}>
            <CardBody className="p-4 p-md-5">
              <h5 className="fw-bold mb-4 d-flex align-items-center text-success">
                <RefreshCw size={24} className="me-2" /> অটোমেটিক টোকেন জেনারেটর
              </h5>
              <p className="text-muted small mb-4">রাজউকের ইউজারনেম এবং পাসওয়ার্ড দিয়ে অটোমেটিক টোকেন জেনারেট করুন। এটি সবচেয়ে নিরাপদ এবং সহজ পদ্ধতি।</p>
              
              <form onSubmit={handleAutoGenerate}>
                <div className="mb-3">
                  <Input 
                    label="রাজউক ইউজারনেম"
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <Input 
                    label="পাসওয়ার্ড"
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  isLoading={isGenerating} 
                  variant="primary" 
                  className="w-100 rounded-pill fw-bold px-4"
                  leftIcon={!isGenerating && <RefreshCw size={18} />}
                >
                  {isGenerating ? "জেনারেট হচ্ছে..." : "নতুন টোকেন তৈরি করুন"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Manual Entry */}
        <div className="col-lg-6">
          <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: "var(--card-bg)" }}>
            <CardBody className="p-4 p-md-5">
              <h5 className="fw-bold mb-4 d-flex align-items-center text-warning">
                <Settings size={24} className="me-2" /> ম্যানুয়াল টোকেন এন্ট্রি
              </h5>
              <p className="text-muted small mb-4">আপনার কাছে যদি আগে থেকে টোকেন থাকে, তবে নিচে পেস্ট করে সেভ করুন। (অ্যাডভান্সড ইউজারদের জন্য)</p>

              <form onSubmit={handleManualSave}>
                <div className="mb-4">
                  <Textarea
                    label="বর্তমান টোকেন"
                    rows={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{ fontSize: '12px', wordBreak: 'break-all' }}
                    placeholder="eyJhb..."
                    className="text-monospace"
                  />
                </div>
                <Button 
                  type="submit" 
                  isLoading={isSaving} 
                  variant="secondary" 
                  className="w-100 rounded-pill fw-bold px-4 text-dark"
                  leftIcon={!isSaving && <Save size={18} />}
                >
                  {isSaving ? "সেভ হচ্ছে..." : "ম্যানুয়ালি সেভ করুন"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}
