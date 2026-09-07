import type { MetadataRoute } from "next";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { STATIC_BLOG_POSTS } from "@/src/features/blog/content/static-posts";
import { SITE_CONFIG } from "@/src/shared/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_CONFIG.url;
  const now = new Date();

  const core = Object.values(FEATURE_ROUTES).map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const posts = STATIC_BLOG_POSTS.map((p) => ({
    url: `${base}/blog/${p.categorySlug}/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...core, ...posts];
}
