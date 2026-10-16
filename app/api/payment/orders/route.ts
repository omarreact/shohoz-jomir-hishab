import { NextRequest,NextResponse } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{const user=await verifyServerAuth(req,{requireAdminBackend:true});
 const id=req.nextUrl.searchParams.get("tran_id")||"";
 if(!/^LBD[A-F0-9]{24}$/.test(id))return NextResponse.json({error:"Invalid transaction"},{status:400});
 const snap=await db.collection("landbdOrders").doc(id).get(),d=snap.data();
 if(!d||d.uid!==user.id)return NextResponse.json({error:"Order not found"},{status:404});
 return NextResponse.json({id,status:d.status,amountBdt:d.amountBdt,serviceId:d.serviceId,createdAt:d.createdAt,paidAt:d.paidAt||null},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"লগইন প্রয়োজন"},{status:401});}
}
