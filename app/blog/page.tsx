"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Trash2 } from "lucide-react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt?: any;
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // লোডিং স্টেটগুলো
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
    if (!newPost.title || !newPost.content) return alert("সব ফিল্ড পূরণ করুন");
    
    setIsPublishing(true); // পাবলিশ লোডিং শুরু
    try {
      const docRef = await addDoc(collection(db, "posts"), {
        title: newPost.title,
        content: newPost.content,
        date: new Date().toLocaleDateString("bn-BD"),
        createdAt: serverTimestamp()
      });
      
      setPosts([{ 
        id: docRef.id, 
        title: newPost.title, 
        content: newPost.content, 
        date: new Date().toLocaleDateString("bn-BD") 
      }, ...posts]);
      
      setNewPost({ title: "", content: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding post: ", error);
    } finally {
      setIsPublishing(false); // পাবলিশ লোডিং শেষ
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("সত্যিই ডিলিট করতে চান?")) {
      setDeletingId(id); // ডিলিট লোডিং শুরু
      try {
        await deleteDoc(doc(db, "posts", id));
        setPosts(posts.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting post: ", error);
      } finally {
        setDeletingId(null); // ডিলিট লোডিং শেষ
      }
    }
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
            <input 
              type="text" className="form-control bg-white mb-3" placeholder="পোস্টের শিরোনাম"
              value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})}
              required
            />
            <textarea 
              className="form-control bg-white mb-3" rows={5} placeholder="বিস্তারিত লিখুন..."
              value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})}
              required
            ></textarea>
            <button type="submit" disabled={isPublishing} className="btn btn-success fw-bold px-4 rounded-pill d-flex align-items-center">
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
                <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden hover-shadow transition-all">
                  <div className="card-body p-4">
                    <small className="text-success fw-bold mb-2 d-inline-block bg-success bg-opacity-10 px-2 py-1 rounded">{post.date}</small>
                    <h5 className="fw-bold mb-3 text-dark mt-2">{post.title}</h5>
                    <p className="text-muted small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
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