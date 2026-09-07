import Link from "next/link";
import { ArrowRight, Clock, Download } from "lucide-react";
import { STATIC_BLOG_POSTS } from "@/src/features/blog/content/static-posts";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { toPlainText } from "@/src/features/blog/sanitizeBlogText";

function formatBnDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function BlogPreviewSection() {
  const posts = STATIC_BLOG_POSTS.filter((p) => p.status === "Published").slice(0, 3);

  return (
    <section
      className="border-t border-[var(--border-color)] bg-[var(--card-bg)] py-16 md:py-20"
      aria-labelledby="blog-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-bold text-[#1A6B3C]">জ্ঞান ও নির্দেশিকা</p>
            <h2 id="blog-heading" className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
              ভূমি <span className="text-[#1A6B3C]">নির্দেশিকা</span>
            </h2>
            <p className="mt-3 text-base text-[var(--muted-foreground)]">
              ভূমি সংক্রান্ত ব্যবহারিক টিপস ও আইনি সারাংশ।
            </p>
          </div>
          <Link
            href={FEATURE_ROUTES.blog}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-bold text-[#1A6B3C] no-underline hover:underline"
          >
            সবগুলো দেখুন <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => {
            const href = `/blog/${post.categorySlug || "general"}/${post.id}`;
            return (
              <Link
                key={post.id}
                href={href}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--background)] no-underline shadow-sm transition hover:-translate-y-1 hover:border-[#1A6B3C]/30 hover:shadow-lg"
              >
                <div className="flex h-32 items-end bg-[#0D1F17] p-5">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {post.category || "ভূমি"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <Clock size={12} />
                    {post.createdAt ? formatBnDate(post.createdAt) : ""}
                  </div>
                  <h3 className="mb-2 text-lg font-bold leading-snug text-[var(--foreground)] group-hover:text-[#1A6B3C]">
                    {post.title}
                  </h3>
                  <p className="mb-4 line-clamp-2 flex-1 text-sm leading-7 text-[var(--muted-foreground)]">
                    {toPlainText(post.excerpt || "")}
                  </p>
                  <span className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[#1A6B3C]">
                    আরও পড়ুন <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-3xl border border-[var(--border-color)] bg-[var(--background)] p-6 sm:flex-row md:p-8">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
              <Download size={18} className="text-[#1A6B3C]" />
              সহজ জমির হিসাব অ্যাপ
            </div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">মোবাইল অ্যাপ শীঘ্রই আসছে।</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <span
              title="শীঘ্রই আসছে"
              aria-disabled="true"
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl border border-[var(--border-color)] px-5 py-3 text-sm font-bold text-[var(--foreground)] opacity-70"
            >
              App Store · শীঘ্রই
            </span>
            <span
              title="শীঘ্রই আসছে"
              aria-disabled="true"
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl border border-[var(--border-color)] px-5 py-3 text-sm font-bold text-[var(--foreground)] opacity-70"
            >
              Google Play · শীঘ্রই
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
