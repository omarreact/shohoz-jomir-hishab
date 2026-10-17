import type { MetadataRoute } from "next";
import { getSearchIndexingEnabled } from "@/src/modules/search/server/searchIndexingPolicy";
export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const enabled = await getSearchIndexingEnabled();
  // Crawlers need access to HTML to discover a noindex meta/header. Disallowing
  // every URL would prevent de-indexing already-known pages.
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/login", "/checkout/", "/my-purchases", "/security-locked", "/maintenance", "/ms-test", "/rajuk-test"] }],
    ...(enabled ? { sitemap: "https://landbd.pincodeit.com/sitemap.xml" } : {}),
    host: "https://landbd.pincodeit.com",
  };
}
