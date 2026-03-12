"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowRight, BookOpen } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function LatestBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        // সর্বশেষ ৩টি পোস্ট নিয়ে আসার জন্য limit(3) ব্যবহার করা হয়েছে
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(3));
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BlogPost[];
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching latest posts: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5 my-4">
        <div className="spinner-border text-success spinner-border-sm" role="status"></div>
        <span className="ms-2 text-muted small fw-bold">ব্লগ লোড হচ্ছে...</span>
      </div>
    );
  }

  // যদি কোনো পোস্ট না থাকে তবে এই সেকশনটি দেখাবে না
  if (posts.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-top fade-in">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center">
            <BookOpen size={24} className="me-2 text-success" /> সর্বশেষ আইন ও ভূমি ব্লগ
          </h3>
          <p className="text-secondary mb-0 small">ভূমি জরিপ, ফারায়েজ এবং আইনি পরামর্শ পড়ুন</p>
        </div>
        <Link href="/blog" className="btn btn-outline-success rounded-pill px-4 fw-bold d-flex align-items-center shadow-sm">
          সবগুলো দেখুন <ArrowRight size={16} className="ms-2" />
        </Link>
      </div>
      
      <div className="row g-4">
        {posts.map(post => (
          <div key={post.id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border border-success border-opacity-10 rounded-4 overflow-hidden hover-shadow transition-all bg-white">
              <div className="card-body p-4">
                <small className="text-success fw-bold mb-3 d-inline-block bg-success bg-opacity-10 px-2 py-1 rounded">{post.date}</small>
                <h6 className="fw-bold mb-3 text-dark lh-base">{post.title}</h6>
                <p className="text-muted small mb-0 lh-lg" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.content}
                </p>
              </div>
              <div className="card-footer bg-transparent border-0 p-4 pt-0">
                <Link href={`/blog/${post.id}`} className="text-success text-decoration-none fw-bold small d-flex align-items-center">
                  বিস্তারিত পড়ুন <ArrowRight size={14} className="ms-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}