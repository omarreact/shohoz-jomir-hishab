import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Share2,
  Link as LinkIcon,
  MessageCircle,
} from "lucide-react";
import TableOfContents from "@/src/features/blog/components/TableOfContents";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import BlogCard from "@/src/features/blog/components/BlogCard";
import { ReadingProgress } from "@/src/features/blog/components/ReadingProgress";

export default async function SingleBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // In a real application, you would fetch the post data using the slug
  const post = {
    title: "বাংলাদেশে ডিজিটাল ভূমি জরিপের ভবিষ্যৎ: যা জানা প্রয়োজন",
    date: "১৫ জুলাই, ২০২৬",
    readingTime: "৫ মিনিট পাঠ",
    author: {
      name: "মো. ওমর ফারুক",
      role: "লিড ইঞ্জিনিয়ার এবং জিআইএস বিশেষজ্ঞ",
      avatar: "", // Optional
    },
    coverImage:
      "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop",
    category: "ডিজিটাল জরিপ",
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen">
      <ReadingProgress />
      {/* Hero Banner */}
      <div
        className="relative flex items-center justify-center pt-32 pb-24 min-h-[500px]"
      >
        <div
          className="absolute inset-0 w-full h-full opacity-20"
          style={{
            backgroundImage: `url(${post.coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/80 to-transparent"
        />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6 font-bold"
          >
            <ArrowLeft size={18} /> জার্নালে ফিরে যান
          </Link>
          <div className="mb-6">
            <span className="bg-[var(--accent)] text-[var(--bg)] text-sm font-bold px-4 py-1.5 rounded-full shadow-md inline-block">
              {post.category}
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 mx-auto text-[var(--text-primary)] leading-tight"
          >
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-[var(--text-secondary)] font-medium">
            <div className="flex items-center gap-3">
              <div
                className="bg-[var(--border)] rounded-full w-10 h-10 flex-shrink-0"
              ></div>
              <div className="text-left">
                <div className="font-bold text-[var(--text-primary)]">{post.author.name}</div>
                <div className="text-xs">{post.author.role}</div>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--border)] hidden md:block"></div>
            <div>{post.date}</div>
            <div className="w-px h-8 bg-[var(--border)] hidden md:block"></div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[var(--accent)]" /> {post.readingTime}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 lg:col-start-1">
            <article
              className="prose prose-lg prose-invert max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--accent)] prose-strong:text-[var(--text-primary)] prose-li:text-[var(--text-secondary)]"
            >
              <p className="text-xl md:text-2xl leading-relaxed mb-10 text-[var(--text-primary)]/80 font-medium border-l-4 border-[var(--accent)] pl-6 py-2">
                ডিজিটাল জরিপ প্রযুক্তি কীভাবে বাংলাদেশের ভূমি নিবন্ধন এবং
                দ্বন্দ্ব নিরসনের ল্যান্ডস্কেপ পরিবর্তন করছে তার একটি বিশদ
                আলোচনা। যখন একটি দেশ সম্পূর্ণরূপে ডিজিটালাইজড পরিকাঠামোর দিকে
                এগিয়ে যাচ্ছে, তখন ভূমিমালিক এবং পেশাদারদের জন্য এই পরিবর্তনগুলি
                বোঝা অত্যন্ত গুরুত্বপূর্ণ।
              </p>

              <h2 id="introduction" className="text-2xl md:text-3xl font-bold mt-12 mb-6">
                LandBD এর ভূমিকা
              </h2>
              <p className="mb-6">
                দশকের পর দশক ধরে, বাংলাদেশে ভূমি জরিপ ঐতিহ্যগত পদ্ধতির উপর
                নির্ভরশীল ছিল যা একসময় কার্যকর হলেও পরবর্তীতে প্রায়ই অসঙ্গতি
                এবং দীর্ঘস্থায়ী বিবাদের কারণ হয়ে দাঁড়ায়। আরটিকে জিপিএস (RTK
                GPS) এবং ড্রোন ফটোগ্রামেট্রি এর মতো ডিজিটাল পদ্ধতির প্রবর্তন
                নিখুঁততায় বিপ্লব এনেছে।
              </p>

              <figure className="my-10 w-full relative group rounded-2xl overflow-hidden shadow-xl border border-[var(--border)]">
                <img
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                  alt="Digital Surveying"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <figcaption className="absolute bottom-0 left-0 right-0 p-4 text-center text-white/90 font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  গ্রামাঞ্চলে ব্যবহৃত আধুনিক আরটিকে জিপিএস (RTK GPS) সরঞ্জাম।
                </figcaption>
              </figure>

              <h2 id="how-it-works" className="text-2xl md:text-3xl font-bold mt-12 mb-6">
                সার্চ ইঞ্জিন কীভাবে কাজ করে
              </h2>
              <p className="mb-6">
                ডিজিটাল প্ল্যাটফর্মের দিকে ঝুঁকে পড়ার অর্থ হলো এখন আমাদের হাতের
                নাগালেই ডাটা লভ্য। LandBD-এর মতো সিস্টেমগুলি সিটিজেন
                পোর্টালগুলোর সাথে স্পেশিয়াল ডেটাবেস যুক্ত করে, যা দাগের সীমানা,
                খতিয়ানের রেকর্ড এবং জোনিং আইন (ড্যাপ) সম্পর্কে রিয়েল-টাইম ডাটা
                প্রদান করে।
              </p>

              <div
                className="p-6 md:p-8 my-10 bg-[var(--surface)] rounded-2xl border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 text-6xl text-blue-500/10 font-serif">"</div>
                <p className="mb-0 italic text-[var(--text-secondary)] text-xl leading-relaxed relative z-10">
                  "ভূমি রেকর্ডের ডিজিটাইজেশন শুধুমাত্র প্রশাসনিক উন্নয়ন নয়;
                  এটি নাগরিকদের সম্পত্তির অধিকার সুনিশ্চিত করার ক্ষেত্রে একটি
                  মৌলিক পরিবর্তন।" — <strong className="text-[var(--text-primary)] font-semibold">ভূমি মন্ত্রণালয়</strong>
                </p>
              </div>

              <h2 id="benefits" className="text-2xl md:text-3xl font-bold mt-12 mb-6">
                সার্ভেয়ারদের জন্য সুবিধাসমূহ
              </h2>
              <ul className="space-y-4 mb-8 list-disc pl-6">
                <li>
                  <strong className="text-[var(--accent)]">অভূতপূর্ব নিখুঁততা:</strong> সাব-সেন্টিমিটার নির্ভুলতা
                  নিশ্চিত করে যে সীমানা নিয়ে কোনো বিতর্ক থাকবে নিয়োগ করা যায়।
                </li>
                <li>
                  <strong className="text-[var(--accent)]">সময়ের সাশ্রয়:</strong> যে জরিপ করতে আগে দিনের পর দিন
                  লাগতো, তা এখন কয়েক ঘণ্টার মধ্যেই সম্ভব।
                </li>
                <li>
                  <strong className="text-[var(--accent)]">ডাটা সমন্বয়:</strong> ঐতিহাসিক সিএস, আরএস এবং বিএস
                  ম্যাপের সাথে নতুন জরিপের নির্ভুল ওভারলে।
                </li>
              </ul>

              <h2 id="future" className="text-2xl md:text-3xl font-bold mt-12 mb-6">
                ভবিষ্যতের রূপরেখা
              </h2>
              <p className="mb-6">
                ২০৩০ সালের দিকে তাকালে আমাদের লক্ষ্য হলো একটি সম্পূর্ণ সমন্বিত
                ন্যাশনাল ল্যান্ড ইন্টেলিজেন্স প্ল্যাটফর্ম তৈরি করা।
                আর্টিফিশিয়াল ইন্টেলিজেন্স বিবাদ ঘটার আগেই তার পূর্বাভাস দিতে,
                জোনিং ট্রেন্ড বিশ্লেষণ করতে এবং উত্তরাধিকার বণ্টন স্বয়ংক্রিয়
                করতে একটি বিশাল ভূমিকা পালন করবে।
              </p>
            </article>

            {/* Share and Tags */}
            <div className="flex flex-col md:flex-row justify-between items-center py-6 mt-12 border-t border-b border-[var(--border)] gap-6">
              <div className="flex flex-wrap gap-2">
                <span className="bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1 rounded-full text-sm font-medium">আরটিকে জিপিএস</span>
                <span className="bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1 rounded-full text-sm font-medium">ডিজিটাল জরিপ</span>
                <span className="bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] px-3 py-1 rounded-full text-sm font-medium">ভূমি আইন</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider">
                  শেয়ার করুন:
                </span>
                <button className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-blue-400 hover:border-blue-400 hover:bg-blue-400/10 transition-colors">
                  <Share2 size={18} />
                </button>
                <button className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-green-400 hover:border-green-400 hover:bg-green-400/10 transition-colors">
                  <MessageCircle size={18} />
                </button>
                <button className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors">
                  <LinkIcon size={18} />
                </button>
              </div>
            </div>

            {/* Author Box */}
            <div className="card-new my-12 p-8 flex flex-col md:flex-row gap-6 items-center md:items-start border-l-4 border-l-blue-500">
              <div
                className="bg-[var(--border)] rounded-full w-24 h-24 flex-shrink-0"
              ></div>
              <div className="text-center md:text-left">
                <h4 className="text-2xl font-bold mb-1 text-[var(--text-primary)]">
                  {post.author.name}
                </h4>
                <p className="text-[var(--accent)] font-bold uppercase text-sm tracking-wider mb-4">
                  {post.author.role}
                </p>
                <p className="text-[var(--text-secondary)] mb-0 leading-relaxed text-lg">
                  ওমর একজন জিআইএস বিশেষজ্ঞ যিনি ওপেন ডাটা এবং বাংলাদেশের ভূমি
                  রেকর্ডে সাধারণ মানুষের প্রবেশাধিকার নিশ্চিত করতে আগ্রহী।
                </p>
              </div>
            </div>

            <NewsletterCta />
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-4 lg:col-start-9">
            <TableOfContents />
          </div>
        </div>
      </div>
    </div>
  );
}
