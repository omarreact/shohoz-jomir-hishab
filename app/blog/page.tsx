import BlogCard, { BlogPost } from "@/src/features/blog/components/BlogCard";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import { Search } from "lucide-react";
import { t } from "@/src/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

import HeroBanner from "@/components/ui/HeroBanner";

// Dummy data for scaffolding
const FEATURED_POST: BlogPost = {
  slug: "future-of-digital-land-survey-bangladesh",
  title: "বাংলাদেশে ডিজিটাল ভূমি জরিপের ভবিষ্যৎ: যা জানা প্রয়োজন",
  excerpt:
    "ডিজিটাল জরিপ প্রযুক্তি কীভাবে বাংলাদেশের ভূমি নিবন্ধন এবং দ্বন্দ্ব নিরসনের ল্যান্ডস্কেপ পরিবর্তন করছে তার একটি বিশদ আলোচনা।",
  coverImage:
    "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop",
  author: "মো. ওমর ফারুক",
  date: "১৫ জুলাই, ২০২৬",
  readingTime: "৫ মিনিট পাঠ",
  category: "ডিজিটাল জরিপ",
};

const RECENT_POSTS: BlogPost[] = [
  {
    slug: "understanding-cs-rs-bs-khatian",
    title: "সিএস, আরএস এবং বিএস খতিয়ান বোঝা: একটি সম্পূর্ণ গাইড",
    excerpt:
      "বাংলাদেশের প্রধান ভূমি রেকর্ড জরিপগুলির মধ্যে পার্থক্য কীভাবে করতে হয় এবং আপনার সম্পত্তির মালিকানার জন্য এর অর্থ কী তা জানুন।",
    coverImage:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop",
    author: "আমিনুল ইসলাম",
    date: "১০ জুলাই, ২০২৬",
    readingTime: "৮ মিনিট পাঠ",
    category: "ভূমি রেকর্ড",
  },
  {
    slug: "faraez-muslim-inheritance-law-simplified",
    title: "ফারায়েজ: আধুনিক যুগের জন্য মুসলিম উত্তরাধিকার আইন সহজ করা হয়েছে",
    excerpt:
      "আমাদের নতুন ডিজিটাল ক্যালকুলেটরের মাধ্যমে ইসলামিক ফারায়েজ অনুযায়ী সম্পত্তি বণ্টনের আইনসমূহ সহজ করা হয়েছে।",
    coverImage:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    author: "ফাতেমা রহমান",
    date: "০৫ জুলাই, ২০২৬",
    readingTime: "৬ মিনিট পাঠ",
    category: "আইন ও উত্তরাধিকার",
  },
  {
    slug: "how-to-read-dap-map",
    title:
      "পরিকল্পনা কর্তৃপক্ষের বিশদ অঞ্চল পরিকল্পনা (ড্যাপ) ম্যাপ কীভাবে পড়বেন",
    excerpt:
      "ড্যাপ ম্যাপ পড়ার সহজ গাইডের মাধ্যমে ঢাকার জটিল জোনিং আইনগুলো নেভিগেট করুন।",
    coverImage:
      "https://images.unsplash.com/photo-1580130281320-0ef0754f2bf7?q=80&w=800&auto=format&fit=crop",
    author: "মো. ওমর ফারুক",
    date: "২৮ জুন, ২০২৬",
    readingTime: "৪ মিনিট পাঠ",
    category: "জোনিং",
  },
];

export default function BlogListingPage() {
  return (
    <>
      <HeroBanner
        align="center"
        badge="LandBD জার্নাল"
        title={
          <>
            ভূমি সম্পর্কিত <span className="accent-text">জ্ঞানের ভাণ্ডার</span>
          </>
        }
        description="বাংলাদেশের ভূমি আইন, ডিজিটাল জরিপ এবং উত্তরাধিকার সম্পর্কে ইনসাইট, গাইড এবং আপডেট।"
        pattern="none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in visible min-h-screen">
        {/* Featured Article */}
        <section className="mb-16">
          <h4 className="text-2xl font-bold mb-6 text-[var(--text-primary)] border-l-4 border-[var(--accent)] pl-4">ফিচার্ড আর্টিকেল</h4>
          <BlogCard post={FEATURED_POST} featured={true} />
        </section>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
          <div className="flex gap-2 w-full overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button className="px-5 py-2 rounded-full font-bold bg-[var(--text-primary)] text-[var(--bg)] whitespace-nowrap">
              সকল পোস্ট
            </button>
            <button className="px-5 py-2 rounded-full font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors whitespace-nowrap">
              ভূমি রেকর্ড
            </button>
            <button className="px-5 py-2 rounded-full font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors whitespace-nowrap">
              আইন ও উত্তরাধিকার
            </button>
            <button className="px-5 py-2 rounded-full font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors whitespace-nowrap">
              জোনিং
            </button>
          </div>

          <div className="w-full md:w-80 relative">
            <input
              type="text" 
              placeholder="আর্টিকেল খুঁজুন..." 
              className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-full px-5 py-2.5 pl-10 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          </div>
        </div>

        {/* Recent Posts Grid */}
        <section className="mb-16">
          <h4 className="text-2xl font-bold mb-6 text-[var(--text-primary)] border-l-4 border-[var(--accent)] pl-4">সাম্প্রতিক পোস্টসমূহ</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RECENT_POSTS.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="mt-20 border-t border-[var(--border)] pt-16">
          <NewsletterCta />
        </section>
      </div>
    </>
  );
}
