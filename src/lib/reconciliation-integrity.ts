/**
 * A merchant inquiry is observational only. Unexpected gateway values are
 * recorded for operator investigation and must never grant an entitlement.
 */
export type ReconciliationIntegrity="matching"|"amount_mismatch"|"bank_reference_mismatch"|"incomplete";
export function assessReconciliation(
 order:{amountBdt:unknown;bankTranId:unknown},
 gateway:{amountBdt:number|null;bankTransactionId:string|null}
):ReconciliationIntegrity{
 const amount=order.amountBdt;
 if(typeof amount!=="number"||!Number.isFinite(amount)||amount<=0||
    gateway.amountBdt===null||!Number.isFinite(gateway.amountBdt))
   return "incomplete";
 if(Math.abs(Math.round(amount*100)-Math.round(gateway.amountBdt*100))>0)
   return "amount_mismatch";
 if(typeof order.bankTranId==="string"&&order.bankTranId.length>0){
   if(!gateway.bankTransactionId)return "incomplete";
   if(order.bankTranId!==gateway.bankTransactionId)return "bank_reference_mismatch";
 }
 return "matching";
}
