"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function DynamicPageViewer({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [pageData, setPageData] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/pages?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load page");
        return res.json();
      })
      .then((data) => {
        if (data?.page) setPageData(data.page);
      })
      .catch((error) => {
        console.error("Error fetching dynamic page:", error);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !pageData) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">৪০৪ — পেজটি পাওয়া যায়নি</h3>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-3 rounded-full bg-[var(--accent)] text-[var(--bg)] font-bold"
        >
          হোমপেজে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in pb-5">
      <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
    </div>
  );
}
