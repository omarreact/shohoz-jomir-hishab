import { NextRequest,NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 try{
  await verifyAdminAuth(req);
  const snapshot=await db.collection("landbdOrders").orderBy("createdAt","desc").limit(50).get();
  const orders=snapshot.docs.map(doc=>{const d=doc.data();
   return {id:doc.id,serviceId:String(d.serviceId||""),amountBdt:Number(d.amountBdt||0),
    status:String(d.status||""),riskLevel:d.riskLevel??null,createdAt:String(d.createdAt||""),
    paidAt:d.paidAt||null,refundStatus:d.refundStatus||null,refundReference:d.refundReference||null,
    reconciliationStatus:d.reconciliationStatus||null,refundRequiresEntitlementReview:d.refundRequiresEntitlementReview===true};
  });
  return NextResponse.json({orders},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"অর্ডারের তথ্য পাওয়া যায়নি"},{status:503});}
}
