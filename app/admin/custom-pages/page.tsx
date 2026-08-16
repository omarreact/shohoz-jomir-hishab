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
import Link from "next/link";
import Editor from "@monaco-editor/react";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  category: string;
  content?: string;
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
      const res = await fetch("/api/pages");
      if (!res.ok) throw new Error("Failed to load pages");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setPages(json.data.pages ?? []);
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

      const res = editingId
        ? await fetch(`/api/pages/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pageData),
          })
        : await fetch("/api/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pageData),
          });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "সেভ করতে সমস্যা হয়েছে");
      }

      alert(editingId ? "পেজ আপডেট হয়েছে!" : "নতুন পেজ তৈরি হয়েছে!");
      resetForm();
      fetchPages();
    } catch (error: any) {
      console.error("Error saving page:", error);
      alert(error.message || "পেজ সেভ করতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setCategory("সাধারণ (General)");
    setContent("");
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleEdit = async (page: CustomPage) => {
    // Fetch full content for the editor
    try {
      const res = await fetch(`/api/pages/${page.id}`);
      const json = await res.json();
      if (json.success) {
        setContent(json.data.page.content ?? "");
      }
    } catch {
      setContent("");
    }
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setCategory(page.category || "সাধারণ (General)");
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, pageTitle: string) => {
    if (!confirm(`"${pageTitle}" পেজটি কি আপনি সত্যিই ডিলিট করতে চান?`)) return;
    try {
      const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "ডিলিট করতে সমস্যা হয়েছে");
      fetchPages();
    } catch (error: any) {
      console.error("Error deleting page:", error);
      alert(error.message);
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">কাস্টম পেজ ম্যানেজমেন্ট</h1>
          <p className="text-slate-500 dark:text-slate-400">সিস্টেমে মোট {pages.length} টি পেজ আছে</p>
        </div>
        <button
          className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-md ${
            showCreateForm && !editingId
              ? "bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 scale-95"
              : "bg-[#006a4e] text-white hover:bg-[#00523b] hover:scale-105"
          }`}
          onClick={() => {
            if (showCreateForm && editingId) {
              resetForm();
            }
            setShowCreateForm(!showCreateForm);
          }}
        >
          {showCreateForm && !editingId ? "বাতিল করুন" : "নতুন পেজ তৈরি করুন"}
        </button>
      </div>

      {/* Creator Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm mb-10 overflow-hidden border-t-4 border-t-[#006a4e] fade-in visible">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h5 className="font-bold text-xl text-slate-900 dark:text-white mb-0 flex items-center">
                <FileText className="mr-3 text-[#006a4e]" size={24} />
                {editingId ? "পেজ আপডেট করুন" : "নতুন কাস্টম পেজ লিখুন"}
              </h5>
              {editingId && (
                <button
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                  onClick={resetForm}
                >
                  <X size={24} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-slate-900 dark:text-white font-bold mb-2">পেজের টাইটেল</label>
                  <input
                    type="text"
                    placeholder="যেমন: Privacy Policy"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-900 dark:text-white font-bold mb-2">পেজের লিংক (Slug)</label>
                  <div className="flex rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 focus-within:border-[#006a4e] transition-colors">
                    <span className="bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 px-4 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                      /p/
                    </span>
                    <input
                      type="text"
                      placeholder="privacy-policy"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 outline-none"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-900 dark:text-white font-bold mb-2">পেজের ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] transition-colors shadow-sm"
                  >
                    <option value="সাধারণ (General)">সাধারণ (General)</option>
                    <option value="আইন বিষয়ক (Legal)">আইন বিষয়ক (Legal)</option>
                    <option value="নোটিশ (Notice)">নোটিশ (Notice)</option>
                    <option value="অন্যান্য (Other)">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide uppercase">
                    ডিজাইন ও কন্টেন্ট (HTML)
                  </label>
                  <span className="text-[#006a4e] font-medium text-xs">
                    Tailwind CSS / HTML allowed
                  </span>
                </div>
                <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
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
                      padding: { top: 16, bottom: 16 },
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl px-8 py-3.5 shadow-md hover:-translate-y-0.5 transition-transform flex items-center disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></span>
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

      {/* Pages List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm py-16 text-center text-slate-500 dark:text-slate-400">
          <List size={64} className="mx-auto mb-4 opacity-25" />
          <h4 className="font-bold text-slate-900 dark:text-white text-2xl mb-2">কোনো পেজ তৈরি করা হয়নি</h4>
          <p>উপরের বাটনটি ব্যবহার করে নতুন পেজ তৈরি করুন</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h5 className="font-bold mb-0 text-slate-900 dark:text-white text-lg">প্রকাশিত পেজসমূহ</h5>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">পেজের টাইটেল</th>
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">লিংক (URL)</th>
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">ক্যাটাগরি</th>
                  <th className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#006a4e] w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-base">{page.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/p/${page.slug}`}
                        target="_blank"
                        className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#006a4e] hover:border-[#006a4e] transition-colors font-medium text-sm"
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
                          className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[#006a4e] flex items-center justify-center hover:bg-[#006a4e] hover:text-white hover:border-[#006a4e] transition-colors shadow-sm"
                          title="এডিট করুন"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(page.id, page.title)}
                          className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors shadow-sm"
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
