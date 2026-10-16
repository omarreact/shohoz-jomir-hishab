import {assessReconciliation} from "./reconciliation-integrity";
describe("merchant reconciliation integrity",()=>{
 test("matching settled transaction",()=>expect(assessReconciliation(
  {amountBdt:120,bankTranId:"bank-1"},{amountBdt:120,bankTransactionId:"bank-1"}
 )).toBe("matching"));
 test("mismatched transaction amount",()=>expect(assessReconciliation(
  {amountBdt:120,bankTranId:null},{amountBdt:150,bankTransactionId:null}
 )).toBe("amount_mismatch"));
 test("mismatched bank transaction",()=>expect(assessReconciliation(
  {amountBdt:120,bankTranId:"bank-1"},{amountBdt:120,bankTransactionId:"bank-2"}
 )).toBe("bank_reference_mismatch"));
 test("missing gateway amount",()=>expect(assessReconciliation(
  {amountBdt:120,bankTranId:null},{amountBdt:null,bankTransactionId:null}
 )).toBe("incomplete"));
 test("rounds currency to smallest unit",()=>expect(assessReconciliation(
  {amountBdt:100.1,bankTranId:null},{amountBdt:100.10,bankTransactionId:null}
 )).toBe("matching"));
});
