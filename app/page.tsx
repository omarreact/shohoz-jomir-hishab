import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import HeroSection from "@/src/features/home/components/HeroSection";
import ServicesSection from "@/src/features/home/components/ServicesSection";
import MapPreviewSection from "@/src/features/home/components/MapPreviewSection";
import StatisticsSection from "@/src/features/home/components/StatisticsSection";
import HowItWorksSection from "@/src/features/home/components/HowItWorksSection";
import BlogPreviewSection from "@/src/features/home/components/BlogPreviewSection";
import FaqSection from "@/src/features/home/components/FaqSection";
import ContactSection from "@/src/features/home/components/ContactSection";
import { refreshToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";

// The home route must execute server-side on every request so the authorized
// RAJUK server token can be refreshed before GIS requests begin. The token is
// kept exclusively in the server runtime/cache and is never sent to the browser.
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function warmRajukAuthentication() {
  if (!process.env.RAJUK_API_KEY) return;

  try {
    await refreshToken(RAJUK_SERVER);
  } catch (error) {
    // Do not make the public homepage unavailable when RAJUK authentication is
    // temporarily unavailable. Protected GIS requests will retry through the
    // normal getValidToken() path when the user actually opens a GIS feature.
    console.error("[RAJUK] Home authentication refresh failed:", error);
  }
}

export default async function HomePage() {
  await warmRajukAuthentication();

  return (
    <div className="flex flex-col w-full">
      <AnnouncementBanner />
      <HeroSection />
      <ServicesSection />
      <MapPreviewSection />
      <StatisticsSection />
      <HowItWorksSection />
      <BlogPreviewSection />
      <FaqSection />
      <ContactSection />
    </div>
  );
}
