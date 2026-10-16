import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { getGateway,saveGateway } from "@/src/lib/sslcommerz";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{await verifyAdminAuth(req);const {password,...data}=await getGateway();return NextResponse.json({...data,passwordConfigured:!!password},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"অনুমতি নেই"},{status:403});}
}
export async function PUT(req:NextRequest){
 try{
 await verifyAdminAuth(req);
 if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Origin denied"},{status:403});
 const data=z.object({enabled:z.boolean(),live:z.boolean(),storeId:z.string().max(100),password:z.string().max(200).optional(),
 successUrl:z.string().url(),failUrl:z.string().url(),cancelUrl:z.string().url(),ipnUrl:z.string().url()}).strict().safeParse(await req.json());
 if(!data.success)return NextResponse.json({error:"ভুল ইনপুট"},{status:400});
 const old=await getGateway(),v=data.data;
 for(const value of [v.successUrl,v.failUrl,v.cancelUrl,v.ipnUrl]){const u=new URL(value);if(u.protocol!=="https:"||u.hostname!=="landbd.pincodeit.com")return NextResponse.json({error:"Callback LandBD HTTPS ডোমেইনে হতে হবে"},{status:400});}
 if(v.enabled&&(!v.storeId||!(v.password||old.password)))return NextResponse.json({error:"Store ID ও Password প্রয়োজন"},{status:400});
 await saveGateway({...v,password:v.password||old.password});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"সংরক্ষণ ব্যর্থ"},{status:500});}
}
