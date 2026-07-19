"use client";

import Link from "next/link";
import { ArrowRight, Clock, User } from "lucide-react";
import { useEffect, useState } from "react";

export default function BlogPreviewSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const blogPosts = [
    {
      id: 1,
      title: "ভূমি রেজিস্ট্রেশনের নতুন নিয়মকানুন",
      excerpt: "২০২৪ সালের নতুন ভূমি রেজিস্ট্রেশন আইনে কি কি পরিবর্তন এসেছে তা বিস্তারিত জানুন।",
      author: "অ্যাডভোকেট করিম",
      date: "১২ মে, ২০২৪",
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
      delay: "0s",
    },
    {
      id: 2,
      title: "উত্তরাধিকার সম্পত্তি বন্টন আইন",
      excerpt: "মুসলিম ও হিন্দু উত্তরাধিকার আইন অনুযায়ী সম্পত্তি কিভাবে বন্টন হয় তার সম্পূর্ণ গাইডলাইন।",
      author: "ব্যারিস্টার সুমন",
      date: "১০ মে, ২০২৪",
      image: "https://images.unsplash.com/photo-1555374018-1c4ffa612ebe?auto=format&fit=crop&q=80&w=800",
      delay: "100ms",
    },
    {
      id: 3,
      title: "খাস জমি বন্দোবস্ত নেওয়ার প্রক্রিয়া",
      excerpt: "সরকারি খাস জমি কিভাবে বন্দোবস্ত নিতে হয় এবং এর জন্য কি কি কাগজপত্র প্রয়োজন।",
      author: "অ্যাডভোকেট রহিম",
      date: "০৫ মে, ২০২৪",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66cb85?auto=format&fit=crop&q=80&w=800",
      delay: "200ms",
    },
  ];

  return (
    <section className="py-24 border-t border-c bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4 fade-in ${isLoaded ? "visible" : ""}`}>
          <div>
            <h2 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">
              আইন বিষয়ক <span className="accent-text">ব্লগ</span>
            </h2>
            <p className="text-[var(--text-secondary)] m-0">
              ভূমি সংক্রান্ত গুরুত্বপূর্ণ আইনি পরামর্শ এবং টিপস।
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[var(--accent)] font-medium hover:underline no-underline shrink-0"
          >
            সবগুলো দেখুন <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              href={`/blog/${post.id}`}
              key={post.id}
              className={`card-new overflow-hidden p-0 fade-in group no-underline ${
                isLoaded ? "visible" : ""
              }`}
              style={{ transitionDelay: post.delay }}
            >
              <div
                className="h-48 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${post.image}')` }}
              ></div>
              <div className="p-6 relative bg-[var(--surface)]">
                <div className="flex items-center gap-4 text-[var(--text-secondary)] text-xs mb-3">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {post.date}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {post.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm mb-4">
                  {post.excerpt}
                </p>
                <div className="text-[var(--accent)] font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  আরও পড়ুন <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
