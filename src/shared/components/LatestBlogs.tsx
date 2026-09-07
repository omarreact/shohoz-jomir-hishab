"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { t } from "@/src/locales";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  categorySlug: string;
  createdAt: string;
}

export default function LatestBlogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blogs?status=Published")
      .then((r) => (r.ok ? r.json() : { blogs: [] }))
      .then((data) => {
        setPosts((data.blogs ?? []).slice(0, 3));
      })
      .catch((err) => console.error("Error fetching latest posts:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5 my-4">
        <div className="spinner-border text-blue-600 spinner-border-sm" role="status" />
        <span className="ml-2 text-slate-500 text-sm font-bold">{t.generic.loading}</span>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t fade-in">
      <div className="flex flex-col flex-sm-row justify-between align-items-sm-center mb-6 gap-3">
        <div>
          <h3 className="font-bold text-body mb-1 flex items-center">
            <BookOpen size={24} className="mr-2 text-blue-600" /> {t.blog.title}
          </h3>
          <p className="text-slate-500 mb-0 text-sm">ভূমি জরিপ, ফারায়েজ এবং আইনি পরামর্শ পড়ুন</p>
        </div>
        <Link
          href="/blog"
          className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-pill px-4 font-bold flex items-center shadow-sm"
        >
          {t.blog.viewAll} <ArrowRight size={16} className="ml-2" />
        </Link>
      </div>

      <div className="row g-4">
        {posts.map((post) => (
          <div key={post.id} className="col-md-6 col-lg-4">
            <div
              className="card h-full shadow-sm border border-blue-600 border-opacity-10 rounded-xl overflow-hidden hover-shadow transition-all bg-white dark:bg-slate-900"
            >
              <div className="card-body p-6">
                <small className="text-blue-600 font-bold mb-6 inline-block bg-blue-600 bg-opacity-10 px-2 py-1 rounded">
                  {new Date(post.createdAt).toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </small>
                <h6 className="font-bold mb-6 text-body lh-base">{post.title}</h6>
                <p
                  className="text-slate-500 text-sm mb-0 lh-lg"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {post.excerpt || ""}
                </p>
              </div>
              <div className="card-footer bg-transparent border-0 p-6 pt-0">
                <Link
                  href={`/blog/${post.categorySlug || "general"}/${post.slug || post.id}`}
                  className="text-blue-600 text-decoration-none font-bold text-sm flex items-center"
                >
                  {t.blog.readMore} <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
