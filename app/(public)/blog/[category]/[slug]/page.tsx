"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Share2,
  Link as LinkIcon,
  Loader2,
  Check,
} from "lucide-react";
import { optimizeCloudinaryUrl } from "@/src/shared/utils";
import TableOfContents from "@/src/features/blog/components/TableOfContents";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import BlogCard, { BlogPost } from "@/src/features/blog/components/BlogCard";
import BlogComments from "@/src/features/blog/components/BlogComments";
import { ReadingProgress } from "@/src/features/blog/components/ReadingProgress";
import { sanitizeBlogHtml, toPlainText } from "@/src/features/blog/sanitizeBlogText";

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

/** Next.js sometimes leaves path segments percent-encoded; never double-encode. */
function normalizeRouteParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value ?? "";
  if (!raw) return "";
  let out = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}

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
    content: sanitizeBlogHtml((b as any).content || ""),
    excerpt: toPlainText(b.excerpt || ""),
    tags: (() => {
      const t = (b as any).tags;
      if (!t) return [];
      if (Array.isArray(t)) return t;
      if (typeof t === "string") {
        try {
          return JSON.parse(t);
        } catch {
          return t.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      return [];
    })(),
  };
}

export default function SingleBlogPage() {
  const params = useParams();
  // URL segment is now post id (preferred); old slug URLs still work via fallback
  const paramKey = normalizeRouteParam(params.slug as string | string[] | undefined);

  const [post, setPost] = useState<PostData | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!paramKey) return;
    setErrorMsg(null);
    setNotFound(false);
    setIsLoading(true);

    // Prefer id lookup (short stable URL), then legacy slug query
    fetch(`/api/blogs/${encodeURIComponent(paramKey)}`)
      .then((r) => {
        if (r.status === 404) {
          return fetch(`/api/blogs?slug=${encodeURIComponent(paramKey)}`);
        }
        return r;
      })
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
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

        if (blog.category) {
          fetch(`/api/blogs?status=Published`)
            .then((r) => (r.ok ? r.json() : { data: { blogs: [] } }))
            .then((resJson) => {
              const blogs: ApiBlog[] = resJson?.data?.blogs || [];
              const related = blogs
                .filter((b) => b.category === blog.category && b.id !== blog.id)
                .slice(0, 3)
                .map(
                  (b) =>
                    ({
                      id: b.id,
                      slug: b.slug || b.id,
                      title: b.title,
                      excerpt: toPlainText(b.excerpt || ""),
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
                    }) as BlogPost,
                );
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
  }, [paramKey]);

  const tocHeaders = useMemo(() => {
    if (!post?.content) return [];
    if (typeof window === "undefined") return [];
    try {
      const doc = new DOMParser().parseFromString(post.content, "text/html");
      const nodes = doc.querySelectorAll("h2, h3");
      const items: { id: string; text: string; level: number }[] = [];
      nodes.forEach((el, i) => {
        const text = (el.textContent || "").trim();
        if (!text) return;
        const id = el.id || `section-${i}`;
        items.push({
          id,
          text,
          level: el.tagName.toLowerCase() === "h3" ? 3 : 2,
        });
      });
      return items;
    } catch {
      return [];
    }
  }, [post?.content]);

  const contentWithIds = useMemo(() => {
    if (!post?.content) return "";
    let i = 0;
    return post.content.replace(/<(h2|h3)(\s[^>]*)?>/gi, (match, tag, attrs = "") => {
      if (/\sid=/i.test(attrs)) return match;
      const id = `section-${i++}`;
      return `<${tag}${attrs} id="${id}">`;
    });
  }, [post?.content]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (!post) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    handleCopyLink();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#006a4e]" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-red-500">ত্রুটি</h1>
        <p className="text-center text-slate-500 dark:text-slate-400">{errorMsg}</p>
        <Link href="/blog" className="inline-flex items-center gap-2 font-semibold text-[#006a4e] hover:underline">
          <ArrowLeft size={18} /> জার্নালে ফিরে যান
        </Link>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">পোস্ট পাওয়া যায়নি</h1>
        <p className="text-center text-slate-500 dark:text-slate-400">
          আপনার অনুরোধকৃত ব্লগ পোস্টটি খুঁজে পাওয়া যায়নি।
        </p>
        <Link href="/blog" className="inline-flex items-center gap-2 font-semibold text-[#006a4e] hover:underline">
          <ArrowLeft size={18} /> জার্নালে ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ReadingProgress />

      <header className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800">
        <div
          className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18]"
          style={{
            backgroundImage: `url(${optimizeCloudinaryUrl(post.coverImage, 1400)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/90 via-slate-50/95 to-slate-50 dark:from-slate-950/90 dark:via-slate-950/95 dark:to-slate-950" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-10 pt-24 sm:pb-12 sm:pt-28">
          <Link
            href="/blog"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#006a4e] dark:text-slate-400"
          >
            <ArrowLeft size={16} />
            জার্নালে ফিরে যান
          </Link>

          <div className="mb-4">
            <span className="inline-block rounded-full bg-[#006a4e] px-3.5 py-1 text-xs font-bold text-white shadow-sm">
              {post.category}
            </span>
          </div>

          <h1 className="text-balance text-2xl font-bold leading-snug text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006a4e]/15 text-sm font-bold text-[#006a4e]">
                {(post.author.name || "A").charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">{post.author.name}</div>
                <div className="text-xs">{post.author.role}</div>
              </div>
            </div>
            <span className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-700" />
            <span>{post.date}</span>
            <span className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-700" />
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} className="text-[#006a4e]" />
              {post.readingTime}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            {post.coverImage && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizeCloudinaryUrl(post.coverImage, 1200)}
                  alt={post.title}
                  className="h-48 w-full object-cover sm:h-64 md:h-72"
                />
              </div>
            )}

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div
                className="blog-article-body prose prose-slate max-w-none dark:prose-invert
                  prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                  prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300
                  prose-li:text-slate-700 dark:prose-li:text-slate-300
                  prose-strong:text-slate-900 dark:prose-strong:text-white
                  prose-a:font-semibold prose-a:text-[#006a4e] prose-a:no-underline hover:prose-a:underline
                  prose-hr:border-slate-200 dark:prose-hr:border-slate-700
                  prose-blockquote:border-l-[#006a4e] prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400"
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
              />
            </article>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap gap-2">
                {post.tags.length > 0 ? (
                  post.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">ট্যাগ নেই</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">শেয়ার</span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#006a4e] hover:text-[#006a4e] dark:border-slate-700 dark:text-slate-400"
                  aria-label="শেয়ার করুন"
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#006a4e] hover:text-[#006a4e] dark:border-slate-700 dark:text-slate-400"
                  aria-label="লিংক কপি"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-[#006a4e] bg-white p-6 sm:flex-row sm:items-start dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#006a4e]/15 text-2xl font-bold text-[#006a4e]">
                {(post.author.name || "A").charAt(0)}
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{post.author.name}</h4>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#006a4e]">
                  {post.author.role}
                </p>
                {post.excerpt ? (
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{post.excerpt}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-8">
              <NewsletterCta />
            </div>

            {post.id && (
              <div className="mt-8">
                <BlogComments blogId={post.id} />
              </div>
            )}

            {relatedPosts.length > 0 && (
              <section className="mt-12">
                <h4 className="mb-5 border-l-4 border-[#006a4e] pl-3 text-xl font-bold text-slate-900 dark:text-white">
                  সম্পর্কিত পোস্ট
                </h4>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((rp) => (
                    <BlogCard key={rp.id || rp.slug} post={rp} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:col-span-4 lg:block">
            <TableOfContents headers={tocHeaders} />
          </aside>
        </div>
      </div>
    </div>
  );
}
