"use client";

import { useEffect, useState } from "react";
import BlogCard, { BlogPost } from "@/src/features/blog/components/BlogCard";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import { Search, Loader2 } from "lucide-react";
import HeroBanner from "@/components/ui/HeroBanner";

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
  };
}

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("সকল পোস্ট");

  useEffect(() => {
    fetch("/api/blogs?status=Published")
      .then((r) => (r.ok ? r.json() : { blogs: [] }))
      .then((data) => {
        const blogData: BlogPost[] = (data.blogs ?? []).map(toBlogPost);
        if (blogData.length > 0) {
          setFeaturedPost(blogData[0]);
          setPosts(blogData.slice(1));
        }
      })
      .catch((err) => console.error("Error fetching blogs:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = [
    "সকল পোস্ট",
    ...new Set(
      posts.concat(featuredPost ? [featuredPost] : []).map((p) => p.category)
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

  if (isLoading) {
    return (
      <>
        <HeroBanner
          align="center"
          badge="LandBD জার্নাল"
          title={
            <>
              ভূমি সম্পর্কিত{" "}
              <span className="accent-text">জ্ঞানের ভাণ্ডার</span>
            </>
          }
          description="বাংলাদেশের ভূমি আইন, ডিজিটাল জরিপ এবং উত্তরাধিকার সম্পর্কে ইনসাইট, গাইড এবং আপডেট।"
          pattern="none"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      </>
    );
  }

  return (
    <>
      <HeroBanner
        align="center"
        badge="LandBD জার্নাল"
        title={
          <>
            ভূমি সম্পর্কিত{" "}
            <span className="accent-text">জ্ঞানের ভাণ্ডার</span>
          </>
        }
        description="বাংলাদেশের ভূমি আইন, ডিজিটাল জরিপ এবং উত্তরাধিকার সম্পর্কে ইনসাইট, গাইড এবং আপডেট।"
        pattern="none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in visible min-h-screen">
        {displayFeatured && featuredPost && (
          <section className="mb-16">
            <h4 className="text-2xl font-bold mb-6 text-[var(--text-primary)] border-l-4 border-[var(--accent)] pl-4">
              ফিচার্ড আর্টিকেল
            </h4>
            <BlogCard post={featuredPost} featured={true} />
          </section>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
          <div className="flex gap-2 w-full overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-[var(--text-primary)] text-[var(--bg)]"
                    : "border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="আর্টিকেল খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-full px-5 py-2.5 pl-10 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
          </div>
        </div>

        <section className="mb-16">
          {filteredPosts.length > 0 ? (
            <>
              <h4 className="text-2xl font-bold mb-6 text-[var(--text-primary)] border-l-4 border-[var(--accent)] pl-4">
                {searchQuery || activeCategory !== "সকল পোস্ট"
                  ? "ফলাফল"
                  : "সাম্প্রতিক পোস্টসমূহ"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(searchQuery || activeCategory !== "সকল পোস্ট"
                  ? filteredPosts
                  : posts
                ).map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-[var(--text-secondary)]">
                কোনো পোস্ট পাওয়া যায়নি।
              </p>
            </div>
          )}
        </section>

        <section className="mt-20 border-t border-[var(--border)] pt-16">
          <NewsletterCta />
        </section>
      </div>
    </>
  );
}
