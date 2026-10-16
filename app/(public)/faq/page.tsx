import CMSPageRenderer from "@/src/components/cms/CMSPageRenderer";
import { cmsMetadata } from "@/src/lib/cms-store";
export const dynamic = "force-dynamic";
export async function generateMetadata(){return cmsMetadata("faq");}
export default function Page(){return <CMSPageRenderer slug="faq"/>;}
