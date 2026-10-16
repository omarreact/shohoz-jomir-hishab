import "server-only";
import { NextRequest,NextResponse } from "next/server";
import { db } from "@/src/modules/database/firebaseAdmin";
import { getGateway,verifyGateway } from "@/src/lib/sslcommerz";
import { getService,isServiceId } from "@/src/lib/services-registry";
export type CallbackMode="success"|"fail"|"cancel"|"ipn";
export async function handlePaymentCallback(req:NextRequest,mode:CallbackMode):Promise<Response>{
 try{
 const values=req.method==="GET"?req.nextUrl.searchParams:new URLSearchParams(await req.text());
 const tran=values.get("tran_id")||"";
 if(!/^LBD[A-F0-9]{24}$/.test(tran))return NextResponse.json({error:"Invalid transaction ID"},{status:400});
 const ref=db.collection("landbdOrders").doc(tran);
 if(mode==="cancel"||mode==="fail"){
  await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(snap.exists&&snap.data()?.status!=="paid")tx.update(ref,{status:mode==="fail"?"failed":"cancelled",updatedAt:new Date().toISOString()});});
 }else{
  const val=values.get("val_id")||"";
  const validation=await verifyGateway(await getGateway(),val);
  const initial=await ref.get(),order=initial.data();
  if(!order||!isServiceId(order.serviceId)||!validation.valid||validation.tranId!==tran||
   validation.serviceId!==order.serviceId||validation.currency!=="BDT"||!Number.isFinite(validation.amount)||
   Math.abs(validation.amount-order.amountBdt)>.009)
   return NextResponse.json({error:"Payment verification mismatch"},{status:400});
  const service=await getService(order.serviceId);
  const ent=db.collection("landbdEntitlements").doc(order.uid+"_"+order.serviceId);
  await db.runTransaction(async tx=>{
   const snap=await tx.get(ref);if(!snap.exists)throw Error("Missing order");
   if(snap.data()?.status==="paid")return;
   const previous=await tx.get(ent);
   const existing=previous.data()?.remaining;
   const remaining=service.usageLimit===null?null:(typeof existing==="number"?existing:0)+service.usageLimit;
   tx.set(ent,{uid:order.uid,serviceId:order.serviceId,active:true,remaining,lastTransactionId:tran,updatedAt:new Date().toISOString()},{merge:true});
   tx.update(ref,{status:"paid",bankTranId:validation.bankTranId,paidAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  });
 }
 if(mode==="ipn")return NextResponse.json({ok:true});
 const url=new URL("/checkout/result",req.url);url.searchParams.set("tran_id",tran);
 return NextResponse.redirect(url,303);
 }catch(e){
 console.error("[LandBD payment validation]",e instanceof Error?e.message:"error");
 return NextResponse.json({error:"Transaction verification unavailable"},{status:503});
 }
}
