"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Share2,
  Link as LinkIcon,
  MessageCircle,
  Loader2,
} from "lucide-react";
import TableOfContents from "@/src/features/blog/components/TableOfContents";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import BlogCard, { BlogPost } from "@/src/features/blog/components/BlogCard";
import BlogComments from "@/src/features/blog/components/BlogComments";
import { ReadingProgress } from "@/src/features/blog/components/ReadingProgress";

type PostData = {
  id: string;
  title: string;
  date: string;
  readingTime: string;
  author: { name: string; role: string; avatar: string };
  coverImage: string;
  category: string;
  categorySlug: string;
  content: string;
  excerpt: string;
  tags: string[];
};

type ApiBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  category: string;
  categorySlug: string;
  readingTime: string | null;
  createdAt: string;
};

function apiBlogToPost(b: ApiBlog): PostData {
  return {
    id: b.id,
    title: b.title,
    date: b.createdAt
      ? new Date(b.createdAt).toLocaleDateString("bn-BD", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "",
    readingTime: b.readingTime || "৫ মিনিট পাঠ",
    author: { name: b.author || "অ্যাডমিন", role: "কন্টেন্ট রাইটার", avatar: "" },
    coverImage:
      b.coverImage ||
      "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop",
    category: b.category || "সাধারণ",
    categorySlug: b.categorySlug || "general",
    content: (b as any).content || "",
    excerpt: b.excerpt || "",
    tags: (b as any).tags ? JSON.parse((b as any).tags) : [],
  };
}

export default function SingleBlogPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setErrorMsg(null);

    // Try by slug first, fall back to id lookup
    fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) return fetch(`/api/blogs/${encodeURIComponent(slug)}`);
        return r;
      })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (r.status === 500) throw new Error("সার্ভারের সাথে সংযোগ করা যাচ্ছে না।");
        if (!r.ok) throw new Error("ব্লগ লোড করতে সমস্যা হয়েছে।");
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        if (!json.success) {
          throw new Error(json.message || "ব্লগ লোড করতে সমস্যা হয়েছে।");
        }
        
        const blog = json.data.blog;
        setPost(apiBlogToPost(blog));

        // Fetch related posts (same category)
        if (blog.category) {
          fetch(`/api/blogs?status=Published`)
            .then((r) => r.ok ? r.json() : { data: { blogs: [] } })
            .then((resJson) => {
              const blogs: ApiBlog[] = resJson?.data?.blogs || [];
              const related = blogs
                .filter((b) => b.category === blog.category && b.id !== blog.id)
                .slice(0, 3)
                .map((b) => ({
                  slug: b.slug || b.id,
                  title: b.title,
                  excerpt: b.excerpt || "",
                  coverImage:
                    b.coverImage ||
                    "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop",
                  author: b.author || "অ্যাডমিন",
                  date: b.createdAt
                    ? new Date(b.createdAt).toLocaleDateString("bn-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "",
                  readingTime: b.readingTime || "৫ মিনিট পাঠ",
                  category: b.category || "সাধারণ",
                  categorySlug: b.categorySlug || "general",
                } as BlogPost));
              setRelatedPosts(related);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error("Error fetching blog post:", err);
        setErrorMsg(err.message || "ব্লগ লোড করতে সমস্যা হয়েছে।");
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="bg-[var(--bg)] min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-[var(--bg)] min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-red-500">ত্রুটি</h1>
        <p className="text-[var(--text-secondary)]">{errorMsg}</p>
        <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--accent)] hover:underline font-bold">
          <ArrowLeft size={18} /> জার্নালে ফিরে যান
        </Link>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="bg-[var(--bg)] min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">পোস্ট পাওয়া যায়নি</h1>
        <p className="text-[var(--text-secondary)]">আপনার অনুরোধকৃত ব্লগ পোস্টটি খুঁজে পাওয়া যায়নি।</p>
        <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--accent)] hover:underline font-bold">
          <ArrowLeft size={18} /> জার্নালে ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg)] min-h-screen">
      <ReadingProgress />

      {/* Hero Banner */}
      <div className="relative flex items-center justify-center pt-32 pb-24 min-h-[500px]">
        <div
          className="absolute inset-0 w-full h-full opacity-20"
          style={{ backgroundImage: `url(${post.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/80 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center mt-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6 font-bold">
            <ArrowLeft size={18} /> জার্নালে ফিরে যান
          </Link>
          <div className="mb-6">
            <span className="bg-[var(--accent)] text-[var(--bg)] text-sm font-bold px-4 py-1.5 rounded-full shadow-md inline-block">
              {post.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 mx-auto text-[var(--text-primary)] leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-[var(--text-secondary)] font-medium">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--border)] rounded-full w-10 h-10 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-[var(--text-primary)]">{post.author.name}</div>
                <div className="text-xs">{post.author.role}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--border)] hidden md:block" />
            <div>{post.date}</div>
            <div className="w-px h-8 bg-[var(--border)] hidden md:block" />
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[var(--accent)]" /> {post.readingTime}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 lg:col-start-1">
            <article
              className="prose prose-lg prose-invert max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--accent)] prose-strong:text-[var(--text-primary)] prose-li:text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Share and Tags */}
            <div className="flex flex-col md:flex-row justify-between items-center py-6 mt-12 border-t border-b border-[var(--border)] gap-6">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <span key={i} className="bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider">শেয়ার করুন:</span>
                <button className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-blue-400 hover:border-blue-400 hover:bg-blue-400/10 transition-colors">
                  <Share2 size={18} />
                </button>
                <button className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-green-400 hover:border-green-400 hover:bg-green-400/10 transition-colors">
                  <MessageCircle size={18} />
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                >
                  <LinkIcon size={18} />
                </button>
              </div>
            </div>

            {/* Author Box */}
            <div className="card-new my-12 p-8 flex flex-col md:flex-row gap-6 items-center md:items-start border-l-4 border-l-blue-500">
              <div className="bg-[var(--border)] rounded-full w-24 h-24 flex-shrink-0" />
              <div className="text-center md:text-left">
                <h4 className="text-2xl font-bold mb-1 text-[var(--text-primary)]">{post.author.name}</h4>
                <p className="text-[var(--accent)] font-bold uppercase text-sm tracking-wider mb-4">{post.author.role}</p>
                <p className="text-[var(--text-secondary)] mb-0 leading-relaxed text-lg">{post.excerpt}</p>
              </div>
            </div>

            <NewsletterCta />

            {post.id && <BlogComments blogId={post.id} />}

            {relatedPosts.length > 0 && (
              <section className="mt-16">
                <h4 className="text-2xl font-bold mb-6 text-[var(--text-primary)] border-l-4 border-[var(--accent)] pl-4">
                  সম্পর্কিত পোস্ট
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedPosts.map((rp) => (
                    <BlogCard key={rp.slug} post={rp} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-4 lg:col-start-9">
            <TableOfContents />
          </div>
        </div>
      </div>
    </div>
  );
}
