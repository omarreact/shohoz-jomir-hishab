import { getCmsPage } from "@/src/lib/cms-store";

/**
 * Show only published announcements above the homepage hero.
 * Price information belongs on its corresponding service page,
 * not inside the landing-page banner.
 */
export default async function LiveHomeContent() {
  const notice = await getCmsPage("notice");

  if (!notice.published) return null;

  return (
    <div lang="bn">
      <div
        role="status"
        className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950"
      >
        {notice.title} — {notice.description}
      </div>
    </div>
  );
}
