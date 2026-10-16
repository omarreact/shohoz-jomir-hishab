import { NextRequest,NextResponse } from "next/server";
import { accessForRequest } from "@/src/lib/service-entitlement";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{const access=await accessForRequest(req,req.nextUrl.searchParams.get("serviceId"));
 return access?NextResponse.json(access,{headers:{"Cache-Control":"no-store"}}):NextResponse.json({error:"Invalid service"},{status:400});
 }catch{return NextResponse.json({error:"সেবা যাচাই ব্যর্থ"},{status:503});}
}
