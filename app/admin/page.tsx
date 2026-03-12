"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Plus, Trash2, Edit, X } from "lucide-react";
import Link from "next/link";

interface DynamicPage {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export default function AdminDashboard() {
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        fetchPages();
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchPages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "dynamic_pages"));
      const fetchedPages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DynamicPage[];
      setPages(fetchedPages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handleEditClick = (page: DynamicPage) => {
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setEditingId(page.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setTitle(""); setSlug(""); setContent(""); setEditingId(null);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) return alert("সব ফিল্ড পূরণ করুন!");
    
    const formattedSlug = slug.toLowerCase().replace(/\s+/g, '-');
    setIsPublishing(true);

    try {
      if (editingId) {
        // Update Existing Page
        await updateDoc(doc(db, "dynamic_pages", editingId), {
          title, slug: formattedSlug, content
        });
        setPages(pages.map(p => p.id === editingId ? { id: editingId, title, slug: formattedSlug, content } : p));
        alert("পেজ সফলভাবে আপডেট হয়েছে!");
      } else {
        // Create New Page
        const docRef = await addDoc(collection(db, "dynamic_pages"), {
          title, slug: formattedSlug, content, createdAt: serverTimestamp()
        });
        setPages([...pages, { id: docRef.id, title, slug: formattedSlug, content }]);
        alert("পেজ সফলভাবে তৈরি হয়েছে!");
      }
      handleCancelEdit(); // Reset form
    } catch (error) {
      console.error("Error saving page:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (confirm("সত্যিই এই পেজটি ডিলিট করতে চান?")) {
      try {
        await deleteDoc(doc(db, "dynamic_pages", id));
        setPages(pages.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting page:", error);
      }
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="container py-5 fade-in">
      <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
        <LayoutDashboard size={28} className="me-3 text-success" />
        <h2 className="fw-bold mb-0">অ্যাডমিন ড্যাশবোর্ড</h2>
      </div>

      <div className="row g-4">
        {/* Page Builder Form */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-light">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <Plus size={20} className="me-2 text-primary" /> 
              {editingId ? "পেজ আপডেট করুন" : "নতুন কাস্টম পেজ তৈরি করুন"}
            </h5>
            <form onSubmit={handleSavePage}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">পেজের টাইটেল</label>
                  <input type="text" className="form-control" placeholder="যেমন: About Us" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">পেজের লিংক (Slug)</label>
                  <input type="text" className="form-control" placeholder="যেমন: about-us" value={slug} onChange={e => setSlug(e.target.value)} required />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold">পেজের ডিজাইন ও কন্টেন্ট (HTML)</label>
                <textarea 
                  className="form-control font-monospace" rows={10} 
                  placeholder={`<div class="container">\n  <h3>Hello World</h3>\n</div>`} 
                  value={content} onChange={e => setContent(e.target.value)} required 
                ></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" disabled={isPublishing} className="btn btn-success fw-bold px-4 rounded-pill">
                  {isPublishing ? "সেভ হচ্ছে..." : (editingId ? "আপডেট করুন" : "পেজ পাবলিশ করুন")}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="btn btn-outline-secondary fw-bold px-4 rounded-pill d-flex align-items-center">
                    <X size={16} className="me-1" /> বাতিল
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Existing Pages List */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <FileText size={20} className="me-2 text-success" /> আপনার তৈরি করা পেজগুলো
            </h5>
            {loading ? <p>লোড হচ্ছে...</p> : (
              <ul className="list-group list-group-flush">
                {pages.length === 0 && <li className="list-group-item text-muted">কোনো কাস্টম পেজ নেই।</li>}
                {pages.map(page => (
                  <li key={page.id} className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">{page.title}</h6>
                      <Link href={`/p/${page.slug}`} target="_blank" className="small text-primary text-decoration-none">
                        /p/{page.slug}
                      </Link>
                    </div>
                    <div className="d-flex gap-2">
                      <button onClick={() => handleEditClick(page)} className="btn btn-sm btn-outline-primary rounded-circle p-2">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeletePage(page.id)} className="btn btn-sm btn-outline-danger rounded-circle p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}