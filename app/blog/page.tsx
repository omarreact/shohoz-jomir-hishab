import BlogCard, { BlogPost } from "@/src/features/blog/components/BlogCard";
import NewsletterCta from "@/src/features/blog/components/NewsletterCta";
import { Search } from "lucide-react";
import { t } from "@/src/locales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import HeroBanner from "@/components/ui/HeroBanner";

// Dummy data for scaffolding
const FEATURED_POST: BlogPost = {
  slug: "future-of-digital-land-survey-bangladesh",
  title: "বাংলাদেশে ডিজিটাল ভূমি জরিপের ভবিষ্যৎ: যা জানা প্রয়োজন",
  excerpt: "ডিজিটাল জরিপ প্রযুক্তি কীভাবে বাংলাদেশের ভূমি নিবন্ধন এবং দ্বন্দ্ব নিরসনের ল্যান্ডস্কেপ পরিবর্তন করছে তার একটি বিশদ আলোচনা।",
  coverImage: "https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop",
  author: "মো. ওমর ফারুক",
  date: "১৫ জুলাই, ২০২৬",
  readingTime: "৫ মিনিট পাঠ",
  category: "ডিজিটাল জরিপ"
};

const RECENT_POSTS: BlogPost[] = [
  {
    slug: "understanding-cs-rs-bs-khatian",
    title: "সিএস, আরএস এবং বিএস খতিয়ান বোঝা: একটি সম্পূর্ণ গাইড",
    excerpt: "বাংলাদেশের প্রধান ভূমি রেকর্ড জরিপগুলির মধ্যে পার্থক্য কীভাবে করতে হয় এবং আপনার সম্পত্তির মালিকানার জন্য এর অর্থ কী তা জানুন।",
    coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop",
    author: "আমিনুল ইসলাম",
    date: "১০ জুলাই, ২০২৬",
    readingTime: "৮ মিনিট পাঠ",
    category: "ভূমি রেকর্ড"
  },
  {
    slug: "faraez-muslim-inheritance-law-simplified",
    title: "ফারায়েজ: আধুনিক যুগের জন্য মুসলিম উত্তরাধিকার আইন সহজ করা হয়েছে",
    excerpt: "আমাদের নতুন ডিজিটাল ক্যালকুলেটরের মাধ্যমে ইসলামিক ফারায়েজ অনুযায়ী সম্পত্তি বণ্টনের আইনসমূহ সহজ করা হয়েছে।",
    coverImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    author: "ফাতেমা রহমান",
    date: "০৫ জুলাই, ২০২৬",
    readingTime: "৬ মিনিট পাঠ",
    category: "আইন ও উত্তরাধিকার"
  },
  {
    slug: "how-to-read-dap-map",
    title: "পরিকল্পনা কর্তৃপক্ষের বিশদ অঞ্চল পরিকল্পনা (ড্যাপ) ম্যাপ কীভাবে পড়বেন",
    excerpt: "ড্যাপ ম্যাপ পড়ার সহজ গাইডের মাধ্যমে ঢাকার জটিল জোনিং আইনগুলো নেভিগেট করুন।",
    coverImage: "https://images.unsplash.com/photo-1580130281320-0ef0754f2bf7?q=80&w=800&auto=format&fit=crop",
    author: "মো. ওমর ফারুক",
    date: "২৮ জুন, ২০২৬",
    readingTime: "৪ মিনিট পাঠ",
    category: "জোনিং"
  }
];

export default function BlogListingPage() {
  return (
    <>
      <HeroBanner
        align="center"
        badge="LandBD জার্নাল"
        title={
          <>
            ভূমি সম্পর্কিত <span className="text-primary">জ্ঞানের ভাণ্ডার</span>
          </>
        }
        description="বাংলাদেশের ভূমি আইন, ডিজিটাল জরিপ এবং উত্তরাধিকার সম্পর্কে ইনসাইট, গাইড এবং আপডেট।"
        pattern="none"
      />

      <div className="container py-5" style={{ minHeight: "100vh" }}>

      {/* Featured Article */}
      <section className="mb-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h4 className="fw-bold mb-4 text-white">ফিচার্ড আর্টিকেল</h4>
        <BlogCard post={FEATURED_POST} featured={true} />
      </section>

      {/* Search & Filter Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="d-flex gap-2 w-100 overflow-auto pb-2 pb-md-0" style={{ scrollbarWidth: "none" }}>
          <Button variant="dark" className="rounded-pill px-4 text-nowrap">সকল পোস্ট</Button>
          <Button variant="outline" className="rounded-pill px-4 text-nowrap border-secondary">ভূমি রেকর্ড</Button>
          <Button variant="outline" className="rounded-pill px-4 text-nowrap border-secondary">আইন ও উত্তরাধিকার</Button>
          <Button variant="outline" className="rounded-pill px-4 text-nowrap border-secondary">জোনিং</Button>
        </div>
        
        <div className="w-100" style={{ maxWidth: "300px" }}>
          <Input 
            type="text" 
            placeholder="আর্টিকেল খুঁজুন..." 
            leftIcon={<Search size={18} />}
          />
        </div>
      </div>

      {/* Recent Posts Grid */}
      <section className="mb-5 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h4 className="fw-bold mb-4 text-white">সাম্প্রতিক পোস্টসমূহ</h4>
        <div className="row g-4">
          {RECENT_POSTS.map((post) => (
            <div className="col-12 col-md-6 col-lg-4" key={post.slug}>
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="mt-5 pt-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <NewsletterCta />
      </section>
    </div>
    </>
  );
}