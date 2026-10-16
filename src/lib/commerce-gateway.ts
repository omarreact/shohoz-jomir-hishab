import "server-only";
import type { GatewayConfig } from "@/src/lib/sslcommerz";
import { gatewayBase } from "@/src/lib/sslcommerz";

function credentials(config:GatewayConfig):URLSearchParams {
 if(!config.storeId||!config.password)throw new Error("SSLCommerz merchant credentials unavailable");
 return new URLSearchParams({store_id:config.storeId,store_passwd:config.password,format:"json"});
}
async function merchantQuery(config:GatewayConfig,params:URLSearchParams):Promise<Record<string,unknown>> {
 const url=new URL(gatewayBase(config)+"/validator/api/merchantTransIDvalidationAPI.php");
 params.forEach((value,key)=>url.searchParams.set(key,value));
 const response=await fetch(url,{method:"GET",cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error("SSLCommerz merchant API unavailable");
 const payload=await response.json() as Record<string,unknown>;
 if(payload.APIConnect!=="DONE")throw new Error("SSLCommerz merchant authorization failed");
 return payload;
}
export type TransactionInquiry={
 transactionId:string;gatewayStatus:string;amountBdt:number|null;bankTransactionId:string|null;
 riskLevel:number|null;validationId:string|null
};
export async function queryMerchantTransaction(config:GatewayConfig,transactionId:string):Promise<TransactionInquiry>{
 if(!/^LBD[A-F0-9]{24}$/.test(transactionId))throw new Error("Invalid transaction ID");
 const params=credentials(config);params.set("tran_id",transactionId);
 const data=await merchantQuery(config,params);
 const amount=Number(data.amount);
 return {transactionId:String(data.tran_id||""),gatewayStatus:String(data.status||"UNKNOWN"),
  amountBdt:Number.isFinite(amount)?amount:null,bankTransactionId:typeof data.bank_tran_id==="string"?data.bank_tran_id:null,
  riskLevel:data.risk_level===undefined?null:Number(data.risk_level),
  validationId:typeof data.val_id==="string"?data.val_id:null};
}
export type RefundInitiation={status:"success"|"processing"|"failed";refundReference:string|null;reason:string|null};
export async function initiateMerchantRefund(config:GatewayConfig,args:{
 bankTransactionId:string;refundTransactionId:string;amountBdt:number;reason:string
}):Promise<RefundInitiation>{
 if(!config.enabled)throw new Error("Merchant gateway is disabled");
 if(!/^[a-zA-Z0-9_-]{8,80}$/.test(args.bankTransactionId))throw new Error("Invalid bank transaction ID");
 if(!/^[A-Z0-9]{8,30}$/.test(args.refundTransactionId))throw new Error("Invalid refund transaction ID");
 if(!Number.isSafeInteger(Math.round(args.amountBdt*100))||args.amountBdt<=0||args.amountBdt>500000)throw new Error("Invalid amount");
 const params=credentials(config);
 params.set("bank_tran_id",args.bankTransactionId);
 params.set("refund_trans_id",args.refundTransactionId);
 params.set("refund_amount",args.amountBdt.toFixed(2));
 params.set("refund_remarks",args.reason.slice(0,255));
 params.set("v","1");
 const data=await merchantQuery(config,params);
 const status=String(data.status||"").toLowerCase();
 if(!["success","processing","failed"].includes(status))throw new Error("Unexpected refund response");
 return {status:status as RefundInitiation["status"],
  refundReference:typeof data.refund_ref_id==="string"?data.refund_ref_id:null,
  reason:typeof data.errorReason==="string"?data.errorReason.slice(0,300):null};
}
export type RefundInquiry={status:string;refundReference:string;bankTransactionId:string|null};
export async function queryMerchantRefund(config:GatewayConfig,reference:string):Promise<RefundInquiry>{
 if(!/^[a-zA-Z0-9_-]{5,80}$/.test(reference))throw new Error("Invalid refund reference");
 const params=credentials(config);params.set("refund_ref_id",reference);
 const data=await merchantQuery(config,params);
 return {status:String(data.status||"unknown").toLowerCase(),refundReference:reference,
  bankTransactionId:typeof data.bank_tran_id==="string"?data.bank_tran_id:null};
}
