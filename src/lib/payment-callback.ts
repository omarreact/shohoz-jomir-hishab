import "server-only";
import { NextRequest,NextResponse } from "next/server";
import { db } from "@/src/modules/database/firebaseAdmin";
import { getGateway,verifyGateway } from "@/src/lib/sslcommerz";
import { isServiceId } from "@/src/lib/services-registry";
import { assessGatewayPayment,mayFulfillOrder } from "@/src/lib/payment-verification";

export type CallbackMode="success"|"fail"|"cancel"|"ipn";

function receiptRedirect(req:NextRequest,id:string):Response {
  const url=new URL("/checkout/result",req.url);
  url.searchParams.set("tran_id",id);
  return NextResponse.redirect(url,303);
}
export async function handlePaymentCallback(req:NextRequest,mode:CallbackMode):Promise<Response>{
  try{
    if(req.method==="POST"&&Number(req.headers.get("content-length")||"0")>10000)
      return NextResponse.json({error:"Request too large"},{status:413});
    const input=req.method==="GET"?req.nextUrl.searchParams:new URLSearchParams(await req.text());
    const tran=input.get("tran_id")||"";
    if(!/^LBD[A-F0-9]{24}$/.test(tran))return NextResponse.json({error:"Invalid transaction ID"},{status:400});
    // Do not mark failed/cancelled from unsigned public callbacks: anybody can call those URLs.
    // The authenticated order-status endpoint remains the source of truth.
    if(mode==="fail"||mode==="cancel")return receiptRedirect(req,tran);

    const validationId=input.get("val_id")||"";
    if(!/^[a-zA-Z0-9_-]{8,100}$/.test(validationId))
      return NextResponse.json({error:"Invalid validation ID"},{status:400});
    const config=await getGateway();
    const verified=await verifyGateway(config,validationId);
    const orderRef=db.collection("landbdOrders").doc(tran);
    const initial=await orderRef.get();
    const order=initial.data();
    if(!order||!isServiceId(order.serviceId))
      return NextResponse.json({error:"Transaction not found"},{status:404});
    const decision=assessGatewayPayment({
      serviceId:order.serviceId,amountBdt:order.amountBdt,currency:order.currency
    },verified,tran);
    if(decision==="reject")return NextResponse.json({error:"Gateway validation mismatch"},{status:400});
    if(decision==="hold"){
      await db.runTransaction(async tx=>{
        const current=await tx.get(orderRef);
        if(!current.exists||!mayFulfillOrder(current.data()!))return;
        tx.update(orderRef,{status:"risk_hold",riskLevel:verified.riskLevel,
          bankTranId:verified.bankTranId,validationId,verifiedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      });
      if(mode==="ipn")return NextResponse.json({ok:true,reviewRequired:true});
      return receiptRedirect(req,tran);
    }
    const entitlementRef=db.collection("landbdEntitlements").doc(order.uid+"_"+order.serviceId);
    await db.runTransaction(async tx=>{
      const current=await tx.get(orderRef);
      if(!current.exists)throw Error("Order missing");
      if(!mayFulfillOrder(current.data()!))return;
      // Re-read the original terms inside the transaction and preserve original purchase limits.
      const original=current.data()!;
      const previous=await tx.get(entitlementRef);
      const credits=original.usageLimitAtPurchase;
      // Legacy orders may not have a snapshot: unlimited access remains the conservative fallback.
      const quota=typeof credits==="number"&&Number.isSafeInteger(credits)&&credits>0?credits:null;
      const oldCredits=previous.data()?.remaining;
      const remaining=quota===null||oldCredits===null?null:(typeof oldCredits==="number"?oldCredits:0)+quota;
      tx.set(entitlementRef,{uid:original.uid,serviceId:original.serviceId,active:true,
        remaining,lastTransactionId:tran,updatedAt:new Date().toISOString()},{merge:true});
      tx.update(orderRef,{status:"paid",riskLevel:0,bankTranId:verified.bankTranId,
        validationId,paidAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    });
    if(mode==="ipn")return NextResponse.json({ok:true});
    return receiptRedirect(req,tran);
  }catch(e){
    console.error("[LandBD payment validation]",e instanceof Error?e.message:"unknown");
    return NextResponse.json({error:"Transaction verification unavailable"},{status:503});
  }
}