import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {verifyAdminAuth} from "@/src/modules/auth/serverAuth";
import {db} from "@/src/modules/database/firebaseAdmin";
import {getGateway} from "@/src/lib/sslcommerz";
import {queryMerchantTransaction} from "@/src/lib/commerce-gateway";
import {allowRateLimit} from "@/src/modules/security/redisRateLimit";
export const runtime="nodejs";export const dynamic="force-dynamic";
const schema=z.object({transactionId:z.string().regex(/^LBD[A-F0-9]{24}$/)}).strict();
export async function POST(req:NextRequest){
 try{
  const admin=await verifyAdminAuth(req);
  if(req.headers.get("origin")!==req.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
  if(!await allowRateLimit("commerce-inquiry:"+admin.id,12,60))return NextResponse.json({error:"অনুরোধ সীমা অতিক্রম করেছে"},{status:429});
  const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:"Invalid ID"},{status:400});
  const reference=db.collection("landbdOrders").doc(parsed.data.transactionId);
  const snapshot=await reference.get();
  if(!snapshot.exists)return NextResponse.json({error:"Order not found"},{status:404});
  const config=await getGateway();
  if(!config.storeId||!config.password)return NextResponse.json({error:"মার্চেন্ট কনফিগারেশন অসম্পূর্ণ"},{status:503});
  const result=await queryMerchantTransaction(config,parsed.data.transactionId);
  if(result.transactionId!==parsed.data.transactionId)return NextResponse.json({error:"Provider transaction mismatch"},{status:502});
  await reference.update({reconciledAt:new Date().toISOString(),
    reconciliationStatus:result.gatewayStatus,reconciliationRiskLevel:result.riskLevel,
    reconciledBy:admin.id});
  // Inquiry deliberately NEVER activates an entitlement or marks an order paid.
  // Only the fully validated payment callback may do so.
  return NextResponse.json({ok:true,transactionId:result.transactionId,gatewayStatus:result.gatewayStatus,
    amountBdt:result.amountBdt,riskLevel:result.riskLevel},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"পেমেন্ট যাচাই করা যায়নি"},{status:503});
 }
}
