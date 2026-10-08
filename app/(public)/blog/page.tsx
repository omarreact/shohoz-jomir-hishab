"use client";

import { useCallback, useEffect, useState } from "react";
import BlogCard, { BlogPost } from "@/src/features/blog/components/BlogCard";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import { Search } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { STATIC_BLOG_POSTS } from "@/src/features/blog/content/static-posts";
import { toPlainText } from "@/src/features/blog/sanitizeBlogText";

type ApiBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  category: string;
  categorySlug: string;
  status: string;
  readingTime: string | null;
  createdAt: string;
};

function toBlogPost(b: ApiBlog): BlogPost {
  return {
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
  };
}

function staticFallback(): BlogPost[] {
  return STATIC_BLOG_POSTS.filter((p) => p.status === "Published").map((p) =>
    toBlogPost({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      author: p.author,
      category: p.category,
      categorySlug: p.categorySlug,
      status: p.status,
      readingTime: p.readingTime,
      createdAt: p.createdAt,
    }),
  );
}

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="h-44 bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-5 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("সকল পোস্ট");

  const applyList = useCallback((blogData: BlogPost[]) => {
    if (blogData.length > 0) {
      setFeaturedPost(blogData[0]);
      setPosts(blogData.slice(1));
    } else {
      setFeaturedPost(null);
      setPosts([]);
    }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await fetch("/api/blogs?status=Published", {
        signal: ac.signal,
        cache: "no-store",
      });
      const json = r.ok ? await r.json() : null;
      const list: ApiBlog[] = json?.data?.blogs ?? json?.blogs ?? [];
      let blogData = list.map(toBlogPost);
      if (blogData.length === 0) {
        blogData = staticFallback();
      }
      applyList(blogData);
    } catch {
      setLoadError(true);
      applyList(staticFallback());
    } finally {
      clearTimeout(timer);
      setIsLoading(false);
    }
  }, [applyList]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = [
    "সকল পোস্ট",
    ...new Set(
      posts.concat(featuredPost ? [featuredPost] : []).map((p) => p.category),
    ),
  ];

  const allPosts = featuredPost ? [featuredPost, ...posts] : posts;
  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "সকল পোস্ট" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const displayFeatured =
    featuredPost && activeCategory === "সকল পোস্ট" && searchQuery === "";

  return (
    <>
      <HeroBanner
        align="center"
        badge="ভূমি জ্ঞানভাণ্ডার"
        title={
          <>
            ভূমি সম্পর্কিত{" "}
            <span className="text-[#006a4e]">জ্ঞানের ভাণ্ডার</span>
          </>
        }
        description="বাংলাদেশের ভূমি আইন, ডিজিটাল জরিপ এবং উত্তরাধিকার সম্পর্কে ইনসাইট, গাইড এবং আপডেট।"
        pattern="none"
      />

      <div className="fade-in visible mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loadError && (
          <p className="mb-6 text-center text-sm text-amber-700 dark:text-amber-400">
            সার্ভার থেকে লোড বিলম্বিত — স্থানীয় গাইড পোস্ট দেখানো হচ্ছে.{" "}
            <button type="button" className="font-bold underline" onClick={() => void load()}>
              আবার চেষ্টা
            </button>
          </p>
        )}

        {isLoading ? (
          <BlogSkeleton />
        ) : (
          <>
            {displayFeatured && featuredPost && (
              <section className="mb-16">
                <h4 className="mb-6 border-l-4 border-[#006a4e] pl-4 text-2xl font-bold text-slate-900 dark:text-white">
                  ফিচার্ড আর্টিকেল
                </h4>
                <BlogCard post={featuredPost} featured={true} />
              </section>
            )}

            <div className="mb-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row">
              <div className="hide-scrollbar flex w-full gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap rounded-full px-5 py-2 font-bold transition-colors ${
                      activeCategory === cat
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="আর্টিকেল খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-5 text-slate-900 transition-colors focus:border-[#006a4e] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <section className="mb-16">
              {filteredPosts.length > 0 ? (
                <>
                  <h4 className="mb-6 border-l-4 border-[#006a4e] pl-4 text-2xl font-bold text-slate-900 dark:text-white">
                    {searchQuery || activeCategory !== "সকল পোস্ট"
                      ? "ফলাফল"
                      : "সাম্প্রতিক পোস্টসমূহ"}
                  </h4>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {(searchQuery || activeCategory !== "সকল পোস্ট"
                      ? filteredPosts
                      : displayFeatured
                        ? posts
                        : allPosts
                    ).map((post) => (
                      <BlogCard key={post.id || post.slug} post={post} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center">
                  <p className="mb-4 text-xl text-slate-500 dark:text-slate-400">
                    কোনো পোস্ট পাওয়া যায়নি।
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("সকল পোস্ট");
                    }}
                    className="font-bold text-[#006a4e] underline"
                  >
                    ফিল্টার মুছুন
                  </button>
                </div>
              )}
            </section>

            <section className="mt-20 border-t border-slate-200 pt-16 dark:border-slate-800">
              <NewsletterCta />
            </section>
          </>
        )}
      </div>
    </>
  );
}
