import Link from "next/link";
import { Clock, User } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/src/shared/utils";
import { toPlainText } from "@/src/features/blog/sanitizeBlogText";

export interface BlogPost {
  /** Firestore / static document id — used in public URL */
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
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow h-full flex flex-col group overflow-hidden ${
        featured ? "md:flex-row" : ""
      }`}
    >
      <Link href={href} className="flex h-full w-full flex-1 flex-col md:flex-row">
        <div
          className={`relative w-full overflow-hidden ${
            featured ? "h-64 md:h-auto md:w-1/2" : "h-52"
          }`}
        >
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage: `url(${optimizeCloudinaryUrl(post.coverImage, 600)})`,
            }}
          />
          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-[#006a4e] px-3 py-1 text-xs font-bold text-white shadow-md">
              {post.category}
            </span>
          </div>
        </div>

        <div
          className={`flex flex-1 flex-col p-6 md:p-8 ${
            featured ? "justify-center md:w-1/2" : ""
          }`}
        >
          <h3
            className={`mb-3 line-clamp-2 font-bold text-slate-900 transition-colors group-hover:text-[#006a4e] dark:text-white ${
              featured ? "text-2xl leading-snug md:text-3xl" : "text-xl"
            }`}
          >
            {post.title}
          </h3>
          <p
            className={`mb-6 line-clamp-3 flex-1 text-slate-500 dark:text-slate-400 ${
              featured ? "text-lg" : "text-base"
            }`}
          >
            {excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <User size={14} className="text-slate-900 dark:text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{post.author}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span>{post.date}</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-[#006a4e]" /> {post.readingTime}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
