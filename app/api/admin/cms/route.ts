import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { getAllCmsPages,isCmsSlug } from "@/src/lib/cms-store";
import { writeCmsVersion,CmsRevisionConflict } from "@/src/lib/cms-history";
import { revalidatePath } from "next/cache";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({slug:z.string(),title:z.string().min(3).max(180),description:z.string().max(1200),
 seoTitle:z.string().max(180),seoDescription:z.string().max(500),expectedRevision:z.number().int().min(0),
 published:z.boolean(),sections:z.array(z.object({heading:z.string().min(1).max(180),body:z.string().max(10000)})).max(40)}).strict();
export async function GET(req:NextRequest){
 try{await verifyAdminAuth(req);return NextResponse.json({pages:await getAllCmsPages()},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"প্রবেশাধিকার নেই"},{status:403});}
}
export async function PUT(req:NextRequest){
 try{
  const actor=await verifyAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
  if(Number(req.headers.get("content-length")||0)>450000)return NextResponse.json({error:"Content too large"},{status:413});
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success||!isCmsSlug(parsed.data?.slug))return NextResponse.json({error:"অবৈধ কনটেন্ট"},{status:400});
  const {slug,expectedRevision,...content}=parsed.data;
  const revision=await writeCmsVersion({slug,actor,expectedRevision,action:"save",content});
  for(const p of slug==="homepage"?["/"]:slug==="navigation"||slug==="footer"||slug==="notice"?["/"]:["/"+slug])revalidatePath(p);
  return NextResponse.json({ok:true,revision},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof CmsRevisionConflict)return NextResponse.json({error:"অন্য অ্যাডমিন এই কনটেন্ট পরিবর্তন করেছেন। রিফ্রেশ করে আবার চেষ্টা করুন।",code:"CMS_CONFLICT"},{status:409});
  console.error("[CMS publish]",e instanceof Error?e.message:"Unknown");
  return NextResponse.json({error:"কনটেন্ট সংরক্ষণ করা যায়নি"},{status:500});
 }
}
