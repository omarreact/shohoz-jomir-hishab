import { randomBytes } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { getGateway,startGateway } from "@/src/lib/sslcommerz";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 try{
  const admin=await verifyAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
  if(!await allowRateLimit("payment-connection-test:"+admin.id,3,60))return NextResponse.json({error:"অনেকবার পরীক্ষা করেছেন"},{status:429});
  const c=await getGateway();
  if(c.live)return NextResponse.json({error:"লাইভ মোডে পরীক্ষা নয়; প্রথমে Sandbox নির্বাচন করুন"},{status:409});
  if(!c.storeId||!c.password)return NextResponse.json({error:"Store ID ও Password সংরক্ষণ করুন"},{status:409});
  await startGateway({...c,enabled:true},{
   id:"LBDT"+randomBytes(11).toString("hex").toUpperCase(),
   amount:10,service:"LandBD Sandbox Configuration Test",
   serviceId:"land-area",name:"LandBD Tester",
   phone:"01700000000",email:"support@landbd.pincodeit.com"
  });
  return NextResponse.json({ok:true,message:"Sandbox checkout session তৈরি হয়েছে; প্রকৃত লেনদেন বা গ্রাহকের টাকা নেওয়া হয়নি।"});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Gateway test failed"},{status:503});}
}