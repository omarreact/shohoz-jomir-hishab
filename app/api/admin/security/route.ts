import { NextRequest,NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import { verifySuperAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
export const runtime="nodejs";export const dynamic="force-dynamic";
function redis():Redis|null{const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;return url&&token?new Redis({url,token}):null;}
export async function GET(req:NextRequest){
 try{
  await verifySuperAdminAuth(req);
  const doc=await db.collection("landbdPrivateConfig").doc("securityPolicy").get();
  const r=redis(),locks:Array<{fingerprint:string;remainingSeconds:number}>=[];
  if(r){const [,keys]=await r.scan(0,{match:"landbd:security:lock:*",count:100});
   for(const name of keys.slice(0,100)){const remain=await r.ttl(name);if(remain>0)locks.push({fingerprint:name.slice("landbd:security:lock:".length),remainingSeconds:remain});}}
  return NextResponse.json({enabled:doc.data()?.enabled!==false,locks,redisConfigured:!!r},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Security data unavailable"},{status:403});}
}
export async function PUT(req:NextRequest){
 try{
  const actor=await verifySuperAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
  const v=z.object({enabled:z.boolean()}).safeParse(await req.json());
  if(!v.success)return NextResponse.json({error:"Invalid policy"},{status:400});
  await db.collection("landbdPrivateConfig").doc("securityPolicy").set({enabled:v.data.enabled,updatedBy:actor.id,updatedAt:new Date().toISOString()});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to save"},{status:500});}
}
export async function DELETE(req:NextRequest){
 try{
  await verifySuperAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
  const v=z.object({fingerprint:z.string().regex(/^[a-f0-9]{64}$/)}).safeParse(await req.json());
  if(!v.success)return NextResponse.json({error:"Invalid fingerprint"},{status:400});
  const r=redis();if(!r)return NextResponse.json({error:"Redis unavailable"},{status:503});
  await r.del("landbd:security:lock:"+v.data.fingerprint);
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to release lock"},{status:500});}
}