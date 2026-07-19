"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  FileText,
  List,
  Save,
  X,
  ExternalLink,
  Tag,
} from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Editor from "@monaco-editor/react";

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
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        category,
        content,
      };

      if (editingId) {
        await updateDoc(doc(db, "dynamic_pages", editingId), pageData);
        alert("পেজ আপডেট হয়েছে!");
      } else {
        await addDoc(collection(db, "dynamic_pages"), pageData);
        alert("নতুন পেজ তৈরি হয়েছে!");
      }

      setTitle("");
      setSlug("");
      setCategory("সাধারণ (General)");
      setContent("");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!cat) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (cat.includes("আইন")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (cat.includes("নোটিশ")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (cat.includes("অন্যান্য")) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-green-500/10 text-green-500 border-green-500/20";
  };

  return (
    <div className="fade-in visible" data-admin-panel="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">কাস্টম পেজ ম্যানেজমেন্ট</h1>
          <p className="text-[var(--text-secondary)]">সিস্টেমে মোট {pages.length} টি পেজ আছে</p>
        </div>
        <button
          className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-md ${
            showCreateForm && !editingId
              ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] scale-95" 
              : "cta-gradient text-[var(--bg)] hover:scale-105"
          }`}
          onClick={() => {
            if (showCreateForm && editingId) {
              setEditingId(null);
              setTitle("");
              setSlug("");
              setContent("");
            }
            setShowCreateForm(!showCreateForm);
          }}
        >
          {showCreateForm && !editingId ? "বাতিল করুন" : "নতুন পেজ তৈরি করুন"}
        </button>
      </div>

      {/* Creator Form - Premium UI */}
      {showCreateForm && (
        <div className="card-new mb-10 overflow-hidden border-t-4 border-t-[var(--accent)] fade-in visible">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
              <h5 className="font-bold text-xl text-[var(--text-primary)] mb-0 flex items-center">
                <FileText className="mr-3 text-[var(--accent)]" size={24} />
                {editingId ? "পেজ আপডেট করুন" : "নতুন কাস্টম পেজ লিখুন"}
              </h5>
              {editingId && (
                <button
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingId(null);
                    setTitle("");
                    setSlug("");
                    setContent("");
                  }}
                >
                  <X size={24} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-2">পেজের টাইটেল</label>
                  <input
                    type="text"
                    placeholder="যেমন: Privacy Policy"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-2">পেজের লিংক (Slug)</label>
                  <div className="flex rounded-xl overflow-hidden shadow-sm border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
                    <span className="bg-[var(--surface)] border-r border-[var(--border)] px-4 flex items-center justify-center font-bold text-[var(--text-secondary)]">
                      /p/
                    </span>
                    <input
                      type="text"
                      placeholder="privacy-policy"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      className="flex-1 bg-[var(--bg)] text-[var(--text-primary)] px-4 py-3 outline-none"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[var(--text-primary)] font-bold mb-2">পেজের ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
                  >
                    <option value="সাধারণ (General)">সাধারণ (General)</option>
                    <option value="আইন বিষয়ক (Legal)">আইন বিষয়ক (Legal)</option>
                    <option value="নোটিশ (Notice)">নোটিশ (Notice)</option>
                    <option value="অন্যান্য (Other)">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[var(--text-secondary)] font-bold text-sm tracking-wide uppercase">
                    ডিজাইন ও কন্টেন্ট (HTML)
                  </label>
                  <span className="text-[var(--accent)] font-medium text-xs">
                    Tailwind CSS / HTML allowed
                  </span>
                </div>
                <div className="h-[400px] rounded-xl overflow-hidden border border-[var(--border)]">
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
                      padding: { top: 16, bottom: 16 }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--text-primary)] text-[var(--bg)] font-bold rounded-xl px-8 py-3.5 shadow-md hover:-translate-y-0.5 transition-transform flex items-center disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin mr-3"></span>
                      সেভ হচ্ছে...
                    </>
                  ) : editingId ? (
                    "আপডেট করুন"
                  ) : (
                    "পেজ পাবলিশ করুন"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pages List - Premium UI */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : pages.length === 0 ? (
        <div className="card-new py-16 text-center text-[var(--text-secondary)]">
          <List size={64} className="mx-auto mb-4 opacity-25" />
          <h4 className="font-bold text-[var(--text-primary)] text-2xl mb-2">কোনো পেজ তৈরি করা হয়নি</h4>
          <p>উপরের বাটনটি ব্যবহার করে নতুন পেজ তৈরি করুন</p>
        </div>
      ) : (
        <div className="card-new overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] bg-black/5 dark:bg-white/5">
            <h5 className="font-bold mb-0 text-[var(--text-primary)] text-lg">প্রকাশিত পেজসমূহ</h5>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                    পেজের টাইটেল
                  </th>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                    লিংক (URL)
                  </th>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                    ক্যাটাগরি
                  </th>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider text-right">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-[var(--surface)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-[var(--bg)] border border-[var(--border)] text-[var(--accent)] w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <span className="font-bold text-[var(--text-primary)] text-base">
                          {page.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/p/${page.slug}`}
                        target="_blank"
                        className="inline-flex items-center px-4 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors font-medium text-sm"
                      >
                        /p/{page.slug}
                        <ExternalLink size={14} className="ml-2" />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(page.category)}`}>
                        <Tag size={12} className="mr-1.5" />
                        {page.category || "সাধারণ"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(page)}
                          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors shadow-sm"
                          title="এডিট করুন"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id, page.title)}
                          className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors shadow-sm"
                          title="ডিলিট করুন"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
