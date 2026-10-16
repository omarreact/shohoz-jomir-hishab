import { NextRequest,NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/src/modules/database/firebaseAdmin";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { getService,servicePrice,isServiceId } from "@/src/lib/services-registry";
import { getGateway,startGateway } from "@/src/lib/sslcommerz";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 try{
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
 const user=await verifyServerAuth(req,{requireAdminBackend:true});
 if(!await allowRateLimit("checkout:"+user.id,5,60))return NextResponse.json({error:"অনেকবার চেষ্টা করেছেন"},{status:429});
 const parsed=z.object({serviceId:z.string(),phone:z.string().regex(/^01[3-9]\d{8}$/)}).strict().safeParse(await req.json());
 if(!parsed.success||!isServiceId(parsed.data?.serviceId))return NextResponse.json({error:"ভুল সেবা বা মোবাইল নম্বর"},{status:400});
 const service=await getService(parsed.data.serviceId);
 if(!service.enabled||!service.paid)return NextResponse.json({error:"এই সেবার পেমেন্ট প্রয়োজন নেই"},{status:409});
 const id="LBD"+randomBytes(12).toString("hex").toUpperCase(),amount=servicePrice(service);
 const ref=db.collection("landbdOrders").doc(id);
 await ref.create({uid:user.id,serviceId:service.id,amountBdt:amount,currency:"BDT",usageLimitAtPurchase:service.usageLimit,status:"initiated",createdAt:new Date().toISOString()});
 try{
  const url=await startGateway(await getGateway(),{id,service:service.name,serviceId:service.id,amount,name:user.name||"LandBD User",email:user.email||"support@landbd.pincodeit.com",phone:parsed.data.phone});
  await ref.update({status:"pending"});
  return NextResponse.json({checkoutUrl:url,transactionId:id});
 }catch(e){await ref.update({status:"gateway_error"});return NextResponse.json({error:e instanceof Error?e.message:"Payment unavailable"},{status:503});}
 }catch{return NextResponse.json({error:"লগইন বা পেমেন্ট সার্ভার যাচাই ব্যর্থ"},{status:401});}
}
