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
        <div className="spinner-border text-primary spinner-border-sm" role="status" />
        <span className="ms-2 text-muted small fw-bold">{t.generic.loading}</span>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-top fade-in">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-body mb-1 d-flex align-items-center">
            <BookOpen size={24} className="me-2 text-primary" /> {t.blog.title}
          </h3>
          <p className="text-muted mb-0 small">ভূমি জরিপ, ফারায়েজ এবং আইনি পরামর্শ পড়ুন</p>
        </div>
        <Link
          href="/blog"
          className="btn btn-outline-primary rounded-pill px-4 fw-bold d-flex align-items-center shadow-sm"
        >
          {t.blog.viewAll} <ArrowRight size={16} className="ms-2" />
        </Link>
      </div>

      <div className="row g-4">
        {posts.map((post) => (
          <div key={post.id} className="col-md-6 col-lg-4">
            <div
              className="card h-100 shadow-sm border border-primary border-opacity-10 rounded-4 overflow-hidden hover-shadow transition-all"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <div className="card-body p-4">
                <small className="text-primary fw-bold mb-3 d-inline-block bg-primary bg-opacity-10 px-2 py-1 rounded">
                  {new Date(post.createdAt).toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </small>
                <h6 className="fw-bold mb-3 text-body lh-base">{post.title}</h6>
                <p
                  className="text-muted small mb-0 lh-lg"
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
              <div className="card-footer bg-transparent border-0 p-4 pt-0">
                <Link
                  href={`/blog/${post.categorySlug || "general"}/${post.slug || post.id}`}
                  className="text-primary text-decoration-none fw-bold small d-flex align-items-center"
                >
                  {t.blog.readMore} <ArrowRight size={14} className="ms-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
