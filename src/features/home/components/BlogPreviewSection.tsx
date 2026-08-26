import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
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
    <section className="bg-white py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
              ভূমি <span className="text-[#006a4e]">নির্দেশিকা</span>
            </h2>
            <p className="m-0 text-base text-slate-500 dark:text-slate-400">
              ভূমি সংক্রান্ত ব্যবহারিক টিপস ও আইনি সারাংশ।
            </p>
          </div>
          <Link
            href={FEATURE_ROUTES.blog}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#006a4e] no-underline hover:underline"
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
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 no-underline shadow-sm transition hover:-translate-y-1 hover:border-[#006a4e]/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-36 items-end bg-gradient-to-br from-[#006a4e]/90 to-slate-800 p-5">
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {post.category || "ভূমি"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {post.createdAt && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock size={12} />
                      {formatBnDate(post.createdAt)}
                    </div>
                  )}
                  <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900 transition group-hover:text-[#006a4e] dark:text-white">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {toPlainText(post.excerpt)}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-[#006a4e] transition group-hover:gap-2">
                    আরও পড়ুন <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
