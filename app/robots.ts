import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{
 return {rules:[{userAgent:"*",allow:"/",disallow:["/admin/","/api/","/login","/security-locked","/checkout/","/ms-test","/rajuk-test"]}],
 sitemap:"https://landbd.pincodeit.com/sitemap.xml",host:"https://landbd.pincodeit.com"};
}