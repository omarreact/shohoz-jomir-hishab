import AnnouncementBanner from "@/src/features/home/components/AnnouncementBanner";
import EasyToolsHub from "@/src/features/home/components/EasyToolsHub";
import FaqSection from "@/src/features/home/components/FaqSection";
import { refreshToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";

// Server-side token warm-up for GIS features; never expose token to browser.
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function warmRajukAuthentication() {
  if (!process.env.RAJUK_API_KEY) return;
  try {
    await refreshToken(RAJUK_SERVER);
  } catch (error) {
    console.error("[RAJUK] Home authentication refresh failed:", error);
  }
}

export default async function HomePage() {
  await warmRajukAuthentication();

  return (
    <div className="flex w-full flex-col">
      <AnnouncementBanner />
      {/* সব সুবিধা সরাসরি — তরুণ থেকে বৃদ্ধ সবার জন্য সহজ */}
      <EasyToolsHub />
      <FaqSection />
    </div>
  );
}
