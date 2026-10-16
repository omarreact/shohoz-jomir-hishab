import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
import { getAllCmsPages,isCmsSlug } from "@/src/lib/cms-store";
import { revalidatePath } from "next/cache";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({slug:z.string(),title:z.string().min(3).max(180),description:z.string().max(1200),
 seoTitle:z.string().max(180),seoDescription:z.string().max(500),
 published:z.boolean(),sections:z.array(z.object({heading:z.string().min(1).max(180),body:z.string().max(10000)})).max(40)}).strict();
const forbidden=()=>NextResponse.json({error:"প্রবেশাধিকার নেই"},{status:403});
export async function GET(req:NextRequest){
 try{await verifyAdminAuth(req);return NextResponse.json({pages:await getAllCmsPages()},{headers:{"Cache-Control":"no-store"}});}
 catch{return forbidden();}
}
export async function PUT(req:NextRequest){
 try{const actor=await verifyAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return forbidden();
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success||!isCmsSlug(parsed.data?.slug))return NextResponse.json({error:"অবৈধ কনটেন্ট"},{status:400});
  const {slug,...content}=parsed.data;
  await db.collection("landbdCmsPages").doc(slug).set({...content,updatedAt:new Date().toISOString(),updatedBy:actor.id},{merge:true});
  revalidatePath(slug==="homepage"?"/":"/"+slug);
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"কনটেন্ট সংরক্ষণ করা যায়নি"},{status:500});}
}
