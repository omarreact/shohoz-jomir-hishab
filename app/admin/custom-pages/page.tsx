"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, FileText, List, Save, X, ExternalLink, Tag } from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
}

export default function CustomPagesDashboard() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("সাধারণ (General)");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "dynamic_pages"));
      const pagesData: CustomPage[] = [];
      querySnapshot.forEach((doc) => {
        pagesData.push({ id: doc.id, ...doc.data() } as CustomPage);
      });
      setPages(pagesData);
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) {
      alert("অনুগ্রহ করে সব ফিল্ড পূরণ করুন");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const pageData = {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        category,
        content
      };

      if (editingId) {
        await updateDoc(doc(db, "dynamic_pages", editingId), pageData);
        alert("পেজ আপডেট হয়েছে!");
      } else {
        await addDoc(collection(db, "dynamic_pages"), pageData);
        alert("নতুন পেজ তৈরি হয়েছে!");
      }
      
      setTitle(""); setSlug(""); setCategory("সাধারণ (General)"); setContent("");
      setEditingId(null);
      setShowCreateForm(false);
      
      fetchPages();
    } catch (error) {
      console.error("Error saving page:", error);
      alert("পেজ সেভ করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (page: CustomPage) => {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setCategory(page.category || "সাধারণ (General)");
    setContent(page.content);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, pageTitle: string) => {
    if (confirm(`"${pageTitle}" পেজটি কি আপনি সত্যিই ডিলিট করতে চান?`)) {
      try {
        await deleteDoc(doc(db, "dynamic_pages", id));
        fetchPages();
      } catch (error) {
        console.error("Error deleting page:", error);
      }
    }
  };

  const getCategoryColor = (cat?: string) => {
    if (!cat) return "bg-success";
    if (cat.includes("আইন")) return "bg-primary";
    if (cat.includes("নোটিশ")) return "bg-danger";
    if (cat.includes("অন্যান্য")) return "bg-warning text-dark";
    return "bg-success";
  };

  return (
    <div className="fade-in" data-admin-panel="true">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <SectionHeader 
          title="কাস্টম পেজ ম্যানেজমেন্ট"
          subtitle={`সিস্টেমে মোট ${pages.length} টি পেজ আছে`}
          className="mb-0"
        />
        <Button
          variant={showCreateForm && !editingId ? "secondary" : "primary"}
          className="rounded-pill"
          onClick={() => {
            if (showCreateForm && editingId) {
               setEditingId(null); setTitle(""); setSlug(""); setContent("");
            }
            setShowCreateForm(!showCreateForm);
          }}
          style={{ transition: "all 0.3s ease", transform: showCreateForm && !editingId ? "scale(0.95)" : "scale(1)" }}
          leftIcon={showCreateForm && !editingId ? <X size={20} /> : <Plus size={20} />}
        >
          {showCreateForm && !editingId ? "বাতিল করুন" : "নতুন পেজ তৈরি করুন"}
        </Button>
      </div>

      {/* Creator Form - Premium UI */}
      {showCreateForm && (
        <Card className="mb-5 border-0" style={{ backgroundColor: "var(--card-bg)" }}>
          <CardBody className="p-4 p-md-5">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <h5 className="fw-bolder text-primary mb-0 d-flex align-items-center">
                <FileText className="me-2 text-primary" size={24} /> {editingId ? "পেজ আপডেট করুন" : "নতুন কাস্টম পেজ লিখুন"}
              </h5>
              {editingId && (
                <Button variant="ghost" size="icon" onClick={() => { setShowCreateForm(false); setEditingId(null); setTitle(""); setSlug(""); setContent(""); }}>
                  <X size={20} />
                </Button>
              )}
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <Input 
                    label="পেজের টাইটেল"
                    type="text" 
                    placeholder="যেমন: Privacy Policy" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <Input 
                    label="পেজের লিংক (Slug)"
                    type="text" 
                    placeholder="privacy-policy" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    required 
                    leftIcon={<span className="text-muted fw-bold">/p/</span>}
                  />
                </div>
                <div className="col-md-12">
                  <Select 
                    label="পেজের ক্যাটাগরি"
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    options={[
                      { label: "সাধারণ (General)", value: "সাধারণ (General)" },
                      { label: "আইন বিষয়ক (Legal)", value: "আইন বিষয়ক (Legal)" },
                      { label: "নোটিশ (Notice)", value: "নোটিশ (Notice)" },
                      { label: "অন্যান্য (Other)", value: "অন্যান্য (Other)" }
                    ]}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary fw-bold small text-uppercase tracking-wide d-flex justify-content-between">
                  <span>ডিজাইন ও কন্টেন্ট (HTML)</span>
                  <span className="text-primary opacity-75 text-lowercase" style={{letterSpacing: 0}}>Tailwind/Bootstrap classes allowed</span>
                </label>
                <div style={{ height: "400px", borderRadius: "1rem", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={content}
                    onChange={(value) => setContent(value || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      formatOnPaste: true,
                    }}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg" className="rounded-pill px-5" leftIcon={!isSubmitting && <Save size={20} />}>
                  {isSubmitting ? "সেভ হচ্ছে..." : (editingId ? "আপডেট করুন" : "পেজ পাবলিশ করুন")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Pages List - Premium UI */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5 my-5">
          <div className="spinner-border text-primary border-3" style={{ width: "3rem", height: "3rem" }} />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-5 my-5 rounded-4 shadow-sm border-0 text-muted" style={{ backgroundColor: "var(--card-bg)" }}>
          <List size={64} className="mb-3 opacity-25" />
          <h4 className="fw-bold text-white">কোনো পেজ তৈরি করা হয়নি</h4>
          <p>উপরের বাটনটি ব্যবহার করে নতুন পেজ তৈরি করুন</p>
        </div>
      ) : (
        <Card className="border-0 overflow-hidden" style={{ backgroundColor: "var(--card-bg)" }}>
          <CardHeader className="border-bottom border-secondary border-opacity-25 p-4" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
            <h5 className="fw-bold mb-0 text-white">প্রকাশিত পেজসমূহ</h5>
          </CardHeader>
          <CardBody className="p-0">
            <div className="table-responsive">
              <table className="table table-hover table-dark align-middle mb-0" style={{ minWidth: "800px" }}>
                <thead style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                  <tr>
                    <th className="text-secondary fw-bold text-uppercase py-3 ps-4" style={{ fontSize: "12px", letterSpacing: "1px" }}>পেজের টাইটেল</th>
                    <th className="text-secondary fw-bold text-uppercase py-3" style={{ fontSize: "12px", letterSpacing: "1px" }}>লিংক (URL)</th>
                    <th className="text-secondary fw-bold text-uppercase py-3" style={{ fontSize: "12px", letterSpacing: "1px" }}>ক্যাটাগরি</th>
                    <th className="text-secondary fw-bold text-uppercase py-3 text-end pe-4" style={{ fontSize: "12px", letterSpacing: "1px" }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} style={{ transition: "background-color 0.2s ease" }}>
                      <td className="ps-4 py-3 border-secondary border-opacity-25">
                        <div className="d-flex align-items-center">
                          <div className="bg-dark text-primary rounded-3 d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: 40, height: 40 }}>
                            <FileText size={20} />
                          </div>
                          <span className="fw-bolder text-white fs-6">{page.title}</span>
                        </div>
                      </td>
                      <td className="py-3 border-secondary border-opacity-25">
                        <Link href={`/p/${page.slug}`} target="_blank" className="btn btn-outline-primary btn-sm rounded-pill fw-medium px-3 d-inline-flex align-items-center hover-shadow border-opacity-50">
                          /p/{page.slug} <ExternalLink size={12} className="ms-2 opacity-75" />
                        </Link>
                      </td>
                      <td className="py-3 border-secondary border-opacity-25">
                        <span className={`badge ${getCategoryColor(page.category)} rounded-pill px-3 py-2 fw-medium d-inline-flex align-items-center shadow-sm`} style={{ letterSpacing: "0.5px" }}>
                          <Tag size={12} className="me-1" /> {page.category || "সাধারণ"}
                        </span>
                      </td>
                      <td className="py-3 text-end pe-4 border-secondary border-opacity-25">
                        <div className="d-flex gap-2 justify-content-end">
                          <button onClick={() => handleEdit(page)} className="btn btn-dark text-primary btn-sm rounded-circle shadow-sm hover-bg-dark" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(page.id, page.title)} className="btn btn-dark text-danger btn-sm rounded-circle shadow-sm hover-bg-dark" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
