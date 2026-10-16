import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { generateAiText,getAiConfig } from "@/src/lib/ai-provider";
import { allowDurableRateLimit } from "@/src/lib/durable-rate-limit";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{const c=await getAiConfig();return NextResponse.json({enabled:c.enabled&&!!c.apiKey},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({enabled:false});}
}
export async function POST(req:NextRequest){
 try{
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
 if(Number(req.headers.get("content-length")||0)>6000)return NextResponse.json({error:"অনুরোধ বড়"},{status:413});
 const ip=(req.headers.get("x-vercel-forwarded-for")||req.headers.get("x-forwarded-for")||"unknown").split(",")[0];
 if(!await allowDurableRateLimit("visitor-ai:"+ip,8,60))return NextResponse.json({error:"কিছুক্ষণ পরে চেষ্টা করুন"},{status:429});
 const v=z.object({message:z.string().min(2).max(1200)}).strict().safeParse(await req.json());
 if(!v.success)return NextResponse.json({error:"প্রশ্ন লিখুন"},{status:400});
 const text=await generateAiText("You are LandBD AI সহায়ক, an educational Bengali land-service assistant for Bangladesh. Answer in Bangla and use Bangla digits for display values. Explain land measurement, CS/SA/RS/BS khatian, Faraez, GIS and payment. Never invent ownership, official records, legal certainty or payments. Do not request personal documents, credentials or payment card data. Guide users to verify sensitive records with authorized sources. Your replies are informational, not legal advice.",v.data.message);
 return NextResponse.json({text},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"AI সংযোগ পাওয়া যায়নি"},{status:503});}
}
