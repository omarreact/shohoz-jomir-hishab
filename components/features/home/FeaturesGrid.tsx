import { Calculator, Ruler, Users, BookOpen, Map } from "lucide-react";
import FeatureCard from "@/components/ui/FeatureCard";
import SectionHeader from "@/components/ui/SectionHeader";

/**
 * Features Grid — the 5-card service showcase on the homepage.
 * Pure server component.
 */
export default function FeaturesGrid() {
  const features = [
    {
      href: "/khatiyan",
      title: "খতিয়ান ক্যালকুলেটর",
      description:
        "সিএস, এসএ, আরএস খতিয়ানের আনা-গন্ডা, কড়া, ক্রান্তি দিয়ে অংশীদারদের জমির সঠিক পরিমাণ বের করুন খুব সহজেই।",
      Icon: Calculator,
    },
    {
      href: "/faraez",
      title: "ফারায়েজ ক্যালকুলেটর",
      description:
        "মুসলিম ও হিন্দু উত্তরাধিকার আইন অনুযায়ী ওয়ারিশদের মাঝে জমি, স্বর্ণ ও নগদ অর্থ নির্ভুলভাবে বন্টন করুন।",
      badge: "New",
      badgeColor: "danger",
      Icon: Users,
    },
    {
      href: "/land-measurement",
      title: "জমি মাপ ক্যালকুলেটর",
      description:
        "চার বাহু এবং কর্ণ (Heron's formula) ব্যবহার করে আয়তাকার বা আঁকাবাঁকা জমির নিখুঁত ক্ষেত্রফল বের করুন।",
      badge: "Popular",
      badgeColor: "primary",
      Icon: Ruler,
    },
    {
      href: "/dap-map",
      title: "ফুল ড্যাপ ম্যাপ",
      description:
        "রাজউকের সম্পূর্ণ DAP (Detailed Area Plan) ম্যাপ দেখুন। RS ও MS মৌজা, ভূমি ব্যবহার, বন্যা জোন এবং আরও অনেক কিছু এক জায়গায়।",
      badge: "Beta",
      badgeColor: "warning",
      Icon: Map,
      ctaLabel: "ম্যাপ খুলুন",
    },
    {
      href: "/blog",
      title: "ভূমি ও আইন ব্লগ",
      description:
        "ভূমি বিষয়ক আইন, দলিল রেজিস্ট্রি, নামজারি, এবং আইনি পরামর্শ সংক্রান্ত আমাদের বিশেষজ্ঞদের লেখা আর্টিকেল পড়ুন।",
      Icon: BookOpen,
      ctaLabel: "পড়তে শুরু করুন",
    },
  ];

  return (
    <section className="container pb-5">
      <SectionHeader
        eyebrow="সার্ভিসেস"
        title="আমাদের প্রধান সেবাসমূহ"
        subtitle="আপনার প্রয়োজনীয় ক্যালকুলেটরটি বেছে নিন এবং সেকেন্ডের মধ্যে নিখুঁত হিসাব বের করুন।"
      />

      <div className="row g-4 mb-5 pb-4">
        {features.map((f) => (
          <div key={f.href} className="col-md-6 col-xl-4">
            <FeatureCard {...f} />
          </div>
        ))}
      </div>
    </section>
  );
}
