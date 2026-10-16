import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { getAiConfig,saveAiConfig } from "@/src/lib/ai-provider";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{await verifyAdminAuth(req);const {apiKey,...v}=await getAiConfig();return NextResponse.json({...v,keyConfigured:!!apiKey});}
 catch{return NextResponse.json({error:"অনুমতি নেই"},{status:403});}
}
export async function PUT(req:NextRequest){
 try{
 await verifyAdminAuth(req);
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
 const parsed=z.object({enabled:z.boolean(),provider:z.enum(["openai","gemini"]),model:z.string().min(2).max(100).regex(/^[a-zA-Z0-9._-]+$/),apiKey:z.string().max(300).optional()}).strict().safeParse(await req.json());
 if(!parsed.success)return NextResponse.json({error:"Invalid settings"},{status:400});
 const old=await getAiConfig(),v=parsed.data;
 if(v.enabled&&!v.apiKey&&!old.apiKey)return NextResponse.json({error:"API Key প্রয়োজন"},{status:400});
 await saveAiConfig({...v,apiKey:v.apiKey||old.apiKey});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"AI কনফিগারেশন ব্যর্থ"},{status:500});}
}
