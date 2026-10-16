/** Immutable safety decisions for admin-initiated SSLCommerz refunds. */
export type RefundOrder={id:string;status:string;amountBdt:number;bankTranId?:string|null;
 refundStatus?:string|null};
export function refundDecision(order:RefundOrder):{ok:boolean;reason:string|null}{
 if(!/^LBD[A-F0-9]{24}$/.test(order.id))return {ok:false,reason:"Invalid order ID"};
 if(order.status!=="paid"&&order.status!=="risk_hold")return {ok:false,reason:"Order is not settled"};
 if(order.refundStatus)return {ok:false,reason:"Refund already requested or recorded"};
 if(!order.bankTranId||!/^[a-zA-Z0-9_-]{8,80}$/.test(order.bankTranId))return {ok:false,reason:"Verified bank transaction ID missing"};
 if(!Number.isFinite(order.amountBdt)||order.amountBdt<=0||order.amountBdt>500000||
   Math.abs(Math.round(order.amountBdt*100)-order.amountBdt*100)>1e-7)return {ok:false,reason:"Invalid amount"};
 return {ok:true,reason:null};
}
export function refundStatusDecision(input:string):"refunded"|"processing"|"review"{
 if(input==="refunded")return "refunded";
 if(input==="processing")return "processing";
 return "review";
}
