"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import HeroSection from "@/components/features/home/HeroSection";
import ServicesSection from "@/components/features/home/ServicesSection";
import MapPreviewSection from "@/components/features/home/MapPreviewSection";
import StatisticsSection from "@/components/features/home/StatisticsSection";
import HowItWorksSection from "@/components/features/home/HowItWorksSection";
import BlogPreviewSection from "@/components/features/home/BlogPreviewSection";
import FaqSection from "@/components/features/home/FaqSection";
import ContactSection from "@/components/features/home/ContactSection";
import AnnouncementBanner from "@/components/features/home/AnnouncementBanner";
import { useAnnouncement } from "@/lib/hooks/useAnnouncement";

export default function HomePage() {
  const announcement = useAnnouncement();

  return (
    <div className="flex flex-col w-full">
      <AnnouncementBanner message={announcement} />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Service Cards / Features */}
      <div className="bg-alt-1">
        <ServicesSection />
      </div>

      {/* 3. Interactive Map Preview / Search */}
      <MapPreviewSection />

      {/* 4. Statistics */}
      <div className="bg-alt-1">
        <StatisticsSection />
      </div>

      {/* 5. How It Works */}
      <HowItWorksSection />

      {/* 6. Blog Preview */}
      <div className="bg-alt-2">
        <BlogPreviewSection />
      </div>

      {/* 7. FAQ */}
      <FaqSection />

      {/* 8. Contact Form */}
      <div className="bg-alt-1">
        <ContactSection />
      </div>
    </div>
  );
}
