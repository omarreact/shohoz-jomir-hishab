/**
 * Deterministic, provider-independent payment validation. Never trust a browser
 * redirect, return URL, or unverified callback for entitlements.
 */
export type PurchaseSnapshot={serviceId:string;amountBdt:number;currency:string};
export type VerifiedGatewayResult={
 valid:boolean;gatewayConnected:boolean;tranId:string;serviceId:string;
 amount:number;currency:string;bankTranId:string;riskLevel:number;
};
export type PaymentDecision="accept"|"hold"|"reject";
export function assessGatewayPayment(
 order:PurchaseSnapshot,verification:VerifiedGatewayResult,transactionId:string
):PaymentDecision{
 if(!verification.valid||!verification.gatewayConnected||verification.tranId!==transactionId||
  verification.serviceId!==order.serviceId||verification.currency!=="BDT"||
  order.currency!=="BDT"||!Number.isFinite(verification.amount)||!Number.isFinite(order.amountBdt)||
  order.amountBdt<=0||Math.abs(verification.amount-order.amountBdt)>0.009||
  !verification.bankTranId||verification.bankTranId.length>100)return "reject";
 // Unknown or elevated risk is held for manual review, never auto-fulfilled.
 return verification.riskLevel===0?"accept":"hold";
}
