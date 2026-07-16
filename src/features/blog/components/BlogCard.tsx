import Link from "next/link";
import { Clock, User } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface BlogPost {
  slug: string;
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
    <Card hoverEffect variant={featured ? 'default' : 'flat'} className={`h-100 overflow-hidden border-0 ${featured ? 'border border-secondary border-opacity-25' : ''}`} style={{ backgroundColor: featured ? "var(--card-bg-secondary)" : "var(--card-bg)" }}>
      <Link href={`/blog/${post.slug}`} className="text-decoration-none">
        <div 
          className="position-relative w-100" 
          style={{ height: featured ? "300px" : "200px", backgroundColor: "var(--slate-200)", overflow: 'hidden' }}
        >
          {/* Placeholder for actual Next.js Image */}
          <div 
            className="w-100 h-100" 
            style={{ 
              backgroundImage: `url(${post.coverImage})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              transition: "transform 0.3s ease"
            }} 
          />
          <div className="position-absolute top-0 start-0 m-3">
            <Badge variant="primary" className="shadow-sm">
              {post.category}
            </Badge>
          </div>
        </div>
        
        <CardBody className="p-4 d-flex flex-column">
          <h3 className={`fw-bold text-white mb-3 ${featured ? 'fs-2' : 'fs-4'}`} style={{ lineHeight: 1.4 }}>
            {post.title}
          </h3>
          <p className="text-secondary flex-grow-1 mb-4" style={{ display: '-webkit-box', WebkitLineClamp: featured ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.excerpt}
          </p>
          
          <div className="d-flex align-items-center justify-content-between mt-auto pt-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2 text-secondary small">
              <div className="bg-secondary bg-opacity-25 rounded-circle" style={{ width: "24px", height: "24px" }}></div>
              <span className="fw-medium">{post.author}</span>
            </div>
            <div className="d-flex align-items-center gap-3 text-secondary small">
              <span>{post.date}</span>
              <span className="d-flex align-items-center gap-1"><Clock size={14} /> {post.readingTime}</span>
            </div>
          </div>
        </CardBody>
      </Link>
    </Card>
  );
}
