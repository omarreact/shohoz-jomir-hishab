import Link from "next/link";
import { Clock, User } from "lucide-react";
import { Card, CardBody } from "@/src/shared/ui/Card";
import { Badge } from "@/src/shared/ui/Badge";

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
    <div className={`card-new h-full flex flex-col group ${featured ? 'md:flex-row' : ''}`}>
      <Link href={`/blog/${post.categorySlug || 'general'}/${post.slug}`} className="flex-1 flex flex-col md:flex-row w-full h-full">
        <div 
          className={`relative overflow-hidden w-full ${featured ? 'md:w-1/2 h-64 md:h-auto' : 'h-52'}`} 
        >
          {/* Placeholder for actual Next.js Image */}
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
            style={{ 
              backgroundImage: `url(${post.coverImage})`, 
            }} 
          />
          <div className="absolute top-4 left-4">
            <span className="bg-[var(--accent)] text-[var(--bg)] text-xs font-bold px-3 py-1 rounded-full shadow-md">
              {post.category}
            </span>
          </div>
        </div>
        
        <div className={`p-6 flex flex-col flex-1 ${featured ? 'md:w-1/2 justify-center' : ''}`}>
          <h3 className={`font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent)] transition-colors line-clamp-2 ${featured ? 'text-2xl md:text-3xl leading-snug' : 'text-xl'}`}>
            {post.title}
          </h3>
          <p className={`text-[var(--text-secondary)] flex-1 line-clamp-3 mb-6 ${featured ? 'text-lg' : 'text-base'}`}>
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <div className="bg-[var(--border)] rounded-full w-8 h-8 flex items-center justify-center">
                <User size={14} className="text-[var(--text-primary)]" />
              </div>
              <span className="font-bold text-[var(--text-primary)]">{post.author}</span>
            </div>
            <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm font-medium">
              <span>{post.date}</span>
              <span className="flex items-center gap-1"><Clock size={14} className="text-[var(--accent)]" /> {post.readingTime}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
