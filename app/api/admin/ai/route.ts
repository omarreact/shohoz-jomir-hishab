import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { generateAiText } from "@/src/lib/ai-provider";
import { allowDurableRateLimit } from "@/src/lib/durable-rate-limit";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 try{
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
 const u=await verifyAdminAuth(req);
 if(!await allowDurableRateLimit("admin-ai:"+u.id,15,60))return NextResponse.json({error:"AI ব্যবহারের সীমা অতিক্রম হয়েছে"},{status:429});
 const v=z.object({prompt:z.string().min(3).max(3500)}).strict().safeParse(await req.json());
 if(!v.success)return NextResponse.json({error:"Invalid prompt"},{status:400});
 const text=await generateAiText("You are LandBD's Bangla editorial copilot. Reply in clear Bangla. Draft CMS text, SEO descriptions, and land-service explanations. Do not assert government affiliation, invent legal guarantees, reveal secrets, or mutate configuration. All generated content requires human review before publication.",v.data.prompt);
 return NextResponse.json({text},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"AI সেবা unavailable"},{status:503});}
}
