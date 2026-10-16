import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {verifyAdminAuth} from "@/src/modules/auth/serverAuth";
import {isCmsSlug} from "@/src/lib/cms-store";
import {cmsVersions,writeCmsVersion,CmsRevisionConflict} from "@/src/lib/cms-history";
import {revalidatePath} from "next/cache";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{
  await verifyAdminAuth(req);
  const slug=req.nextUrl.searchParams.get("slug");
  if(!isCmsSlug(slug))return NextResponse.json({error:"Invalid CMS page"},{status:400});
  return NextResponse.json({versions:await cmsVersions(slug)},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Revision history unavailable"},{status:503});}
}
export async function POST(req:NextRequest){
 try{
  const actor=await verifyAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
  const parsed=z.object({slug:z.string(),sourceRevision:z.number().int().min(0),
   expectedRevision:z.number().int().min(0)}).strict().safeParse(await req.json());
  if(!parsed.success||!isCmsSlug(parsed.data?.slug))return NextResponse.json({error:"Invalid revision"},{status:400});
  const {slug,sourceRevision,expectedRevision}=parsed.data;
  const revision=await writeCmsVersion({slug,sourceRevision,expectedRevision,actor,action:"restore"});
  revalidatePath(slug==="homepage"||["footer","navigation","notice"].includes(slug)?"/":"/"+slug);
  return NextResponse.json({ok:true,revision},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof CmsRevisionConflict)return NextResponse.json({error:"This page was changed. Reload before restoring.",code:"CMS_CONFLICT"},{status:409});
  return NextResponse.json({error:"Cannot restore selected revision"},{status:503});
 }
}
