import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
import { getServiceCatalog,isServiceId } from "@/src/lib/services-registry";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({id:z.string(),enabled:z.boolean(),paid:z.boolean(),
 priceBdt:z.number().min(0).max(1000000),
 discountBdt:z.number().min(0).max(1000000).nullable(),
 usageLimit:z.number().int().positive().max(1000000).nullable()}).strict();
export async function GET(req:NextRequest){
 try{await verifyAdminAuth(req);return NextResponse.json({services:await getServiceCatalog()},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"অনুমতি নেই"},{status:403});}
}
export async function PUT(req:NextRequest){
 try{
 const actor=await verifyAdminAuth(req);
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
 const parsed=schema.safeParse(await req.json());
 if(!parsed.success||!isServiceId(parsed.data?.id))return NextResponse.json({error:"অবৈধ সেবা/মূল্য"},{status:400});
 const data=parsed.data;
 if(data.discountBdt!==null&&data.discountBdt>data.priceBdt)return NextResponse.json({error:"ছাড় মূল্যের চেয়ে বেশি হতে পারে না"},{status:400});
 if(data.paid&&(data.priceBdt<10||data.priceBdt>500000||(data.discountBdt!==null&&data.discountBdt<10)))return NextResponse.json({error:"SSLCommerz পেইড সেবার মূল্য ও ছাড়ের পরিমাণ ১০–৫,০০,০০০ টাকার মধ্যে হতে হবে"},{status:400});
 await db.collection("landbdServicePricing").doc(data.id).set({...data,updatedAt:new Date().toISOString(),updatedBy:actor.id},{merge:true});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"সংরক্ষণ ব্যর্থ"},{status:500});}
}
