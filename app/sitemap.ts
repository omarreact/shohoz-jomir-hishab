import type { MetadataRoute } from "next";
import { FEATURE_ROUTES,PUBLIC_SITEMAP_KEYS } from "@/src/shared/config/feature-routes";
import { STATIC_BLOG_POSTS } from "@/src/features/blog/content/static-posts";
import { SITE_CONFIG } from "@/src/shared/config/site";
import { getAllCmsPages } from "@/src/lib/cms-store";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base=SITE_CONFIG.url,now=new Date();
 const core=PUBLIC_SITEMAP_KEYS.map(key=>({url:base+(FEATURE_ROUTES[key]==="/"?"":FEATURE_ROUTES[key]),lastModified:now,changeFrequency:"weekly" as const,priority:FEATURE_ROUTES[key]==="/"?1:.8}));
 const pages=await getAllCmsPages();
 const cmsPages=pages.filter(p=>p.published&&!["navigation","footer","notice","homepage"].includes(p.slug))
  .map(p=>({url:base+"/"+p.slug,lastModified:p.updatedAt?new Date(p.updatedAt):now,changeFrequency:"weekly" as const,priority:.6}));
 const blogs=STATIC_BLOG_POSTS.map(p=>({url:base+"/blog/"+p.categorySlug+"/"+p.slug,lastModified:new Date(p.updatedAt),changeFrequency:"monthly" as const,priority:.6}));
 const seen=new Set<string>();
 return [...core,...cmsPages,...blogs].filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true;});
}