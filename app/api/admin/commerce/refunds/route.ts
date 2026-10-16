import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {verifySuperAdminAuth} from "@/src/modules/auth/serverAuth";
import {db} from "@/src/modules/database/firebaseAdmin";
import {getGateway} from "@/src/lib/sslcommerz";
import {initiateMerchantRefund,queryMerchantRefund} from "@/src/lib/commerce-gateway";
import {refundDecision,refundStatusDecision} from "@/src/lib/refund-policy";
import {allowRateLimit} from "@/src/modules/security/redisRateLimit";
export const runtime="nodejs";export const dynamic="force-dynamic";
const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("request"),orderId:z.string().regex(/^LBD[A-F0-9]{24}$/),
  confirmation:z.string().max(50),reason:z.string().trim().min(12).max(250)}).strict(),
 z.object({action:z.literal("status"),orderId:z.string().regex(/^LBD[A-F0-9]{24}$/)}).strict()
]);
const responseHeaders={"Cache-Control":"private, no-store"};
export async function POST(req:NextRequest){
 try{
  const actor=await verifySuperAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
  if(!await allowRateLimit("refund-admin:"+actor.id,6,60))return NextResponse.json({error:"অনুরোধ সীমা অতিক্রম করেছে"},{status:429});
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:"Invalid refund request"},{status:400});
  const command=parsed.data;
  const ref=db.collection("landbdOrders").doc(command.orderId);
  const config=await getGateway();
  if(!config.enabled||!config.password||!config.storeId)return NextResponse.json({error:"পেমেন্ট গেটওয়ে বন্ধ বা অসম্পূর্ণ"},{status:503});
  if(command.action==="status"){
   const order=(await ref.get()).data();
   if(!order?.refundReference)return NextResponse.json({error:"Refund reference not yet available; check merchant panel"},{status:409});
   const result=await queryMerchantRefund(config,order.refundReference);
   if(result.bankTransactionId&&result.bankTransactionId!==order.bankTranId)
     return NextResponse.json({error:"Bank transaction mismatch"},{status:502});
   const decision=refundStatusDecision(result.status);
   await db.runTransaction(async tx=>{
    const current=await tx.get(ref);const data=current.data();
    if(!data||data.refundReference!==order.refundReference)throw Error("Refund changed during check");
    // A settled refund may require manual credit reconciliation for legacy pooled entitlements.
    const next=decision==="refunded"?"refunded":decision==="processing"?"processing":"review";
    tx.update(ref,{refundStatus:next,status:next==="refunded"?"refunded":data.status,refundCheckedAt:new Date().toISOString(),
      refundRequiresEntitlementReview:next==="refunded"||data.refundRequiresEntitlementReview===true});
   });
   return NextResponse.json({ok:true,refundStatus:decision,refundReference:order.refundReference,
    requiresEntitlementReview:decision==="refunded"},{headers:responseHeaders});
  }
  if(command.confirmation!=="REFUND "+command.orderId)
   return NextResponse.json({error:"Confirmation text does not match"},{status:400});
  const requestedAt=new Date().toISOString(),refundTransactionId="R"+command.orderId;
  await db.runTransaction(async tx=>{
   const snapshot=await tx.get(ref),order=snapshot.data();
   if(!order)throw Error("Order not found");
   const decision=refundDecision({id:command.orderId,status:order.status,amountBdt:order.amountBdt,
    bankTranId:order.bankTranId,refundStatus:order.refundStatus});
   if(!decision.ok)throw Error(decision.reason||"Refund rejected");
   tx.update(ref,{refundStatus:"requesting",refundTransactionId,refundReason:command.reason,
    refundRequestedAt:requestedAt,refundRequestedBy:actor.id,refundRequiresEntitlementReview:true});
  });
  // External monetary side effect is never retried automatically. Any transport
  // uncertainty is flagged for manual merchant-panel reconciliation.
  const order=(await ref.get()).data()!;
  try{
   const result=await initiateMerchantRefund(config,{
    bankTransactionId:order.bankTranId,refundTransactionId,
    amountBdt:order.amountBdt,reason:command.reason
   });
   const next=result.status==="failed"?"review":"processing";
   await ref.update({refundStatus:next,refundReference:result.refundReference||null,
    refundProviderResponse:result.status,refundProviderMessage:result.reason||null,
    refundUpdatedAt:new Date().toISOString()});
   return NextResponse.json({ok:result.status!=="failed",refundStatus:next,
    refundReference:result.refundReference,providerStatus:result.status,
    message:result.status==="failed"?"Gateway rejected request; investigate manually":"Refund request sent to SSLCommerz"}, {headers:responseHeaders});
  }catch(e){
   await ref.update({refundStatus:"unknown",refundUpdatedAt:new Date().toISOString(),
    refundProviderMessage:e instanceof Error?e.message.slice(0,200):"Unknown failure"});
   return NextResponse.json({error:"অনিশ্চিত ফলাফল: মার্চেন্ট প্যানেলে যাচাই না করে আবার রিফান্ড পাঠাবেন না।",refundStatus:"unknown"},{status:503,headers:responseHeaders});
  }
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Refund unavailable"},{status:409,headers:responseHeaders});
 }
}
