"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Trash2 } from "lucide-react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// ReactQuill ডাইনামিক ইমপোর্ট
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <p className="text-muted py-3">এডিটর লোড হচ্ছে...</p>
});

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  category?: string;
  author?: string;
  coverImage?: string;
  createdAt?: any;
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "সাধারণ", author: "", coverImage: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    fetchPosts();
    return () => unsubscribe();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        ...doc.data(), id: doc.id
      })) as BlogPost[];
      
      setPosts(fetchedPosts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts: ", error);
      setLoading(false);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content || newPost.content === "<p><br></p>") {
      return alert("সব ফিল্ড পূরণ করুন");
    }
    
    setIsPublishing(true);
    try {
      const docRef = await addDoc(collection(db, "posts"), {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        author: newPost.author,
        coverImage: newPost.coverImage,
        date: new Date().toLocaleDateString("bn-BD"),
        createdAt: serverTimestamp()
      });
      
      setPosts([{ 
        id: docRef.id, 
        title: newPost.title, 
        content: newPost.content,
        category: newPost.category,
        author: newPost.author,
        coverImage: newPost.coverImage, 
        date: new Date().toLocaleDateString("bn-BD") 
      }, ...posts]);
      
      setNewPost({ title: "", content: "", category: "সাধারণ", author: "", coverImage: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding post: ", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("সত্যিই ডিলিট করতে চান?")) {
      setDeletingId(id);
      try {
        await deleteDoc(doc(db, "posts", id));
        setPosts(posts.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting post: ", error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  // HTML ট্যাগ রিমুভ করে শুধু টেক্সট দেখানোর ফাংশন (ব্লগ কার্ডের জন্য)
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  return (
    <div className="container py-5 fade-in">
      <div className="text-center mb-5 d-none d-lg-block">
        <h2 className="fw-bold text-dark mb-2">আইন বিষয়ক ব্লগ</h2>
        <p className="text-secondary">ভূমি, ফারায়েজ এবং আইন সংক্রান্ত গুরুত্বপূর্ণ তথ্য</p>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h3 className="fw-bold text-success mb-0 d-block d-lg-none">আমাদের ব্লগ</h3>
        
        {isLoggedIn && (
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary d-flex align-items-center rounded-pill px-4 shadow-sm ms-auto">
            <PlusCircle size={18} className="me-2" /> নতুন পোস্ট
          </button>
        )}
      </div>

      {isLoggedIn && showForm && (
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-5 bg-light fade-in">
          <h5 className="fw-bold mb-3 text-dark">নতুন পোস্ট লিখুন</h5>
          <form onSubmit={handleAddPost}>
            <div className="row g-3 mb-3">
              <div className="col-md-12">
                <input 
                  type="text" className="form-control form-control-lg bg-white fw-bold" placeholder="পোস্টের শিরোনাম"
                  value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
                  required
                />
              </div>
              <div className="col-md-4">
                <select className="form-select bg-white" value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}>
                  <option value="সাধারণ">সাধারণ</option>
                  <option value="আইন বিষয়ক">আইন বিষয়ক</option>
                  <option value="ভূমি পরিমাপ">ভূমি পরিমাপ</option>
                  <option value="ফারায়েজ">ফারায়েজ</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>
              <div className="col-md-4">
                <input 
                  type="text" className="form-control bg-white" placeholder="লেখকের নাম (ঐচ্ছিক)"
                  value={newPost.author} onChange={e => setNewPost({...newPost, author: e.target.value})}
                />
              </div>
              <div className="col-md-4">
                <input 
                  type="url" className="form-control bg-white" placeholder="কভার ইমেজের URL (ঐচ্ছিক)"
                  value={newPost.coverImage} onChange={e => setNewPost({...newPost, coverImage: e.target.value})}
                />
              </div>
            </div>
            {/* Textarea এর বদলে ReactQuill */}
            <div className="bg-white rounded mb-4" style={{ minHeight: "350px", paddingBottom: "40px" }}>
              <ReactQuill 
                theme="snow" 
                value={newPost.content} 
                onChange={(val) => setNewPost({...newPost, content: val})} 
                modules={quillModules}
                style={{ height: "300px" }}
                placeholder="এখানে আপনার ব্লগের লেখা শুরু করুন... ছবি যোগ করতে ওপরের ইমেজ আইকনে ক্লিক করুন।"
              />
            </div>
            <button type="submit" disabled={isPublishing} className="btn btn-success fw-bold px-4 rounded-pill d-flex align-items-center mt-2">
              {isPublishing ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              {isPublishing ? "পাবলিশ হচ্ছে..." : "পাবলিশ করুন"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
           <div className="spinner-border text-success" role="status"></div>
           <p className="mt-2 text-muted">লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="row g-4">
          {posts.length === 0 ? (
            <div className="text-center text-muted py-5 w-100 bg-light rounded-4">কোনো ব্লগ পোস্ট পাওয়া যায়নি।</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden hover-shadow transition-all d-flex flex-column bg-white">
                  {post.coverImage ? (
                    <div style={{ height: "200px", backgroundImage: `url(${post.coverImage})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                      <span className="badge bg-success position-absolute top-0 end-0 m-3 rounded-pill px-3 py-2 shadow-sm">{post.category || "সাধারণ"}</span>
                    </div>
                  ) : (
                    <div className="bg-light d-flex align-items-center justify-content-center position-relative" style={{ height: "200px" }}>
                      <span className="text-muted fw-bold opacity-50">কোনো ছবি নেই</span>
                      <span className="badge bg-success position-absolute top-0 end-0 m-3 rounded-pill px-3 py-2 shadow-sm">{post.category || "সাধারণ"}</span>
                    </div>
                  )}
                  <div className="card-body p-4 flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-success fw-bold bg-success bg-opacity-10 px-2 py-1 rounded">{post.date}</small>
                      {post.author && <small className="text-muted fw-medium border px-2 py-1 rounded-pill">{post.author}</small>}
                    </div>
                    <h5 className="fw-bold mb-3 text-dark mt-2 lh-base">{post.title}</h5>
                    <p className="text-muted small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {/* HTML ট্যাগ রিমুভ করে শুধু নরমাল টেক্সট দেখানো হচ্ছে */}
                      {stripHtml(post.content)}
                    </p>
                  </div>
                  <div className="card-footer bg-transparent border-top p-4 d-flex justify-content-between align-items-center">
                    <Link href={`/blog/${post.id}`} className="btn btn-outline-success rounded-pill px-3 fw-bold btn-sm">
                      বিস্তারিত পড়ুন
                    </Link>
                    
                    {isLoggedIn && (
                      <button onClick={() => handleDelete(post.id)} disabled={deletingId === post.id} className="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle p-2 border-0">
                        {deletingId === post.id ? <span className="spinner-border spinner-border-sm"></span> : <Trash2 size={16}/>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}