import Link from "next/link";
import { ArrowLeft, Clock, Share2, Link as LinkIcon, MessageCircle } from "lucide-react";
import TableOfContents from "@/src/features/blog/components/TableOfContents";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import BlogCard from "@/src/features/blog/components/BlogCard";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReadingProgress } from "@/src/features/blog/components/ReadingProgress";

export default async function SingleBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // In a real application, you would fetch the post data using the slug
  const post = {
    title: "বাংলাদেশে ডিজিটাল ভূমি জরিপের ভবিষ্যৎ: যা জানা প্রয়োজন",
    date: "১৫ জুলাই, ২০২৬",
    readingTime: "৫ মিনিট পাঠ",
    author: {
      name: "মো. ওমর ফারুক",
      role: "লিড ইঞ্জিনিয়ার এবং জিআইএস বিশেষজ্ঞ",
      avatar: "" // Optional
    },
    coverImage: "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop",
    category: "ডিজিটাল জরিপ"
  };

  return (
    <div className="bg-background">
      <ReadingProgress />
      {/* Hero Banner */}
      <div 
        className="position-relative d-flex align-items-center justify-content-center pt-5 pb-4" 
        style={{ minHeight: "400px", backgroundColor: "var(--slate-900)" }}
      >
        <div 
          className="position-absolute w-100 h-100 top-0 start-0 opacity-25"
          style={{ 
            backgroundImage: `url(${post.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="position-absolute w-100 h-100 top-0 start-0" style={{ background: "linear-gradient(to top, var(--slate-900), transparent)" }} />
        
        <div className="container position-relative z-1 text-center text-white mt-5">
          <Link href="/blog" className="text-decoration-none text-white opacity-75 hover-text-primary d-inline-flex align-items-center gap-2 mb-4">
            <ArrowLeft size={16} /> জার্নালে ফিরে যান
          </Link>
          <div className="mb-3">
            <Badge variant="primary">{post.category}</Badge>
          </div>
          <h1 className="display-4 fw-bold mb-4 mx-auto" style={{ maxWidth: "800px", lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <div className="d-flex align-items-center justify-content-center gap-4 text-white opacity-75">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-secondary rounded-circle" style={{ width: "32px", height: "32px" }}></div>
              <div className="text-start">
                <div className="fw-bold small">{post.author.name}</div>
                <div style={{ fontSize: "12px" }}>{post.author.role}</div>
              </div>
            </div>
            <div className="vr bg-white opacity-25"></div>
            <div>{post.date}</div>
            <div className="vr bg-white opacity-25"></div>
            <div className="d-flex align-items-center gap-1"><Clock size={16} /> {post.readingTime}</div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-5">
          {/* Main Content */}
          <div className="col-1lg-8 col-xl-8 mx-auto">
            <article className="blog-content text-white" style={{ fontSize: "1.1rem", lineHeight: 1.8 }}>
              <p className="lead mb-5 text-secondary">
                ডিজিটাল জরিপ প্রযুক্তি কীভাবে বাংলাদেশের ভূমি নিবন্ধন এবং দ্বন্দ্ব নিরসনের ল্যান্ডস্কেপ পরিবর্তন করছে তার একটি বিশদ আলোচনা। যখন একটি দেশ সম্পূর্ণরূপে ডিজিটালাইজড পরিকাঠামোর দিকে এগিয়ে যাচ্ছে, তখন ভূমিমালিক এবং পেশাদারদের জন্য এই পরিবর্তনগুলি বোঝা অত্যন্ত গুরুত্বপূর্ণ।
              </p>

              <h2 id="introduction" className="fw-bold mb-4 mt-5 text-white">LandBD এর ভূমিকা</h2>
              <p className="mb-4">
                দশকের পর দশক ধরে, বাংলাদেশে ভূমি জরিপ ঐতিহ্যগত পদ্ধতির উপর নির্ভরশীল ছিল যা একসময় কার্যকর হলেও পরবর্তীতে প্রায়ই অসঙ্গতি এবং দীর্ঘস্থায়ী বিবাদের কারণ হয়ে দাঁড়ায়। আরটিকে জিপিএস (RTK GPS) এবং ড্রোন ফটোগ্রামেট্রি এর মতো ডিজিটাল পদ্ধতির প্রবর্তন নিখুঁততায় বিপ্লব এনেছে।
              </p>
              
              <figure className="figure my-5 w-100">
                <img 
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop" 
                  className="figure-img img-fluid rounded w-100 shadow-sm" 
                  alt="Digital Surveying" 
                  style={{ borderRadius: "var(--radius-lg)" }}
                />
                <figcaption className="figure-caption text-center mt-2">গ্রামাঞ্চলে ব্যবহৃত আধুনিক আরটিকে জিপিএস (RTK GPS) সরঞ্জাম।</figcaption>
              </figure>

              <h2 id="how-it-works" className="fw-bold mb-4 mt-5 text-white">সার্চ ইঞ্জিন কীভাবে কাজ করে</h2>
              <p className="mb-4">
                ডিজিটাল প্ল্যাটফর্মের দিকে ঝুঁকে পড়ার অর্থ হলো এখন আমাদের হাতের নাগালেই ডাটা লভ্য। LandBD-এর মতো সিস্টেমগুলি সিটিজেন পোর্টালগুলোর সাথে স্পেশিয়াল ডেটাবেস যুক্ত করে, যা দাগের সীমানা, খতিয়ানের রেকর্ড এবং জোনিং আইন (ড্যাপ) সম্পর্কে রিয়েল-টাইম ডাটা প্রদান করে।
              </p>
              
              <div className="p-4 my-5 bg-secondary bg-opacity-10 rounded border-start border-primary border-4" style={{ borderRadius: "var(--radius-md)" }}>
                <p className="mb-0 fst-italic text-secondary">
                  "ভূমি রেকর্ডের ডিজিটাইজেশন শুধুমাত্র প্রশাসনিক উন্নয়ন নয়; এটি নাগরিকদের সম্পত্তির অধিকার সুনিশ্চিত করার ক্ষেত্রে একটি মৌলিক পরিবর্তন।" — ভূমি মন্ত্রণালয়
                </p>
              </div>

              <h2 id="benefits" className="fw-bold mb-4 mt-5 text-white">সার্ভেয়ারদের জন্য সুবিধাসমূহ</h2>
              <ul className="mb-4 ps-4">
                <li className="mb-2"><strong>অভূতপূর্ব নিখুঁততা:</strong> সাব-সেন্টিমিটার নির্ভুলতা নিশ্চিত করে যে সীমানা নিয়ে কোনো বিতর্ক থাকবে নিয়োগ করা যায়।</li>
                <li className="mb-2"><strong>সময়ের সাশ্রয়:</strong> যে জরিপ করতে আগে দিনের পর দিন লাগতো, তা এখন কয়েক ঘণ্টার মধ্যেই সম্ভব।</li>
                <li className="mb-2"><strong>ডাটা সমন্বয়:</strong> ঐতিহাসিক সিএস, আরএস এবং বিএস ম্যাপের সাথে নতুন জরিপের নির্ভুল ওভারলে।</li>
              </ul>

              <h2 id="future" className="fw-bold mb-4 mt-5 text-white">ভবিষ্যতের রূপরেখা</h2>
              <p className="mb-4">
                ২০৩০ সালের দিকে তাকালে আমাদের লক্ষ্য হলো একটি সম্পূর্ণ সমন্বিত ন্যাশনাল ল্যান্ড ইন্টেলিজেন্স প্ল্যাটফর্ম তৈরি করা। আর্টিফিশিয়াল ইন্টেলিজেন্স বিবাদ ঘটার আগেই তার পূর্বাভাস দিতে, জোনিং ট্রেন্ড বিশ্লেষণ করতে এবং উত্তরাধিকার বণ্টন স্বয়ংক্রিয় করতে একটি বিশাল ভূমিকা পালন করবে।
              </p>
            </article>

            {/* Share and Tags */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center py-4 mt-5 border-top border-bottom border-secondary border-opacity-25 gap-3">
              <div className="d-flex gap-2">
                <Badge variant="secondary">আরটিকে জিপিএস</Badge>
                <Badge variant="secondary">ডিজিটাল জরিপ</Badge>
                <Badge variant="secondary">ভূমি আইন</Badge>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="fw-bold text-secondary small text-uppercase">শেয়ার করুন:</span>
                <Button variant="outline" size="icon" className="rounded-circle text-primary"><Share2 size={18} /></Button>
                <Button variant="outline" size="icon" className="rounded-circle text-info"><MessageCircle size={18} /></Button>
                <Button variant="outline" size="icon" className="rounded-circle text-primary"><LinkIcon size={18} /></Button>
              </div>
            </div>

            {/* Author Box */}
            <Card variant="default" className="border-0 my-5" style={{ backgroundColor: "var(--card-bg)" }}>
              <CardBody className="p-4 d-flex gap-4 align-items-center">
                <div className="bg-secondary rounded-circle flex-shrink-0" style={{ width: "80px", height: "80px" }}></div>
                <div>
                  <h4 className="fw-bold mb-1 text-white">{post.author.name}</h4>
                  <p className="text-secondary small fw-bold text-uppercase mb-2">{post.author.role}</p>
                  <p className="text-secondary mb-0">ওমর একজন জিআইএস বিশেষজ্ঞ যিনি ওপেন ডাটা এবং বাংলাদেশের ভূমি রেকর্ডে সাধারণ মানুষের প্রবেশাধিকার নিশ্চিত করতে আগ্রহী।</p>
                </div>
              </CardBody>
            </Card>
            
            <NewsletterCta />
          </div>

          {/* Sidebar */}
          <div className="col-1lg-4 col-xl-4 d-none d-lg-block">
            <TableOfContents />
          </div>
        </div>
      </div>
    </div>
  );
}
