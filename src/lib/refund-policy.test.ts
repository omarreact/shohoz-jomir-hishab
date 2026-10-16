import {refundDecision,refundStatusDecision} from "./refund-policy";
const base={id:"LBDAABBCCDDEEFF001122334455",status:"paid",amountBdt:150,bankTranId:"BANK00000999"};
describe("refund safety contract",()=>{
 it("permits a single verified paid order",()=>expect(refundDecision(base).ok).toBe(true));
 it.each([
  {status:"initiated"},{status:"refunded"},{status:"failed"},{refundStatus:"requesting"},
  {refundStatus:"processing"},{bankTranId:null},{amountBdt:0},{amountBdt:500001},
 ])("refuses unsafe refund %p",(change)=>expect(refundDecision({...base,...change}).ok).toBe(false));
 it("does not mistake processing or unknown statuses for confirmation",()=>{
  expect(refundStatusDecision("processing")).toBe("processing");
  expect(refundStatusDecision("refunded")).toBe("refunded");
  expect(refundStatusDecision("unknown")).toBe("review");
 });
});
