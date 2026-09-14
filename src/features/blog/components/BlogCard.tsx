import Link from "next/link";
import { Clock, User } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/src/shared/utils";
import { toPlainText } from "@/src/features/blog/sanitizeBlogText";

export interface BlogPost {
  id: string;
  slug: string;
  categorySlug?: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  date: string;
  readingTime: string;
  category: string;
}

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const href = `/blog/${post.categorySlug || "general"}/${post.id || post.slug}`;
  const excerpt = toPlainText(post.excerpt);

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-gold)_28%,var(--border-color))] hover:shadow-[var(--shadow-md)] ${
        featured ? "md:flex-row" : ""
      }`}
    >
      <Link href={href} className={`flex h-full w-full flex-1 flex-col no-underline ${featured ? "md:flex-row" : ""}`}>
        <div className={`relative w-full overflow-hidden ${featured ? "h-56 sm:h-64 md:h-auto md:w-1/2" : "h-48 sm:h-52"}`}>
          <div
            className="h-full w-full bg-slate-100 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${optimizeCloudinaryUrl(post.coverImage, 600)})` }}
          />
          <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
            <span className="rounded-full bg-[var(--brand-gold)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--primary-foreground)] shadow-sm sm:px-3 sm:text-xs">
              {post.category}
            </span>
          </div>
        </div>

        <div className={`flex flex-1 flex-col p-4 sm:p-5 ${featured ? "justify-center md:w-1/2 md:p-7" : ""}`}>
          <h3 className={`line-clamp-2 font-extrabold leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--brand-gold-text)] ${featured ? "text-xl sm:text-2xl md:text-3xl" : "text-lg sm:text-xl"}`}>
            {post.title}
          </h3>
          <p className={`mt-2 line-clamp-3 flex-1 leading-6 text-[var(--muted-foreground)] ${featured ? "text-sm sm:text-base" : "text-sm"}`}>
            {excerpt}
          </p>

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border-color)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--muted-foreground)] sm:text-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)]">
                <User size={14} />
              </span>
              <span className="truncate font-bold text-[var(--foreground)]">{post.author}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
              <span>{post.date}</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-[var(--brand-gold-text)]" /> {post.readingTime}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
