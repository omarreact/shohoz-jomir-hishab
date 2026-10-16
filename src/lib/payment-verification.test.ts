import { assessGatewayPayment,mayFulfillOrder,type VerifiedGatewayResult } from "./payment-verification";
const order={serviceId:"mouza-map",amountBdt:150,currency:"BDT"};
const good:VerifiedGatewayResult={valid:true,gatewayConnected:true,tranId:"LBD123",serviceId:"mouza-map",
 amount:150,currency:"BDT",bankTranId:"BANK-100",riskLevel:0};
describe("SSLCommerz verified entitlement decision",()=>{
 test("late IPNs never restore refunded or refund-in-progress benefits",()=>{
  expect(mayFulfillOrder({status:"paid"})).toBe(false);
  expect(mayFulfillOrder({status:"refunded"})).toBe(false);
  expect(mayFulfillOrder({status:"risk_hold",refundStatus:"requesting"})).toBe(false);
  expect(mayFulfillOrder({status:"risk_hold",refundStatus:"processing"})).toBe(false);
  expect(mayFulfillOrder({status:"pending"})).toBe(true);
 });
 test("accepts matching low-risk payment",()=>expect(assessGatewayPayment(order,good,"LBD123")).toBe("accept"));
 test("holds high-risk and unknown risk",()=>{
  expect(assessGatewayPayment(order,{...good,riskLevel:1},"LBD123")).toBe("hold");
  expect(assessGatewayPayment(order,{...good,riskLevel:NaN},"LBD123")).toBe("hold");
 });
 test.each([
  {valid:false},{gatewayConnected:false},{amount:149},{amount:151},{currency:"USD"},
  {serviceId:"dlrms-khatian"},{tranId:"LBDOTHER"},{bankTranId:""}
 ])("rejects mismatched or unverified gateway payload %p",(change)=>{
  expect(assessGatewayPayment(order,{...good,...change},"LBD123")).toBe("reject");
 });
});
