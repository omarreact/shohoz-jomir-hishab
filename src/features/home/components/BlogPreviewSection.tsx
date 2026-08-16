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
      slug: "new-land-registration-rules",
      categorySlug: "law",
    },
    {
      id: 2,
      title: "উত্তরাধিকার সম্পত্তি বন্টন আইন",
      excerpt: "মুসলিম ও হিন্দু উত্তরাধিকার আইন অনুযায়ী সম্পত্তি কিভাবে বন্টন হয় তার সম্পূর্ণ গাইডলাইন।",
      author: "ব্যারিস্টার সুমন",
      date: "১০ মে, ২০২৪",
      image: "https://images.unsplash.com/photo-1555374018-1c4ffa612ebe?auto=format&fit=crop&q=80&w=800",
      delay: "100ms",
      slug: "inheritance-property-distribution",
      categorySlug: "law",
    },
    {
      id: 3,
      title: "খাস জমি বন্দোবস্ত নেওয়ার প্রক্রিয়া",
      excerpt: "সরকারি খাস জমি কিভাবে বন্দোবস্ত নিতে হয় এবং এর জন্য কি কি কাগজপত্র প্রয়োজন।",
      author: "অ্যাডভোকেট রহিম",
      date: "০৫ মে, ২০২৪",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66cb85?auto=format&fit=crop&q=80&w=800",
      delay: "200ms",
      slug: "khas-land-settlement-process",
      categorySlug: "law",
    },
  ];

  return (
    <section className="py-24 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4 fade-in ${isLoaded ? "visible" : ""}`}>
          <div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
              আইন বিষয়ক <span className="text-[#006a4e]">ব্লগ</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 m-0 text-lg">
              ভূমি সংক্রান্ত গুরুত্বপূর্ণ আইনি পরামর্শ এবং টিপস।
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#006a4e] font-medium hover:underline no-underline shrink-0"
          >
            সবগুলো দেখুন <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link
              href={`/blog/${post.categorySlug || 'general'}/${post.slug || post.id}`}
              key={post.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 p-0 fade-in group no-underline hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                isLoaded ? "visible" : ""
              }`}
              style={{ transitionDelay: post.delay }}
            >
              <div
                className="h-48 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${post.image}')` }}
              ></div>
              <div className="p-6 relative bg-white dark:bg-slate-900">
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-xs mb-3">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {post.date}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-[#006a4e] transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="text-[#006a4e] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
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
