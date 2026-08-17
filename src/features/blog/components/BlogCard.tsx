import Link from "next/link";
import { Clock, User } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/src/shared/utils";

export interface BlogPost {
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
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow h-full flex flex-col group overflow-hidden ${featured ? 'md:flex-row' : ''}`}>
      <Link href={`/blog/${post.categorySlug || 'general'}/${post.slug}`} className="flex-1 flex flex-col md:flex-row w-full h-full">
        <div 
          className={`relative overflow-hidden w-full ${featured ? 'md:w-1/2 h-64 md:h-auto' : 'h-52'}`} 
        >
          {/* Placeholder for actual Next.js Image */}
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
            style={{ 
              backgroundImage: `url(${optimizeCloudinaryUrl(post.coverImage, 600)})`, 
            }} 
          />
          <div className="absolute top-4 left-4">
            <span className="bg-[#006a4e] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              {post.category}
            </span>
          </div>
        </div>
        
        <div className={`p-6 md:p-8 flex flex-col flex-1 ${featured ? 'md:w-1/2 justify-center' : ''}`}>
          <h3 className={`font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#006a4e] transition-colors line-clamp-2 ${featured ? 'text-2xl md:text-3xl leading-snug' : 'text-xl'}`}>
            {post.title}
          </h3>
          <p className={`text-slate-500 dark:text-slate-400 flex-1 line-clamp-3 mb-6 ${featured ? 'text-lg' : 'text-base'}`}>
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center">
                <User size={14} className="text-slate-900 dark:text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{post.author}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
              <span>{post.date}</span>
              <span className="flex items-center gap-1"><Clock size={14} className="text-[#006a4e]" /> {post.readingTime}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
