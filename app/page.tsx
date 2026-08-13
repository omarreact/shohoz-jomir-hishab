"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/src/shared/ui/LoadingSpinner";
import HeroSection from "@/src/features/home/components/HeroSection";
import ServicesSection from "@/src/features/home/components/ServicesSection";
import MapPreviewSection from "@/src/features/home/components/MapPreviewSection";
import StatisticsSection from "@/src/features/home/components/StatisticsSection";
import HowItWorksSection from "@/src/features/home/components/HowItWorksSection";
import BlogPreviewSection from "@/src/features/home/components/BlogPreviewSection";
import FaqSection from "@/src/features/home/components/FaqSection";
import ContactSection from "@/src/features/home/components/ContactSection";
import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import { useAnnouncement } from "@/src/shared/hooks/useAnnouncement";

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
