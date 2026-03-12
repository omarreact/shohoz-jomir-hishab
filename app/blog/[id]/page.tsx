"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Save, MessageSquare, Send, Trash2 } from "lucide-react";
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { BlogPost } from "../page";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface Comment {
  id: string;
  name: string;
  text: string;
  date: string;
}

export default function SingleBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const router = useRouter();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", content: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    if (postId) {
      fetchPostAndComments();
    }

    return () => unsubscribe();
  }, [postId]);

  const fetchPostAndComments = async () => {
    if (!postId) return;

    try {
      const docRef = doc(db, "posts", postId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as BlogPost;
        setPost({ ...data, id: docSnap.id }); 
        setEditData({ title: data.title, content: data.content });
      }

      const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedComments = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Comment[];
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSavePost = async () => {
    if (!postId) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "posts", postId);
      await updateDoc(docRef, { title: editData.title, content: editData.content });
      setPost({ ...post!, title: editData.title, content: editData.content });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if(confirm("সত্যিই এই পোস্টটি ডিলিট করতে চান?")) {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, "posts", postId));
        router.push("/blog"); 
      } catch (error) {
        console.error("Error deleting post:", error);
        setIsDeleting(false); 
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentName || !newCommentText || !postId) return;
    
    try {
      const dateStr = new Date().toLocaleDateString("bn-BD");
      const commentRef = await addDoc(collection(db, "posts", postId, "comments"), {
        name: newCommentName,
        text: newCommentText,
        date: dateStr,
        createdAt: serverTimestamp()
      });
      setComments([...comments, { id: commentRef.id, name: newCommentName, text: newCommentText, date: dateStr }]);
      setNewCommentName("");
      setNewCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
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

  if (!post) return <div className="text-center py-5 mt-5 text-muted fade-in">পোস্ট লোড হচ্ছে...</div>;

  return (
    <div className="container py-5 fade-in">
      <Link href="/blog" className="btn btn-light mb-4 d-inline-flex align-items-center text-secondary border rounded-pill px-3">
        <ArrowLeft size={16} className="me-2" /> ফিরে যান
      </Link>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 mb-4">
            {isEditing ? (
              <>
                <input type="text" className="form-control form-control-lg mb-4 fw-bold" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                
                <div className="bg-white rounded mb-4 border" style={{ minHeight: "350px", paddingBottom: "40px" }}>
                  <ReactQuill 
                    theme="snow" 
                    value={editData.content} 
                    onChange={val => setEditData({...editData, content: val})} 
                    modules={quillModules}
                    style={{ height: "300px" }}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button onClick={handleSavePost} disabled={isSaving} className="btn btn-success rounded-pill px-4 d-flex align-items-center">
                    {isSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <Save size={18} className="me-2"/>} 
                    {isSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </button>
                  <button onClick={() => setIsEditing(false)} disabled={isSaving} className="btn btn-outline-secondary rounded-pill px-4">বাতিল</button>
                </div>
              </>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <small className="text-success fw-bold bg-success bg-opacity-10 px-3 py-1 rounded-pill">{post.date}</small>
                  {isLoggedIn && (
                    <div className="d-flex gap-2">
                      <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-outline-primary rounded-circle p-2" title="এডিট করুন">
                        <Edit size={16}/>
                      </button>
                      <button onClick={handleDeletePost} disabled={isDeleting} className="btn btn-sm btn-outline-danger rounded-circle p-2" title="ডিলিট করুন">
                        {isDeleting ? <span className="spinner-border spinner-border-sm"></span> : <Trash2 size={16}/>}
                      </button>
                    </div>
                  )}
                </div>
                <h2 className="fw-bold mb-4 text-dark lh-base">{post.title}</h2>
                
                {/* যেহেতু এখন ডাটাবেসে HTML কোড (বোল্ড, ছবি ইত্যাদি) জমা হবে, 
                  তাই সেগুলোকে ব্রাউজারে সুন্দরভাবে দেখানোর জন্য dangerouslySetInnerHTML ব্যবহার করতে হবে। 
                */}
                <div 
                  className="text-secondary fs-5 lh-lg blog-content" 
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </>
            )}
          </div>

          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
            <h5 className="fw-bold mb-4 d-flex align-items-center">
              <MessageSquare size={20} className="me-2 text-success" /> মন্তব্যসমূহ ({comments.length})
            </h5>

            <div className="mb-5">
              {comments.map(c => (
                <div key={c.id} className="bg-light p-3 rounded-4 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark">{c.name}</span>
                    <span className="text-muted small">{c.date}</span>
                  </div>
                  <p className="text-secondary mb-0">{c.text}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-muted small text-center">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনি করুন!</p>}
            </div>

            <h6 className="fw-bold mb-3">আপনার মতামত জানান</h6>
            <form onSubmit={handleAddComment}>
              <div className="mb-3">
                <input type="text" className="form-control bg-light border-0" placeholder="আপনার নাম" value={newCommentName} onChange={e => setNewCommentName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <textarea className="form-control bg-light border-0" rows={3} placeholder="মন্তব্য লিখুন..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} required></textarea>
              </div>
              <button type="submit" className="btn btn-dark rounded-pill px-4 fw-bold d-flex align-items-center">
                <Send size={16} className="me-2" /> মন্তব্য পোস্ট করুন
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}