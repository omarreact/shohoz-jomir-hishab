import { NextRequest,NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db,isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { getServiceCatalog } from "@/src/lib/services-registry";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{
  await verifyAdminAuth(req);
  const started=Date.now();
  const [payment,ai,riskHolds,refundReviews,services]=await Promise.all([
   db.collection("landbdPrivateConfig").doc("sslcommerz").get(),
   db.collection("landbdPrivateConfig").doc("aiProvider").get(),
   db.collection("landbdOrders").where("status","==","risk_hold").count().get(),
   db.collection("landbdOrders").where("refundRequiresEntitlementReview","==",true).count().get(),
   getServiceCatalog()
  ]);
  const gateway=payment.data()??{},provider=ai.data()??{};
  const redisUrl=process.env.UPSTASH_REDIS_REST_URL;
  const redisToken=process.env.UPSTASH_REDIS_REST_TOKEN;
  let redisStatus:"connected"|"unavailable"|"not_configured"="not_configured";
  if(redisUrl&&redisToken){
   try{
    const ping=await new Redis({url:redisUrl,token:redisToken}).ping();
    redisStatus=ping==="PONG"?"connected":"unavailable";
   }catch{redisStatus="unavailable";}
  }
  const gatewayConfigured=typeof gateway.storeId==="string"&&gateway.storeId.length>0&&
   typeof gateway.passwordCipher==="string"&&gateway.passwordCipher.length>0;
  const aiConfigured=typeof provider.encryptedKey==="string"&&provider.encryptedKey.length>0;
  const result={
   checkedAt:new Date().toISOString(),
   deployment:{commit:process.env.VERCEL_GIT_COMMIT_SHA??"unknown",region:process.env.VERCEL_REGION??"unknown"},
   firebase:{configured:isFirebaseAdminReady(),connected:true,latencyMs:Date.now()-started},
   redis:{status:redisStatus,distributedRateLimiting:redisStatus==="connected"},
   payments:{enabled:gateway.enabled===true,mode:gateway.live===true?"live":"sandbox",
    merchantConfigured:gatewayConfigured,riskReviewCount:riskHolds.data().count,
    refundReviewCount:refundReviews.data().count},
   ai:{enabled:provider.enabled===true,provider:provider.provider==="gemini"?"gemini":"openai",
    credentialConfigured:aiConfigured},
   cms:{versionHistoryEnabled:true},
   services:{total:services.length,enabled:services.filter(s=>s.enabled).length,
    paid:services.filter(s=>s.enabled&&s.paid).length}
  };
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  console.error("[LandBD operations]",e instanceof Error?e.message:"Unavailable");
  return NextResponse.json({error:"অপারেশন স্বাস্থ্য যাচাই সম্ভব হয়নি"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
